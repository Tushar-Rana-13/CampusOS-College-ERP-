import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import '../models/User.js'; // Ensures 'User' model schema is registered in Mongoose
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Normalizes input date to midnight UTC (YYYY-MM-DD 00:00:00.000Z)
 * Prevents time-zone drift when storing and querying daily attendance.
 */
const normalizeToUTCMidnight = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * @desc    Batch mark or update attendance records for a course on a specific date
 * @route   POST /api/attendance
 * @access  Private (Faculty assigned to course, Admin)
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;

  if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('Please provide courseId, date, and a non-empty array of student records');
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400);
    throw new Error('Invalid Course ID format');
  }

  const attendanceDate = normalizeToUTCMidnight(date);
  if (!attendanceDate) {
    res.status(400);
    throw new Error('Invalid date format provided');
  }

  const course = await Course.findById(courseId).select('faculty').lean();
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const isAssignedFaculty = course.faculty?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to mark attendance for this course');
  }

  const incomingStudentIds = records
    .map((r) => r.studentId)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const activeEnrollments = await Enrollment.find({
    course: courseId,
    student: { $in: incomingStudentIds },
    status: 'enrolled',
  })
    .select('student')
    .lean();

  const enrolledStudentSet = new Set(
    activeEnrollments.map((e) => e.student.toString())
  );

  const validStatuses = ['Present', 'Absent', 'Late'];
  const bulkOperations = [];

  for (let index = 0; index < records.length; index++) {
    const record = records[index];

    if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
      res.status(400);
      throw new Error(`Invalid studentId at position ${index}`);
    }

    const studentIdStr = record.studentId.toString();

    if (!enrolledStudentSet.has(studentIdStr)) {
      res.status(400);
      throw new Error(`Student ${studentIdStr} is not actively enrolled in this course`);
    }

    if (!validStatuses.includes(record.status)) {
      res.status(400);
      throw new Error(`Invalid status "${record.status}" for student ${studentIdStr}`);
    }

    bulkOperations.push({
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
    });
  }

  await Attendance.bulkWrite(bulkOperations);

  res.status(200).json({
    success: true,
    message: `Attendance recorded successfully for ${bulkOperations.length} students`,
    date: attendanceDate,
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

  const course = await Course.findById(courseId).select('faculty').lean();
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const isAssignedFaculty = course.faculty?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view attendance for this course');
  }

  const targetDate = normalizeToUTCMidnight(date || new Date());
  if (!targetDate) {
    res.status(400);
    throw new Error('Invalid date format provided');
  }

  const [activeEnrollments, existingRecords] = await Promise.all([
    Enrollment.find({ course: courseId, status: 'enrolled' })
      .populate({
        path: 'student',
        model: 'User',
        select: 'name email rollNumber isActive',
      })
      .lean(),
    Attendance.find({ course: courseId, date: targetDate })
      .select('student status')
      .lean(),
  ]);

  const attendanceMap = new Map();
  existingRecords.forEach((record) => {
    if (record.student) {
      attendanceMap.set(record.student.toString(), record.status);
    }
  });

  const roster = activeEnrollments
    .filter((e) => e.student && e.student._id && e.student.isActive !== false)
    .map((e) => {
      const student = e.student;
      const studentIdStr = student._id.toString();

      return {
        studentId: student._id,
        name: student.name || 'Unknown Student',
        email: student.email || 'N/A',
        rollNumber: student.rollNumber || 'N/A',
        status: attendanceMap.get(studentIdStr) || 'Present',
      };
    });

  res.status(200).json({
    success: true,
    count: roster.length,
    date: targetDate,
    roster,
  });
});

/**
 * @desc    Get attendance summary & metrics for the logged-in student
 * @route   GET /api/attendance/student
 * @access  Private (Student)
 */
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentObjectId = new mongoose.Types.ObjectId(req.user._id);

  const report = await Enrollment.aggregate([
    {
      $match: {
        student: studentObjectId,
        status: 'enrolled',
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    { $unwind: '$courseInfo' },
    {
      $lookup: {
        from: 'attendances',
        let: { courseId: '$course', studentId: '$student' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$course', '$$courseId'] },
                  { $eq: ['$student', '$$studentId'] },
                ],
              },
            },
          },
        ],
        as: 'attendanceRecords',
      },
    },
    {
      $project: {
        courseId: '$courseInfo._id',
        courseCode: '$courseInfo.courseCode',
        courseTitle: '$courseInfo.title',
        totalClasses: { $size: '$attendanceRecords' },
        presentCount: {
          $size: {
            $filter: {
              input: '$attendanceRecords',
              as: 'rec',
              cond: { $eq: ['$$rec.status', 'Present'] },
            },
          },
        },
        lateCount: {
          $size: {
            $filter: {
              input: '$attendanceRecords',
              as: 'rec',
              cond: { $eq: ['$$rec.status', 'Late'] },
            },
          },
        },
        absentCount: {
          $size: {
            $filter: {
              input: '$attendanceRecords',
              as: 'rec',
              cond: { $eq: ['$$rec.status', 'Absent'] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        attendedClasses: { $add: ['$presentCount', '$lateCount'] },
        percentage: {
          $cond: [
            { $gt: ['$totalClasses', 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $add: ['$presentCount', '$lateCount'] },
                        '$totalClasses',
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
            100,
          ],
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    count: report.length,
    attendanceReport: report,
  });
});