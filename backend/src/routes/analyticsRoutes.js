import express from 'express';
import {
  getStudentDashboardStats,
  getFacultyDashboardStats,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student', protect, authorize('student'), getStudentDashboardStats);
router.get('/faculty', protect, authorize('faculty', 'admin'), getFacultyDashboardStats);

export default router;