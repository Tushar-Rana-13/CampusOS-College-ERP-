import express from 'express';
import {
  markAttendance,
  getStudentAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Require authentication for all attendance routes

router
  .route('/')
  .post(authorize('faculty', 'admin'), markAttendance);

router
  .route('/student')
  .get(authorize('student'), getStudentAttendance);

export default router;