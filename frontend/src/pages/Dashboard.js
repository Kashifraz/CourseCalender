import React from 'react';
import { getUser, clearAuth } from '../utils/auth';

const Dashboard = ({ onLogout }) => {
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    if (onLogout) onLogout();
  };

  if (!user) return <div>Not logged in.</div>;

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Dashboard</h2>
      <div><b>Name:</b> {user.name}</div>
      <div><b>Email:</b> {user.email}</div>
      <div><b>Role:</b> {user.role}</div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard; 