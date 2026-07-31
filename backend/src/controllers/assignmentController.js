import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new assignment for a course
 * @route   POST /api/assignments
 * @access  Private (Faculty assigned to the course, Admin)
 */
export const createAssignment = asyncHandler(async (req, res) => {
  const { courseId, title, description, dueDate, maxMarks } = req.body;

  if (!courseId || !title || !description || !dueDate || !maxMarks) {
    res.status(400);
    throw new Error('Please fill in all required assignment fields');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Authorization Check: Only assigned faculty or admin can create assignments
  const isAssignedFaculty = course.faculty.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to create assignments for this course');
  }

  const assignment = await Assignment.create({
    course: courseId,
    title,
    description,
    dueDate,
    maxMarks,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: 'Assignment created successfully',
    assignment,
  });
});

/**
 * @desc    Get all assignments for a specific course
 * @route   GET /api/assignments/course/:courseId
 * @access  Private (Enrolled Students, Assigned Faculty, Admin)
 */
export const getCourseAssignments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // If user is a student, verify enrollment
  if (req.user.role === 'student') {
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });
    if (!isEnrolled) {
      res.status(403);
      throw new Error('You are not enrolled in this course');
    }
  }

  const assignments = await Assignment.find({ course: courseId })
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 }); // Sort upcoming due dates first

  res.status(200).json({
    count: assignments.length,
    assignments,
  });
});

/**
 * @desc    Submit an assignment
 * @route   POST /api/assignments/:id/submit
 * @access  Private (Enrolled Students only)
 */
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;
  const { submissionText, fileUrl } = req.body;

  if (!submissionText && !fileUrl) {
    res.status(400);
    throw new Error('Please provide either text content or a file URL for submission');
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Verify student enrollment in the course
  const isEnrolled = await Enrollment.findOne({
    student: req.user._id,
    course: assignment.course,
  });

  if (!isEnrolled) {
    res.status(403);
    throw new Error('You are not enrolled in the course for this assignment');
  }

  // Determine submission status based on due date
  const now = new Date();
  const status = now > new Date(assignment.dueDate) ? 'Late' : 'Submitted';

  // Upsert pattern: Allow resubmissions before/after due date while updating record
  const submission = await Submission.findOneAndUpdate(
    { assignment: assignmentId, student: req.user._id },
    {
      submissionText,
      fileUrl,
      submittedAt: now,
      status,
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    message: status === 'Late' ? 'Assignment submitted (Late)' : 'Assignment submitted successfully',
    submission,
  });
});

/**
 * @desc    Grade a student submission
 * @route   PUT /api/assignments/submissions/:submissionId/grade
 * @access  Private (Assigned Faculty, Admin)
 */
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { marksObtained, feedback } = req.body;

  if (marksObtained === undefined) {
    res.status(400);
    throw new Error('Please provide marksObtained');
  }

  const submission = await Submission.findById(submissionId).populate('assignment');
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Check if current user is assigned faculty for the assignment's course
  const course = await Course.findById(submission.assignment.course);
  const isAssignedFaculty = course.faculty.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to grade submissions for this course');
  }

  // Validate marks bounds
  if (marksObtained < 0 || marksObtained > submission.assignment.maxMarks) {
    res.status(400);
    throw new Error(`Marks must be between 0 and ${submission.assignment.maxMarks}`);
  }

  submission.marksObtained = marksObtained;
  submission.feedback = feedback || '';
  submission.status = 'Graded';
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();

  await submission.save();

  res.status(200).json({
    message: 'Submission graded successfully',
    submission,
  });
});

/**
 * @desc    Get all submissions for an assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private (Assigned Faculty, Admin)
 */
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  const course = await Course.findById(assignment.course);
  const isAssignedFaculty = course.faculty.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view submissions for this assignment');
  }

  const submissions = await Submission.find({ assignment: assignmentId })
    .populate('student', 'name email')
    .populate('gradedBy', 'name email')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    count: submissions.length,
    submissions,
  });
});