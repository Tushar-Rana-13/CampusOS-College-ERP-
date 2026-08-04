import express from 'express';
import {
  getStudentDashboard,
  getFacultyDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/student', authorize('student'), getStudentDashboard);
router.get('/faculty', authorize('faculty'), getFacultyDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);

export default router;