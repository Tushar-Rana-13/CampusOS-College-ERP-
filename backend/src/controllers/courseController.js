import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private (Admin only)
 */
export const createCourse = asyncHandler(async (req, res) => {
  const { courseCode, title, department, credits, facultyId, semester } = req.body;

  if (!courseCode || !title || !department || !credits || !facultyId || !semester) {
    res.status(400);
    throw new Error('Please fill in all required course fields');
  }

  // Verify that assigned faculty exists and actually has the 'faculty' role
  const facultyUser = await User.findById(facultyId);
  if (!facultyUser || facultyUser.role !== 'faculty') {
    res.status(400);
    throw new Error('Assigned user must exist and have the faculty role');
  }

  const courseExists = await Course.findOne({ courseCode: courseCode.toUpperCase() });
  if (courseExists) {
    res.status(400);
    throw new Error(`Course with code '${courseCode}' already exists`);
  }

  const course = await Course.create({
    courseCode,
    title,
    department,
    credits,
    faculty: facultyId,
    semester,
  });

  await course.populate('faculty', 'name email');

  res.status(201).json({
    message: 'Course created successfully',
    course,
  });
});

/**
 * @desc    Get courses (Role-aware: Admins see all; Faculty see their assigned; Students see their enrolled)
 * @route   GET /api/courses
 * @access  Private
 */
export const getCourses = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;

  if (role === 'admin') {
    const courses = await Course.find().populate('faculty', 'name email');
    return res.status(200).json({ count: courses.length, courses });
  }

  if (role === 'faculty') {
    const courses = await Course.find({ faculty: _id });
    return res.status(200).json({ count: courses.length, courses });
  }

  if (role === 'student') {
    // Find all enrollments for this student and populate course details
    const enrollments = await Enrollment.find({ student: _id }).populate({
      path: 'course',
      populate: { path: 'faculty', select: 'name email' },
    });

    const courses = enrollments.map((e) => e.course);
    return res.status(200).json({ count: courses.length, courses });
  }
});

/**
 * @desc    Enroll a student into a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private (Admin or Self-Enrollment for Students)
 */
export const enrollStudent = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  // If studentId is provided in body (Admin action), use it; otherwise, use logged-in student's ID
  const studentId = req.body.studentId || req.user._id;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const studentUser = await User.findById(studentId);
  if (!studentUser || studentUser.role !== 'student') {
    res.status(400);
    throw new Error('Invalid student user');
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (existingEnrollment) {
    res.status(400);
    throw new Error('Student is already enrolled in this course');
  }

  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
  });

  res.status(201).json({
    message: 'Student enrolled successfully',
    enrollment,
  });
});