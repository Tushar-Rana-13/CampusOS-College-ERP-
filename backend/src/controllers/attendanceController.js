import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Mark or Update attendance for a course (Batch submission)
 * @route   POST /api/attendance
 * @access  Private (Faculty assigned to course, Admin)
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;
  // records shape expected: [{ studentId: "...", status: "Present" }, ...]

  if (!courseId || !date || !records || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('Please provide courseId, date, and an array of student attendance records');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Authorization Check: Only assigned faculty or admin can mark attendance
  const isAssignedFaculty = course.faculty.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to mark attendance for this course');
  }

  // Normalize date to start of day (midnight) to prevent time-of-day mismatch issues
  const attendanceDate = new Date(date);
  attendanceDate.setUTCHours(0, 0, 0, 0);

  // Prepare batch bulkWrite operations (Upsert logic)
  const bulkOperations = records.map((record) => ({
    updateOne: {
      filter: {
        course: courseId,
        student: record.studentId,
        date: attendanceDate,
      },
      update: {
        $set: {
          status: record.status,
          markedBy: req.user._id,
        },
      },
      upsert: true, // Creates a new document if one does not exist for this student/course/date
    },
  }));

  await Attendance.bulkWrite(bulkOperations);

  res.status(200).json({
    message: `Attendance recorded successfully for ${records.length} students`,
    date: attendanceDate,
  });
});

/**
 * @desc    Get attendance records & percentage metrics for a logged-in student
 * @route   GET /api/attendance/student
 * @access  Private (Student)
 */
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Fetch all courses student is enrolled in
  const enrollments = await Enrollment.find({ student: studentId }).populate('course', 'courseCode title');
  const enrolledCourseIds = enrollments.map((e) => e.course._id);

  // Aggregate attendance statistics grouped by course
  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        student: studentId,
        course: { $in: enrolledCourseIds },
      },
    },
    {
      $group: {
        _id: '$course',
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
        },
      },
    },
  ]);

  // Combine aggregated metrics with course details
  const report = enrollments.map((enrollment) => {
    const course = enrollment.course;
    const stats = attendanceStats.find((s) => s._id.toString() === course._id.toString()) || {
      totalClasses: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
    };

    // Treat Late as Present for percentage calculation (or customize formula as needed)
    const attendedClasses = stats.presentCount + stats.lateCount;
    const percentage = stats.totalClasses > 0 
      ? Math.round((attendedClasses / stats.totalClasses) * 100) 
      : 100;

    return {
      courseId: course._id,
      courseCode: course.courseCode,
      courseTitle: course.title,
      totalClasses: stats.totalClasses,
      attendedClasses,
      absentCount: stats.absentCount,
      percentage,
    };
  });

  res.status(200).json({
    count: report.length,
    attendanceReport: report,
  });
});