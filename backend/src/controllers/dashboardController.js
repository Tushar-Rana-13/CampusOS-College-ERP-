// controllers/dashboardController.js

import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import { User } from '../models/User.js';
import Announcement from '../models/Announcement.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * @desc    Get aggregated dashboard summary for a Student
 * @route   GET /api/dashboard/student
 * @access  Private (Student)
 */
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // 1. Concurrent DB queries for optimal performance
  const [enrollments, totalAttendanceRecords, presentAttendanceRecords, recentAnnouncements] =
    await Promise.all([
      // Fetch actively enrolled courses with populated faculty details
      Enrollment.find({ student: studentId, status: 'enrolled' })
        .populate({
          path: 'course',
          populate: { path: 'faculty', select: 'name email' },
        })
        .lean(),

      // Total attendance sessions recorded for this student
      Attendance.countDocuments({ student: studentId }),

      // Attended sessions (Present or Late)
      Attendance.countDocuments({
        student: studentId,
        status: { $in: ['Present', 'Late'] },
      }),

      // Top 3 latest announcements for students or global campus
      Announcement.find({
        $or: [
          { targetAudience: { $in: ['all', 'student'] } },
          { targetRole: { $in: ['all', 'student'] } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

  // Guard against orphaned enrollment references (deleted courses)
  const validCourses = enrollments
    .filter((e) => e.course !== null && e.course !== undefined)
    .map((e) => e.course);

  const enrolledCourseIds = validCourses.map((c) => c._id);

  // 2. Fetch upcoming assignments for active enrolled courses
  const activeAssignments = await Assignment.find({
    course: { $in: enrolledCourseIds },
    dueDate: { $gte: new Date() },
  })
    .select('_id title dueDate course maxMarks')
    .lean();

  // 3. Identify completed vs. pending assignments
  const activeAssignmentIds = activeAssignments.map((a) => a._id);
  const studentSubmissions = await Submission.find({
    student: studentId,
    assignment: { $in: activeAssignmentIds },
  })
    .select('assignment')
    .lean();

  const submittedAssignmentIds = new Set(
    studentSubmissions.map((s) => s.assignment.toString())
  );

  const pendingAssignments = activeAssignments.filter(
    (a) => !submittedAssignmentIds.has(a._id.toString())
  );

  // 4. Calculate overall attendance percentage
  const overallAttendancePercentage =
    totalAttendanceRecords > 0
      ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
      : 100;

  const dashboardPayload = {
    summary: {
      enrolledCoursesCount: validCourses.length,
      overallAttendancePercentage,
      pendingAssignmentsCount: pendingAssignments.length,
    },
    enrolledCourses: validCourses,
    pendingAssignments,
    recentAnnouncements,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboardPayload, 'Student dashboard retrieved successfully'));
});

/**
 * @desc    Get aggregated dashboard summary for Faculty
 * @route   GET /api/dashboard/faculty
 * @access  Private (Faculty)
 */
export const getFacultyDashboard = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  const assignedCourses = await Course.find({ faculty: facultyId }).lean();
  const courseIds = assignedCourses.map((c) => c._id);

  const [totalStudentsEnrolled, assignments] = await Promise.all([
    Enrollment.countDocuments({ course: { $in: courseIds }, status: 'enrolled' }),
    Assignment.find({ course: { $in: courseIds } }).select('_id').lean(),
  ]);

  const assignmentIds = assignments.map((a) => a._id);

  const ungradedSubmissionsCount = await Submission.countDocuments({
    assignment: { $in: assignmentIds },
    status: { $ne: 'Graded' },
  });

  const dashboardPayload = {
    summary: {
      assignedCoursesCount: assignedCourses.length,
      totalStudentsEnrolled,
      ungradedSubmissionsCount,
    },
    assignedCourses,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboardPayload, 'Faculty dashboard retrieved successfully'));
});

/**
 * @desc    Get system-wide metrics for Admin
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [studentCount, facultyCount, adminCount, totalCourses, totalEnrollments] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'enrolled' }),
    ]);

  const dashboardPayload = {
    users: {
      students: studentCount,
      faculty: facultyCount,
      admins: adminCount,
      total: studentCount + facultyCount + adminCount,
    },
    academics: {
      totalCourses,
      totalEnrollments,
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboardPayload, 'Admin dashboard metrics retrieved successfully'));
});