import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { getToken, getUser } from '../utils/auth';

const NavBar = () => {
  const isAuthenticated = !!getToken();
  const location = useLocation();
  const user = getUser();
  const role = user?.role;

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Course Management
        </Typography>
        <Box>
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/login" disabled={location.pathname === '/login'}>
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register" disabled={location.pathname === '/register'}>
                Register
              </Button>
            </>
          )}
          {isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/dashboard" disabled={location.pathname === '/dashboard'}>
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/courses" disabled={location.pathname === '/courses'}>
                Courses
              </Button>
              <Button color="inherit" component={Link} to="/timetables" disabled={location.pathname === '/timetables'}>
                Timetables
              </Button>
              <Button color="inherit" component={Link} to="/calendar" disabled={location.pathname === '/calendar'}>
                Calendar
              </Button>
              {role === 'teacher' || role === 'admin' ? (
                <Button color="inherit" component={Link} to="/attendance-teacher" disabled={location.pathname === '/attendance-teacher'}>
                  Attendance (Teacher)
                </Button>
              ) : null}
              {role === 'student' ? (
                <Button color="inherit" component={Link} to="/attendance-student" disabled={location.pathname === '/attendance-student'}>
                  Attendance (Student)
                </Button>
              ) : null}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 