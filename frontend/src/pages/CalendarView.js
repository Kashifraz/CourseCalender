import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getTimetables } from '../api/timetables';
import { getCourses } from '../api/courses';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';

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
    // Calculate next occurrence of the dayOfWeek
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
      },
    };
  });

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
            />
        }
      </Paper>
    </Box>
  );
};

function renderEventContent(eventInfo) {
  return (
    <>
      <b>{eventInfo.event.title}</b><br />
      <span>{eventInfo.timeText}</span><br />
      <span>{eventInfo.event.extendedProps.classroom}</span>
    </>
  );
}

export default CalendarView; 