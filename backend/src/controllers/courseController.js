import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Material from '../models/Material.js';
import Enrollment from '../models/Enrollment.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

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

  const normalizedCode = courseCode.trim().toUpperCase();

  // Assign faculty based on user role
  const assignedFaculty = req.user.role === 'faculty' ? req.user._id : req.body.faculty || req.user._id;

  try {
    const course = await Course.create({
      courseCode: normalizedCode,
      title: title.trim(),
      department: department.trim(),
      credits,
      semester: semester.trim(),
      faculty: assignedFaculty,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, course, 'Course created successfully'));
  } catch (error) {
    // Catch MongoDB duplicate key error for unique courseCode
    if (error.code === 11000) {
      throw new ApiError(400, `Course code '${normalizedCode}' already exists`);
    }
    throw error;
  }
});

/**
 * @desc    Get all courses (with optional department/semester filtering & enrollment status)
 * @route   GET /api/courses
 * @access  Private
 */
export const getCourses = asyncHandler(async (req, res) => {
  // FIX: Destructure 'enrolled' alongside other query parameters to prevent ReferenceError
  const { department, semester, myCourses, enrolled } = req.query;
  const query = {};

  if (department) query.department = department.trim();
  if (semester) query.semester = semester.trim();

  // Faculty filtering: view only self-instructed courses
  if (req.user?.role === 'faculty' && myCourses === 'true') {
    query.faculty = req.user._id;
  }

  let enrolledCourseIds = [];

  // Student filtering: resolve active enrollments safely
  if (req.user?.role === 'student') {
    const studentEnrollments = await Enrollment.find({
      student: req.user._id,
      status: 'enrolled',
    }).select('course');

    enrolledCourseIds = studentEnrollments
      .filter((e) => e.course) // Guard against null references if a course was deleted
      .map((e) => e.course.toString());

    // If filtering specifically for enrolled courses
    if (myCourses === 'true' || enrolled === 'true') {
      if (enrolledCourseIds.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], 'No enrolled courses found'));
      }
      query._id = { $in: enrolledCourseIds };
    }
  }

  const courses = await Course.find(query)
    .populate('faculty', 'name email department')
    .sort({ courseCode: 1 })
    .lean();

  // Augment response with dynamic isEnrolled metadata flag for the frontend UI
  const formattedCourses = courses.map((course) => ({
    ...course,
    isEnrolled: enrolledCourseIds.includes(course._id.toString()),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, formattedCourses, 'Courses retrieved successfully'));
});

/**
 * @desc    Enroll student in a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private (Student)
 */
export const enrollInCourse = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, 'Invalid course ID format.');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  if (course.isActive === false) {
    throw new ApiError(400, 'This course is currently inactive and not accepting enrollments.');
  }

  let enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (enrollment) {
    if (enrollment.status === 'enrolled') {
      throw new ApiError(400, 'You are already enrolled in this course.');
    }

    // Reactivate previously dropped enrollment
    enrollment.status = 'enrolled';
    await enrollment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, enrollment, `Re-enrolled in ${course.courseCode} successfully`));
  }

  try {
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: 'enrolled',
    });
  } catch (err) {
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
 * @desc    Drop an enrolled course
 * @route   DELETE /api/courses/:id/drop
 * @access  Private (Student)
 */
export const dropCourse = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, 'Invalid course ID format.');
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: 'enrolled',
  });

  if (!enrollment) {
    throw new ApiError(404, 'Active enrollment record not found for this course.');
  }

  enrollment.status = 'dropped';
  await enrollment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, enrollment, 'Course dropped successfully.'));
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

  // Authorize faculty ownership check
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

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, 'Invalid course ID format.');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const materials = await Material.find({ course: courseId })
    .populate('uploadedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, materials, 'Course materials fetched successfully'));
});