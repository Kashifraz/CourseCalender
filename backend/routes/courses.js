const express = require('express');
const Course = require('../models/Course');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create a course (teacher/admin)
router.post('/', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { code, name, creditHours, description } = req.body;
    const teacher = req.user.userId;
    const course = new Course({ code, name, creditHours, description, teacher });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// List all courses
router.get('/', auth, async (req, res) => {
  const courses = await Course.find().populate('teacher', 'name email');
  res.json(courses);
});

// Get course details
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: 'Invalid course ID' });
  }
});

// Update course (teacher/admin)
router.put('/:id', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete course (teacher/admin)
router.delete('/:id', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid course ID' });
  }
});

module.exports = router; 