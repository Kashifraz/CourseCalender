import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { getToken } from '../utils/auth';

const NavBar = () => {
  const isAuthenticated = !!getToken();
  const location = useLocation();

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
            <Button color="inherit" component={Link} to="/dashboard" disabled={location.pathname === '/dashboard'}>
              Dashboard
            </Button>
          )}
          <Button color="inherit" component={Link} to="/courses" disabled={location.pathname === '/courses'}>
            Courses
          </Button>
          <Button color="inherit" component={Link} to="/timetables" disabled={location.pathname === '/timetables'}>
            Timetables
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 