import React, { useState } from 'react';
import { scanQRCode } from '../api/attendance';
import { Box, Typography, Paper, Alert, Button, CircularProgress } from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';

const AttendanceStudent = () => {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [scanned, setScanned] = useState(false);

  const handleScan = async (qr) => {
    if (!qr || scanned) return;
    setScanned(true);
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await scanQRCode(qr);
      setResult(qr);
      setSuccess('Attendance marked successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 3000); // allow rescan after 3s
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Scan Attendance QR Code</Typography>
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Scanner
          onScan={data => handleScan(data?.[0]?.rawValue)}
          onError={err => setError('Camera error')}
          styles={{ container: { width: '100%', maxWidth: 400, margin: '0 auto' } }}
        />
        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {result && (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography>Last scanned QR: <b>{result}</b></Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceStudent; 