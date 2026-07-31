import express from 'express';
import {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Protect all assignment routes

// Assignment management
router
  .route('/')
  .post(authorize('faculty', 'admin'), createAssignment);

router
  .route('/course/:courseId')
  .get(getCourseAssignments);

// Submission & Grading
router
  .route('/:id/submit')
  .post(authorize('student'), submitAssignment);

router
  .route('/:id/submissions')
  .get(authorize('faculty', 'admin'), getAssignmentSubmissions);

router
  .route('/submissions/:submissionId/grade')
  .put(authorize('faculty', 'admin'), gradeSubmission);

export default router;