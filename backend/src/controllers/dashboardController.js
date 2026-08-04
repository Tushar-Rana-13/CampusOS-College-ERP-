import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get aggregated dashboard summary for a Student
 * @route   GET /api/dashboard/student
 * @access  Private (Student)
 */
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Run independent database queries in parallel for peak performance
  const [enrollments, totalAttendanceRecords, presentAttendanceRecords, recentAnnouncements] =
    await Promise.all([
      // 1. Fetch enrolled courses
      Enrollment.find({ student: studentId }).populate({
        path: 'course',
        populate: { path: 'faculty', select: 'name email' },
      }),

      // 2. Count total attendance sessions
      Attendance.countDocuments({ student: studentId }),

      // 3. Count attended sessions (Present or Late)
      Attendance.countDocuments({
        student: studentId,
        status: { $in: ['Present', 'Late'] },
      }),

      // 4. Fetch top 3 latest relevant announcements
      Announcement.find({
        targetAudience: { $in: ['all', 'student'] },
      })
        .sort({ createdAt: -1 })
        .limit(3),
    ]);

  const enrolledCourseIds = enrollments.map((e) => e.course._id);

  // 5. Fetch active assignments for enrolled courses
  const activeAssignments = await Assignment.find({
    course: { $in: enrolledCourseIds },
    dueDate: { $gte: new Date() },
  }).select('_id title dueDate course maxMarks');

  // 6. Find which assignments the student has already submitted
  const activeAssignmentIds = activeAssignments.map((a) => a._id);
  const studentSubmissions = await Submission.find({
    student: studentId,
    assignment: { $in: activeAssignmentIds },
  }).select('assignment');

  const submittedAssignmentIds = new Set(
    studentSubmissions.map((s) => s.assignment.toString())
  );

  // Filter out assignments that are already submitted
  const pendingAssignments = activeAssignments.filter(
    (a) => !submittedAssignmentIds.has(a._id.toString())
  );

  // Calculate overall attendance percentage
  const overallAttendancePercentage =
    totalAttendanceRecords > 0
      ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
      : 100;

  res.status(200).json({
    summary: {
      enrolledCoursesCount: enrollments.length,
      overallAttendancePercentage,
      pendingAssignmentsCount: pendingAssignments.length,
    },
    enrolledCourses: enrollments.map((e) => e.course),
    pendingAssignments,
    recentAnnouncements,
  });
});

/**
 * @desc    Get aggregated dashboard summary for Faculty
 * @route   GET /api/dashboard/faculty
 * @access  Private (Faculty)
 */
export const getFacultyDashboard = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  // Fetch assigned courses first
  const assignedCourses = await Course.find({ faculty: facultyId });
  const courseIds = assignedCourses.map((c) => c._id);

  // Execute parallel count queries
  const [totalStudentsEnrolled, assignments] = await Promise.all([
    Enrollment.countDocuments({ course: { $in: courseIds } }),
    Assignment.find({ course: { $in: courseIds } }).select('_id'),
  ]);

  const assignmentIds = assignments.map((a) => a._id);

  // Count submissions that have NOT been graded yet
  const ungradedSubmissionsCount = await Submission.countDocuments({
    assignment: { $in: assignmentIds },
    status: { $ne: 'Graded' },
  });

  res.status(200).json({
    summary: {
      assignedCoursesCount: assignedCourses.length,
      totalStudentsEnrolled,
      ungradedSubmissionsCount,
    },
    assignedCourses,
  });
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
      Enrollment.countDocuments(),
    ]);

  res.status(200).json({
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
  });
});