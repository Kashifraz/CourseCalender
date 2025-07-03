const express = require('express');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const { auth, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Helper to generate a random QR code string
function generateQRCodeString() {
  return crypto.randomBytes(16).toString('hex');
}

// Teacher: Create attendance session & QR code
router.post('/session', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { course, timetable, date, startTime, endTime, durationMinutes } = req.body;
    const qrCode = generateQRCodeString();
    const expiresAt = new Date(Date.now() + (durationMinutes || 10) * 60000);
    const session = new AttendanceSession({
      course,
      timetable,
      date,
      startTime,
      endTime,
      qrCode,
      expiresAt
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get session details (for QR code display)
router.get('/session/:id', auth, async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('course timetable');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: 'Invalid session ID' });
  }
});

// Student: Scan QR code to mark attendance
router.post('/scan', auth, requireRole('student'), async (req, res) => {
  try {
    const { qrCode } = req.body;
    const session = await AttendanceSession.findOne({ qrCode });
    if (!session) return res.status(404).json({ message: 'Invalid QR code' });
    if (new Date() > session.expiresAt) return res.status(400).json({ message: 'QR code expired' });
    // Prevent duplicate attendance
    const existing = await AttendanceRecord.findOne({ session: session._id, student: req.user.userId });
    if (existing) return res.status(400).json({ message: 'Attendance already marked' });
    const record = new AttendanceRecord({ session: session._id, student: req.user.userId });
    await record.save();
    res.json({ message: 'Attendance marked', record });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Teacher: Get attendance records for a session
router.get('/session/:id/records', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ session: req.params.id }).populate('student', 'name email');
    res.json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Student: Get attendance history for a course
router.get('/history/:courseId', auth, requireRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    // Find all sessions for this course
    const sessions = await AttendanceSession.find({ course: courseId });
    const sessionIds = sessions.map(s => s._id);
    // Find all records for this student in these sessions
    const records = await AttendanceRecord.find({ session: { $in: sessionIds }, student: req.user.userId })
      .populate('session');
    // Map to calendar-friendly format
    const history = records.map(r => ({
      date: r.session.date,
      startTime: r.session.startTime,
      endTime: r.session.endTime,
      status: r.status,
      sessionId: r.session._id,
    }));
    res.json(history);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Student: Get all sessions for a course with attendance status
router.get('/calendar/:courseId', auth, requireRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const sessions = await AttendanceSession.find({ course: courseId }).sort({ date: 1 });
    const records = await AttendanceRecord.find({ student: req.user.userId });
    const recordMap = {};
    records.forEach(r => { recordMap[r.session.toString()] = r.status; });
    const now = new Date();
    const result = sessions.map(s => {
      let status = 'upcoming';
      const sessionEnd = new Date(s.date);
      const [endHour, endMinute] = s.endTime.split(':');
      sessionEnd.setHours(Number(endHour), Number(endMinute), 0, 0);
      if (sessionEnd < now) {
        if (recordMap[s._id.toString()] === 'present') {
          status = 'present';
        } else if (recordMap[s._id.toString()] === 'absent') {
          status = 'absent';
        } else {
          status = 'not_marked';
        }
      }
      return {
        sessionId: s._id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        status,
      };
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 