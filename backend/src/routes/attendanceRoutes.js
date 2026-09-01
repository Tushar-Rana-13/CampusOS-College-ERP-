import express from 'express';
import {
  markAttendance,
  getStudentAttendance,
  getCourseAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all attendance endpoints
router.use(protect);

router
  .route('/')
  .post(authorize('faculty', 'admin'), markAttendance);

router
  .route('/student')
  .get(authorize('student'), getStudentAttendance);

router
  .route('/course/:courseId')
  .get(authorize('faculty', 'admin'), getCourseAttendance);

export default router;