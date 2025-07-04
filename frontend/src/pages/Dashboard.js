import React, { useEffect, useState } from 'react';
import { getUser, clearAuth } from '../utils/auth';
import { Box, Typography, Paper, Button, Avatar, Alert, CircularProgress, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useLocation } from 'react-router-dom';
import { getCourses } from '../api/courses';
import { getAttendanceHistory } from '../api/attendance';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4caf50', '#f44336', '#ffeb3b']; // Present, Absent, Not Marked
const STATUS_LABELS = ['Present', 'Absent', 'Not Marked'];

const getStats = (history) => {
  let present = 0, absent = 0, notMarked = 0;
  history.forEach(h => {
    if (h.status === 'present') present++;
    else if (h.status === 'absent') absent++;
    else notMarked++;
  });
  return [present, absent, notMarked];
};

const Dashboard = ({ onLogout }) => {
  const user = getUser();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'student') {
      setLoading(true);
      const fetchData = async () => {
        try {
          const res = await getCourses();
          setCourses(res.data);
          const statsObj = {};
          await Promise.all(res.data.map(async (course) => {
            try {
              const histRes = await getAttendanceHistory(course._id);
              const [present, absent, notMarked] = getStats(histRes.data);
              statsObj[course._id] = { present, absent, notMarked, total: histRes.data.length };
            } catch {
              statsObj[course._id] = { present: 0, absent: 0, notMarked: 0, total: 0 };
            }
          }));
          setStats(statsObj);
          setError('');
        } catch {
          setError('Failed to fetch courses or attendance');
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    if (onLogout) onLogout();
  };

  if (!user) return <Box p={4}><Typography>Not logged in.</Typography></Box>;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh" bgcolor="#f5f6fa">
      <Paper elevation={3} sx={{ p: 4, width: 350, textAlign: 'center', mb: 4 }}>
        {location.state?.forbidden && (
          <Alert severity="error" sx={{ mb: 2 }}>
            You are not authorized to access that page.
          </Alert>
        )}
        <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
          <PersonIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" mb={2}>Dashboard</Typography>
        <Typography><b>Name:</b> {user.name}</Typography>
        <Typography><b>Email:</b> {user.email}</Typography>
        <Typography><b>Role:</b> {user.role}</Typography>
        <Button variant="contained" color="secondary" fullWidth sx={{ mt: 3 }} onClick={handleLogout}>
          Logout
        </Button>
      </Paper>
      {user.role === 'student' && (
        <Box width="100%" maxWidth={1200}>
          <Typography variant="h5" mb={3} align="center">My Courses & Attendance Stats</Typography>
          {loading ? <Box p={3}><CircularProgress /></Box> : error ? <Box p={3}><Alert severity="error">{error}</Alert></Box> : (
            <Grid container spacing={3}>
              {courses.map(course => (
                <Grid item xs={12} md={6} lg={4} key={course._id}>
                  <Paper sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h6" mb={1}>{course.name}</Typography>
                    <Typography variant="body2" mb={2}>{course.description}</Typography>
                    <Typography mb={1}>
                      Present: <b>{stats[course._id]?.present}</b> | Absent: <b>{stats[course._id]?.absent}</b> | Not Marked: <b>{stats[course._id]?.notMarked}</b>
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={STATUS_LABELS.map((label, i) => ({ name: label, value: stats[course._id]?.[label.toLowerCase().replace(' ', '')] }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        >
                          {STATUS_LABELS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Dashboard; 