import React, { useEffect, useState } from 'react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../api/courses';
import { getUser } from '../utils/auth';
import { Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyForm = { code: '', name: '', creditHours: '', description: '' };

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = getUser();
  const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin');

  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleOpen = (course = emptyForm) => {
    setForm(course);
    setEditingId(course._id || null);
    setOpen(true);
    setError('');
    setSuccess('');
  };
  const handleClose = () => { setOpen(false); setForm(emptyForm); setEditingId(null); };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCourse(editingId, form);
        setSuccess('Course updated');
      } else {
        await createCourse(form);
        setSuccess('Course created');
      }
      handleClose();
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving course');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      fetchCourses();
    } catch (err) {
      setError('Error deleting course');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Courses</Typography>
      {isTeacherOrAdmin && (
        <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2 }}>
          Add Course
        </Button>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Credit Hours</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Teacher</TableCell>
              {isTeacherOrAdmin && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map(course => (
              <TableRow key={course._id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.creditHours}</TableCell>
                <TableCell>{course.description}</TableCell>
                <TableCell>{course.teacher?.name}</TableCell>
                {isTeacherOrAdmin && (
                  <TableCell>
                    <IconButton onClick={() => handleOpen(course)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(course._id)}><DeleteIcon /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingId ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <DialogContent>
          <form id="course-form" onSubmit={handleSubmit}>
            <TextField label="Code" name="code" value={form.code} onChange={handleChange} fullWidth margin="normal" required disabled={!!editingId} />
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
            <TextField label="Credit Hours" name="creditHours" type="number" value={form.creditHours} onChange={handleChange} fullWidth margin="normal" required />
            <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth margin="normal" />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="course-form" variant="contained">{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseList; 