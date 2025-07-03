import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getTimetables } from '../api/timetables';
import { getCourses } from '../api/courses';
import { Box, Typography, Paper, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

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
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  const events = timetables.map(tt => {
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

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Class Calendar</Typography>
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
  return (
    <b>{eventInfo.event.title}</b>
  );
}

export default CalendarView; 