import Course from '../models/Course.js';
import Material from '../models/Material.js';
import Enrollment from '../models/Enrollment.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private (Faculty, Admin)
 */
export const createCourse = asyncHandler(async (req, res) => {
  const { courseCode, title, department, credits, semester } = req.body;

  if (!courseCode || !title || !department || !credits || !semester) {
    throw new ApiError(400, 'Please provide courseCode, title, department, credits, and semester');
  }

  const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
  if (existingCourse) {
    throw new ApiError(400, `Course code '${courseCode}' already exists`);
  }

  const course = await Course.create({
    courseCode: courseCode.toUpperCase(),
    title: title.trim(),
    department: department.trim(),
    credits,
    semester: semester.trim(),
    faculty: req.user.role === 'faculty' ? req.user._id : req.body.faculty || req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, course, 'Course created successfully'));
});

/**
 * @desc    Get all courses (with optional department/semester filtering & enrollment status)
 * @route   GET /api/courses
 * @access  Private
 */
export const getCourses = asyncHandler(async (req, res) => {
  const { department, semester, myCourses } = req.query;
  let query = {};

  if (department) query.department = department;
  if (semester) query.semester = semester;

  // If faculty wants only courses they teach
  if (req.user.role === 'faculty' && myCourses === 'true') {
    query.faculty = req.user._id;
  }

  // Fetch enrolled course IDs if student requests myCourses
  let enrolledCourseIds = [];
  if (req.user.role === 'student') {
    const studentEnrollments = await Enrollment.find({ 
      student: req.user._id, 
      status: 'enrolled' 
    }).select('course');

    enrolledCourseIds = studentEnrollments.map((e) => e.course.toString());

    if (myCourses === 'true') {
      query._id = { $in: enrolledCourseIds };
    }
  }

  const courses = await Course.find(query)
    .populate('faculty', 'name email department')
    .sort({ courseCode: 1 })
    .lean(); // Return plain JS objects so we can attach custom flags

  // Attach `isEnrolled` boolean flag for student requests
  const formattedCourses = courses.map((course) => ({
    ...course,
    isEnrolled: enrolledCourseIds.includes(course._id.toString()),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, formattedCourses, 'Courses retrieved successfully'));
});

/**
 * @desc    Enroll student in a course (Creates/Updates junction record in Enrollment collection)
 * @route   POST /api/courses/:id/enroll
 * @access  Private (Student)
 */
export const enrollInCourse = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;

  // 1. Guard check for authenticated user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'Authentication required. Student profile not found.');
  }

  // 2. Validate MongoDB ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, 'Invalid course ID format.');
  }

  // 3. Find course and verify it is active
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  if (course.isActive === false) {
    throw new ApiError(400, 'This course is currently inactive and not accepting enrollments.');
  }

  // 4. Check for existing enrollment record
  let enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (enrollment) {
    // Handle case where student previously dropped but wants to re-enroll
    if (enrollment.status === 'enrolled') {
      throw new ApiError(400, 'You are already enrolled in this course.');
    }

    // Reactivate enrollment if previously dropped
    enrollment.status = 'enrolled';
    await enrollment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, enrollment, `Re-enrolled in ${course.courseCode} successfully`));
  }

  // 5. Create new enrollment record
  try {
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: 'enrolled',
    });
  } catch (err) {
    // Handle edge-case race conditions for MongoDB unique compound index
    if (err.code === 11000) {
      throw new ApiError(400, 'You are already enrolled in this course.');
    }
    throw err;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, enrollment, `Enrolled in ${course.courseCode} successfully`));
});

/**
 * @desc    Upload study material for a course
 * @route   POST /api/courses/:id/materials
 * @access  Private (Faculty, Admin)
 */
export const addCourseMaterial = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;
  const { title, description, fileUrl, fileType } = req.body;

  if (!title || !fileUrl) {
    throw new ApiError(400, 'Title and file URL are required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to add materials to this course');
  }

  const material = await Material.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    course: courseId,
    uploadedBy: req.user._id,
    fileUrl,
    fileType: fileType || 'pdf',
  });

  return res
    .status(201)
    .json(new ApiResponse(201, material, 'Material uploaded successfully'));
});

/**
 * @desc    Get all study materials for a specific course
 * @route   GET /api/courses/:id/materials
 * @access  Private
 */
export const getCourseMaterials = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const materials = await Material.find({ course: courseId })
    .populate('uploadedBy', 'name role')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, materials, 'Course materials fetched successfully'));
});