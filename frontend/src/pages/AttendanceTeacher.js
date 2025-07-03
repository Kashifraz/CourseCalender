import React, { useState, useEffect } from 'react';
import { getCourses } from '../api/courses';
import { getTimetables } from '../api/timetables';
import { createSession, getSessionRecords } from '../api/attendance';
import { Box, Typography, Paper, Button, MenuItem, Select, InputLabel, FormControl, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';

const AttendanceTeacher = () => {
  const [courses, setCourses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTimetable, setSelectedTimetable] = useState('');
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourses().then(res => setCourses(res.data));
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      getTimetables(selectedCourse).then(res => setTimetables(res.data));
    } else {
      setTimetables([]);
    }
    setSelectedTimetable('');
  }, [selectedCourse]);

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      const timetable = timetables.find(t => t._id === selectedTimetable);
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const res = await createSession({
        course: selectedCourse,
        timetable: selectedTimetable,
        date: dateStr,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        durationMinutes: 10
      });
      setSession(res.data);
      fetchRecords(res.data._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (sessionId) => {
    try {
      const res = await getSessionRecords(sessionId);
      setRecords(res.data);
    } catch {
      setRecords([]);
    }
  };

  useEffect(() => {
    if (session) {
      const interval = setInterval(() => fetchRecords(session._id), 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Generate Attendance QR Code</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Course</InputLabel>
          <Select value={selectedCourse} label="Course" onChange={e => setSelectedCourse(e.target.value)}>
            <MenuItem value="">Select Course</MenuItem>
            {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" disabled={!selectedCourse}>
          <InputLabel>Timetable</InputLabel>
          <Select value={selectedTimetable} label="Timetable" onChange={e => setSelectedTimetable(e.target.value)}>
            <MenuItem value="">Select Timetable</MenuItem>
            {timetables.map(t => <MenuItem key={t._id} value={t._id}>{t.dayOfWeek} {t.startTime}-{t.endTime} ({t.classroom})</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleGenerate} disabled={!selectedCourse || !selectedTimetable || loading}>
          {loading ? <CircularProgress size={24} /> : 'Generate QR Code'}
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {session && (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" mb={2}>Attendance QR Code (valid for 10 min)</Typography>
          <QRCodeCanvas value={session.qrCode} size={256} />
          <Typography mt={2}>Session ID: {session._id}</Typography>
        </Paper>
      )}
      {session && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Attendance Records</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Student Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r._id}>
                    <TableCell>{r.student?.name}</TableCell>
                    <TableCell>{r.student?.email}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{new Date(r.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceTeacher; 