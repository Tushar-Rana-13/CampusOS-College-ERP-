import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Helper utility to safely verify faculty authorization across 
 * both single ObjectId references and array-based faculty fields.
 */
const isUserCourseFaculty = (course, userId) => {
  if (!course || !course.faculty) return false;
  if (Array.isArray(course.faculty)) {
    return course.faculty.some((f) => f.toString() === userId.toString());
  }
  return course.faculty.toString() === userId.toString();
};

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

  const isAssignedFaculty = isUserCourseFaculty(course, req.user._id);
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
 * @desc    Get all assignments for a specific course (with student submission state)
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

  const rawAssignments = await Assignment.find({ course: courseId })
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 })
    .lean(); // Return plain JS objects so we can attach custom properties

  // If user is a student, attach their specific submission object
  let assignments = rawAssignments;
  if (req.user.role === 'student') {
    const assignmentIds = rawAssignments.map((a) => a._id);
    const userSubmissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id,
    }).lean();

    const submissionMap = {};
    userSubmissions.forEach((sub) => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    assignments = rawAssignments.map((a) => ({
      ...a,
      mySubmission: submissionMap[a._id.toString()] || null,
      isSubmitted: Boolean(submissionMap[a._id.toString()]),
    }));
  }

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

  const isEnrolled = await Enrollment.findOne({
    student: req.user._id,
    course: assignment.course,
  });

  if (!isEnrolled) {
    res.status(403);
    throw new Error('You are not enrolled in the course for this assignment');
  }

  // Prevent resubmission if already graded
  const existingSubmission = await Submission.findOne({
    assignment: assignmentId,
    student: req.user._id,
  });

  if (existingSubmission && existingSubmission.status === 'Graded') {
    res.status(400);
    throw new Error('This assignment has already been graded and cannot be resubmitted');
  }

  const now = new Date();
  const status = now > new Date(assignment.dueDate) ? 'Late' : 'Submitted';

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

  const course = await Course.findById(submission.assignment.course);
  const isAssignedFaculty = isUserCourseFaculty(course, req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isAssignedFaculty && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to grade submissions for this course');
  }

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
  const isAssignedFaculty = isUserCourseFaculty(course, req.user._id);
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