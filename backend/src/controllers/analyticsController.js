import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import Ticket from '../models/Ticket.js'; // Assuming Ticket model exists or fallback
import mongoose from 'mongoose';

/**
 * @desc    Get dashboard metrics for Student role
 * @route   GET /api/analytics/student
 * @access  Private (Student)
 */
export const getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Enrolled Courses Count
    const enrolledCoursesCount = await Course.countDocuments({
      students: studentId,
    });

    // 2. MongoDB Aggregation for Course-wise & Overall Attendance Metrics
    const attendanceStats = await Attendance.aggregate([
      // Match sessions containing this student
      { $match: { 'records.studentId': studentId } },
      { $unwind: '$records' },
      { $match: { 'records.studentId': studentId } },
      {
        $group: {
          _id: '$courseId',
          totalClasses: { $sum: 1 },
          attendedClasses: {
            $sum: {
              $cond: [
                { $in: ['$records.status', ['Present', 'Late']] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalClassesAll: { $sum: '$totalClasses' },
          totalAttendedAll: { $sum: '$attendedClasses font' },
          lowAttendanceCourses: {
            $sum: {
              $cond: [
                {
                  $lt: [
                    { $multiply: [{ $divide: ['$attendedClasses', '$totalClasses'] }, 100] },
                    75,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const overallStats = attendanceStats[0] || {
      totalClassesAll: 0,
      totalAttendedAll: 0,
      lowAttendanceCourses: 0,
    };

    const overallPercentage = overallStats.totalClassesAll > 0
      ? Math.round((overallStats.totalAttendedAll / overallStats.totalClassesAll) * 100)
      : 100;

    // 3. Open Helpdesk Tickets Count for this student
    const openTicketsCount = await Ticket ? await Ticket.countDocuments({
      createdBy: studentId,
      status: { $ne: 'Closed' },
    }) : 0;

    res.status(200).json({
      success: true,
      data: {
        enrolledCoursesCount,
        overallAttendancePercentage: overallPercentage,
        lowAttendanceWarningCount: overallStats.lowAttendanceCourses,
        openTicketsCount,
      },
    });
  } catch (error) {
    console.error('Student Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student dashboard analytics.',
    });
  }
};

/**
 * @desc    Get dashboard metrics for Faculty role
 * @route   GET /api/analytics/faculty
 * @access  Private (Faculty/Admin)
 */
export const getFacultyDashboardStats = async (req, res) => {
  try {
    const facultyId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Fetch courses taught by this faculty member
    const facultyCourses = await Course.find({ facultyId }).select('_id title');
    const courseIds = facultyCourses.map((c) => c._id);

    // 2. Count Total Unique Enrolled Students across their courses
    const studentAggregation = await Course.aggregate([
      { $match: { _id: { $in: courseIds } } },
      { $unwind: '$students' },
      { $group: { _id: '$students' } },
      { $count: 'totalStudents' },
    ]);

    const totalStudents = studentAggregation[0]?.totalStudents || 0;

    // 3. Attendance Overview across recent sessions
    const attendanceOverview = await Attendance.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $unwind: '$records' },
      {
        $group: {
          _id: '$records.status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {
      Present: 0,
      Absent: 0,
      Late: 0,
    };

    attendanceOverview.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    const totalRecords = statusCounts.Present + statusCounts.Absent + statusCounts.Late;
    const avgAttendanceRate = totalRecords > 0
      ? Math.round(((statusCounts.Present + statusCounts.Late) / totalRecords) * 100)
      : 100;

    res.status(200).json({
      success: true,
      data: {
        totalCourses: facultyCourses.length,
        totalStudents,
        avgAttendanceRate,
        statusDistribution: statusCounts,
      },
    });
  } catch (error) {
    console.error('Faculty Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty dashboard analytics.',
    });
  }
};