import mongoose from 'mongoose';
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

  // Basic payload validation
  if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('Please provide courseId, date, and a non-empty array of student records');
  }

  // Validate ObjectId format for courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400);
    throw new Error('Invalid Course ID format');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Authorization Check: Only assigned faculty or admin can mark attendance
  const isAssignedFaculty = course.faculty?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to mark attendance for this course');
  }

  // Normalize date to YYYY-MM-DD midnight UTC
  const attendanceDate = new Date(date);
  if (isNaN(attendanceDate.getTime())) {
    res.status(400);
    throw new Error('Invalid date format provided');
  }
  attendanceDate.setUTCHours(0, 0, 0, 0);

  const validStatuses = ['Present', 'Absent', 'Late'];

  // Prepare batch bulkWrite operations with item-level validation
  const bulkOperations = records.map((record, index) => {
    if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
      res.status(400);
      throw new Error(`Invalid or missing studentId at position ${index}`);
    }

    if (!validStatuses.includes(record.status)) {
      res.status(400);
      throw new Error(`Invalid status "${record.status}" for student ${record.studentId}`);
    }

    return {
      updateOne: {
        filter: {
          course: new mongoose.Types.ObjectId(courseId),
          student: new mongoose.Types.ObjectId(record.studentId),
          date: attendanceDate,
        },
        update: {
          $set: {
            status: record.status,
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    };
  });

  await Attendance.bulkWrite(bulkOperations);

  res.status(200).json({
    success: true,
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
  // Convert String / User ID to Mongoose ObjectId explicitly for Aggregation
  const studentObjectId = new mongoose.Types.ObjectId(req.user._id);

  // Fetch all courses student is enrolled in
  const enrollments = await Enrollment.find({ student: studentObjectId }).populate(
    'course',
    'courseCode title'
  );

  if (!enrollments.length) {
    return res.status(200).json({
      success: true,
      count: 0,
      attendanceReport: [],
    });
  }

  const enrolledCourseObjectIds = enrollments
    .filter((e) => e.course) // Guard against null course references
    .map((e) => new mongoose.Types.ObjectId(e.course._id));

  // Aggregate attendance statistics grouped by course
  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        student: studentObjectId,
        course: { $in: enrolledCourseObjectIds },
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
  const report = enrollments
    .filter((enrollment) => enrollment.course)
    .map((enrollment) => {
      const course = enrollment.course;
      const stats = attendanceStats.find(
        (s) => s._id.toString() === course._id.toString()
      ) || {
        totalClasses: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
      };

      const attendedClasses = stats.presentCount + stats.lateCount;
      const percentage =
        stats.totalClasses > 0
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
    success: true,
    count: report.length,
    attendanceReport: report,
  });
});

/**
 * @desc    Get student roster & attendance status for a course on a specific date
 * @route   GET /api/attendance/course/:courseId
 * @access  Private (Faculty assigned to course, Admin)
 */
export const getCourseAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { date } = req.query;

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400);
    throw new Error('Valid Course ID is required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Authorization Check
  const isAssignedFaculty = course.faculty?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view attendance for this course');
  }

  // Fetch all enrolled students for this course
  const enrollments = await Enrollment.find({ course: courseId }).populate(
    'student',
    'name email rollNumber'
  );

  // Normalize date to UTC midnight if date filter is provided
  let targetDate = date ? new Date(date) : new Date();
  targetDate.setUTCHours(0, 0, 0, 0);

  // Fetch existing attendance records for this date
  const existingRecords = await Attendance.find({
    course: courseId,
    date: targetDate,
  });

  // Map existing records by student ID for quick standard lookup
  const attendanceMap = new Map();
  existingRecords.forEach((record) => {
    attendanceMap.set(record.student.toString(), record.status);
  });

  // Combine roster with existing attendance status (default to 'Present' if not marked)
  const roster = enrollments
    .filter((e) => e.student) // Guard against null student references
    .map((e) => {
      const studentId = e.student._id.toString();
      return {
        studentId: e.student._id,
        name: e.student.name,
        email: e.student.email,
        rollNumber: e.student.rollNumber || 'N/A',
        status: attendanceMap.get(studentId) || 'Present',
      };
    });

  res.status(200).json({
    success: true,
    count: roster.length,
    date: targetDate,
    roster,
  });
});