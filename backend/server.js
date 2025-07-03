const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const timetableRoutes = require('./routes/timetables');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
connectDB();
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timetables', timetableRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 