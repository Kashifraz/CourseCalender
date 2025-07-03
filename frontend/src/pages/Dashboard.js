import React from 'react';
import { getUser, clearAuth } from '../utils/auth';
import { Box, Typography, Paper, Button, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const Dashboard = ({ onLogout }) => {
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    if (onLogout) onLogout();
  };

  if (!user) return <Box p={4}><Typography>Not logged in.</Typography></Box>;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f6fa">
      <Paper elevation={3} sx={{ p: 4, width: 350, textAlign: 'center' }}>
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
    </Box>
  );
};

export default Dashboard; 