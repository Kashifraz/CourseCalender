import React, { useEffect, useState } from 'react';
import { getCourses, createCourse, updateCourse, deleteCourse, enrollStudent, getEnrolledStudents, removeEnrolledStudent } from '../api/courses';
import { getUser } from '../utils/auth';
import { Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

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
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const navigate = useNavigate();

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
    if (isTeacherOrAdmin && course._id) {
      setSelectedCourseId(course._id);
      fetchEnrolledStudents(course._id);
    } else {
      setSelectedCourseId(null);
      setEnrolledStudents([]);
    }
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

  const fetchEnrolledStudents = async (courseId) => {
    try {
      const res = await getEnrolledStudents(courseId);
      setEnrolledStudents(res.data);
    } catch {
      setEnrolledStudents([]);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollSuccess('');
    try {
      await enrollStudent(selectedCourseId, enrollEmail);
      setEnrollSuccess('Student enrolled');
      setEnrollEmail('');
      fetchEnrolledStudents(selectedCourseId);
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Failed to enroll student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the course?')) return;
    try {
      await removeEnrolledStudent(selectedCourseId, studentId);
      fetchEnrolledStudents(selectedCourseId);
    } catch {
      setEnrollError('Failed to remove student');
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
                    <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => navigate(`/courses/${course._id}/students`)}>
                      View Enrolled Students
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <DialogContent>
          <form id="course-form" onSubmit={handleSubmit}>
            <TextField label="Code" name="code" value={form.code} onChange={handleChange} fullWidth margin="normal" required disabled={!!editingId} />
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
            <TextField label="Credit Hours" name="creditHours" type="number" value={form.creditHours} onChange={handleChange} fullWidth margin="normal" required />
            <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth margin="normal" />
          </form>
          {isTeacherOrAdmin && editingId && (
            <Box mt={3}>
              <Typography variant="h6" mb={1}>Enrolled Students</Typography>
              <form onSubmit={handleEnroll} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <TextField label="Student Email" value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} size="small" />
                <Button type="submit" variant="contained">Add</Button>
              </form>
              {enrollError && <Alert severity="error" sx={{ mb: 1 }}>{enrollError}</Alert>}
              {enrollSuccess && <Alert severity="success" sx={{ mb: 1 }}>{enrollSuccess}</Alert>}
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrolledStudents.map(s => (
                      <TableRow key={s._id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>
                          <Button color="error" size="small" onClick={() => handleRemoveStudent(s._id)}>Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
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