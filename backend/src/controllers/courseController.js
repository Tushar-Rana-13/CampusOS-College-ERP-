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
  const { courseCode, title, department, credits, semester, maxStudents } = req.body;

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
      maxStudents: maxStudents || 60,
      faculty: assignedFaculty,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, course, 'Course created successfully'));
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, `Course code '${normalizedCode}' already exists`);
    }
    throw error;
  }
});

/**
 * @desc    Get all courses (with department/semester filtering, enrollment status, & dynamic seat count)
 * @route   GET /api/courses
 * @access  Private
 */
export const getCourses = asyncHandler(async (req, res) => {
  const { department, semester, myCourses, enrolled } = req.query;
  const query = {};

  if (department) query.department = department.trim();
  if (semester) query.semester = semester.trim();

  if (req.user?.role === 'faculty' && myCourses === 'true') {
    query.faculty = req.user._id;
  }

  let enrolledCourseIds = [];

  if (req.user?.role === 'student') {
    const studentEnrollments = await Enrollment.find({
      student: req.user._id,
      status: 'enrolled',
    }).select('course');

    enrolledCourseIds = studentEnrollments
      .filter((e) => e.course)
      .map((e) => e.course.toString());

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

  // Compute active enrollment counts per course efficiently
  const courseIds = courses.map((c) => c._id);
  const enrollmentCounts = await Enrollment.aggregate([
    { $match: { course: { $in: courseIds }, status: 'enrolled' } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);

  const countMap = enrollmentCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  // Augment courses with isEnrolled and seat counts
  const formattedCourses = courses.map((course) => {
    const activeCount = countMap[course._id.toString()] || 0;
    const capacity = course.maxStudents || 60;
    return {
      ...course,
      enrolledCount: activeCount,
      isFull: activeCount >= capacity,
      isEnrolled: enrolledCourseIds.includes(course._id.toString()),
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, formattedCourses, 'Courses retrieved successfully'));
});

/**
 * @desc    Get single course details by ID
 * @route   GET /api/courses/:id
 * @access  Private
 */
export const getCourseDetails = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, 'Invalid course ID format.');
  }

  const course = await Course.findById(courseId)
    .populate('faculty', 'name email department')
    .lean();

  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  // Count total enrolled students
  const enrolledCount = await Enrollment.countDocuments({
    course: courseId,
    status: 'enrolled',
  });

  // Check current user enrollment status
  let isEnrolled = false;
  if (req.user?.role === 'student') {
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: 'enrolled',
    });
    isEnrolled = Boolean(existingEnrollment);
  }

  const capacity = course.maxStudents || 60;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...course,
        enrolledCount,
        isFull: enrolledCount >= capacity,
        isEnrolled,
      },
      'Course details fetched successfully'
    )
  );
});

/**
 * @desc    Enroll student in a course (with seat capacity validation)
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

  // Seat Capacity Check
  const activeEnrollments = await Enrollment.countDocuments({
    course: courseId,
    status: 'enrolled',
  });

  const capacity = course.maxStudents || 60;
  if (activeEnrollments >= capacity) {
    throw new ApiError(400, `Enrollment failed. This course has reached its capacity limit of ${capacity} students.`);
  }

  let enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (enrollment) {
    if (enrollment.status === 'enrolled') {
      throw new ApiError(400, 'You are already enrolled in this course.');
    }

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