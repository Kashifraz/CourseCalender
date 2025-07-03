import React, { useEffect, useState } from 'react';
import { getTimetables, createTimetable, updateTimetable, deleteTimetable } from '../api/timetables';
import { getCourses } from '../api/courses';
import { getUser } from '../utils/auth';
import { Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyForm = { course: '', dayOfWeek: '', startTime: '', endTime: '', classroom: '' };
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TimetableList = () => {
  const [timetables, setTimetables] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const user = getUser();
  const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin');

  const fetchTimetables = async (courseId) => {
    try {
      const res = await getTimetables(courseId);
      setTimetables(res.data);
    } catch (err) {
      setError('Failed to fetch timetables');
    }
  };
  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  useEffect(() => { fetchCourses(); fetchTimetables(); }, []);

  const handleOpen = (timetable = emptyForm) => {
    setForm(timetable.course ? { ...timetable, course: timetable.course._id } : emptyForm);
    setEditingId(timetable._id || null);
    setOpen(true);
    setError('');
  };
  const handleClose = () => { setOpen(false); setForm(emptyForm); setEditingId(null); };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTimetable(editingId, form);
      } else {
        await createTimetable(form);
      }
      handleClose();
      fetchTimetables(filterCourse);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving timetable');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await deleteTimetable(id);
      fetchTimetables(filterCourse);
    } catch (err) {
      setError('Error deleting timetable');
    }
  };

  const handleFilter = e => {
    setFilterCourse(e.target.value);
    fetchTimetables(e.target.value);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Timetables</Typography>
      <FormControl sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel id="filter-course-label">Filter by Course</InputLabel>
        <Select labelId="filter-course-label" value={filterCourse} label="Filter by Course" onChange={handleFilter}>
          <MenuItem value="">All Courses</MenuItem>
          {courses.map(course => (
            <MenuItem key={course._id} value={course._id}>{course.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {isTeacherOrAdmin && (
        <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2, ml: 2 }}>
          Add Timetable
        </Button>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell>Day</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Classroom</TableCell>
              {isTeacherOrAdmin && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {timetables.map(tt => (
              <TableRow key={tt._id}>
                <TableCell>{tt.course?.name}</TableCell>
                <TableCell>{tt.dayOfWeek}</TableCell>
                <TableCell>{tt.startTime}</TableCell>
                <TableCell>{tt.endTime}</TableCell>
                <TableCell>{tt.classroom}</TableCell>
                {isTeacherOrAdmin && (
                  <TableCell>
                    <IconButton onClick={() => handleOpen(tt)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(tt._id)}><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingId ? 'Edit Timetable' : 'Add Timetable'}</DialogTitle>
        <DialogContent>
          <form id="timetable-form" onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="course-label">Course</InputLabel>
              <Select labelId="course-label" name="course" value={form.course} label="Course" onChange={handleChange} required>
                {courses.map(course => (
                  <MenuItem key={course._id} value={course._id}>{course.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="day-label">Day of Week</InputLabel>
              <Select labelId="day-label" name="dayOfWeek" value={form.dayOfWeek} label="Day of Week" onChange={handleChange} required>
                {days.map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Start Time" name="startTime" type="time" value={form.startTime} onChange={handleChange} fullWidth margin="normal" required InputLabelProps={{ shrink: true }} />
            <TextField label="End Time" name="endTime" type="time" value={form.endTime} onChange={handleChange} fullWidth margin="normal" required InputLabelProps={{ shrink: true }} />
            <TextField label="Classroom" name="classroom" value={form.classroom} onChange={handleChange} fullWidth margin="normal" required />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="timetable-form" variant="contained">{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimetableList; 