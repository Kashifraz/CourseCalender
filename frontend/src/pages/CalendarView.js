import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getTimetables } from '../api/timetables';
import { getCourses } from '../api/courses';
import { getAttendanceHistory } from '../api/attendance';
import { getUser } from '../utils/auth';
import { Box, Typography, Paper, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

const dayToIndex = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
  'Sunday': 0,
};

function getNextDate(dayOfWeek) {
  const today = new Date();
  const resultDate = new Date(today);
  const day = dayToIndex[dayOfWeek];
  const diff = (day + 7 - today.getDay()) % 7;
  resultDate.setDate(today.getDate() + diff);
  return resultDate;
}

const CalendarView = () => {
  const [timetables, setTimetables] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const user = getUser();
  const isStudent = user?.role === 'student';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ttRes, cRes] = await Promise.all([
          getTimetables(),
          getCourses()
        ]);
        setTimetables(ttRes.data);
        setCourses(cRes.data);
      } catch (err) {
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isStudent && selectedCourse) {
      setLoading(true);
      getAttendanceHistory(selectedCourse)
        .then(res => setAttendanceHistory(res.data))
        .catch(() => setAttendanceHistory([]))
        .finally(() => setLoading(false));
    }
  }, [isStudent, selectedCourse]);

  // Timetable events (for all users)
  const timetableEvents = timetables.map(tt => {
    const course = courses.find(c => c._id === (tt.course._id || tt.course));
    const startDate = getNextDate(tt.dayOfWeek);
    const [startHour, startMinute] = tt.startTime.split(':');
    const [endHour, endMinute] = tt.endTime.split(':');
    const start = new Date(startDate);
    start.setHours(Number(startHour), Number(startMinute), 0, 0);
    const end = new Date(startDate);
    end.setHours(Number(endHour), Number(endMinute), 0, 0);
    return {
      id: tt._id,
      title: course ? course.name : 'Course',
      start,
      end,
      extendedProps: {
        classroom: tt.classroom,
        teacher: course?.teacher?.name,
        description: course?.description,
        dayOfWeek: tt.dayOfWeek,
        startTime: tt.startTime,
        endTime: tt.endTime,
      },
    };
  });

  // Attendance events (for students, for selected course)
  const attendanceEvents = isStudent && selectedCourse
    ? attendanceHistory.map(a => {
        const start = new Date(a.date);
        const [startHour, startMinute] = a.startTime.split(':');
        const [endHour, endMinute] = a.endTime.split(':');
        start.setHours(Number(startHour), Number(startMinute), 0, 0);
        const end = new Date(a.date);
        end.setHours(Number(endHour), Number(endMinute), 0, 0);
        return {
          id: a.sessionId,
          title: a.status === 'present' ? 'Present' : 'Absent',
          start,
          end,
          backgroundColor: a.status === 'present' ? '#4caf50' : '#f44336',
          borderColor: a.status === 'present' ? '#4caf50' : '#f44336',
          textColor: '#fff',
          extendedProps: { status: a.status },
        };
      })
    : [];

  // Show timetable events for non-students, attendance events for students
  const events = isStudent && selectedCourse ? attendanceEvents : timetableEvents;

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Class Calendar</Typography>
      {isStudent && (
        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel id="select-course-label">Select Course</InputLabel>
          <Select
            labelId="select-course-label"
            value={selectedCourse}
            label="Select Course"
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <MenuItem value="">All Courses</MenuItem>
            {courses.map(course => (
              <MenuItem key={course._id} value={course._id}>{course.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <Paper sx={{ p: 2 }}>
        {loading ? <CircularProgress /> :
          error ? <Alert severity="error">{error}</Alert> :
            <FullCalendar
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,dayGridMonth' }}
              events={events}
              height={650}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
            />
        }
      </Paper>
      <Dialog open={!!selectedEvent} onClose={handleCloseDialog}>
        <DialogTitle>Class Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="h6" mb={1}>{selectedEvent.title}</Typography>
              <Typography><b>Day:</b> {selectedEvent.extendedProps.dayOfWeek}</Typography>
              <Typography><b>Time:</b> {selectedEvent.extendedProps.startTime} - {selectedEvent.extendedProps.endTime}</Typography>
              <Typography><b>Classroom:</b> {selectedEvent.extendedProps.classroom}</Typography>
              {selectedEvent.extendedProps.teacher && (
                <Typography><b>Teacher:</b> {selectedEvent.extendedProps.teacher}</Typography>
              )}
              {selectedEvent.extendedProps.description && (
                <Typography mt={1}><b>Description:</b> {selectedEvent.extendedProps.description}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function renderEventContent(eventInfo) {
  // For attendance events, show status with color
  if (eventInfo.event.extendedProps.status) {
    return (
      <b style={{ color: '#fff' }}>{eventInfo.event.title}</b>
    );
  }
  // For timetable events, show course name
  return (
    <b>{eventInfo.event.title}</b>
  );
}

export default CalendarView; 