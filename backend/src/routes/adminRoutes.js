import express from 'express';
import {
  registerUserByAdmin,
  enrollStudentInCourse,
  getUsersByRole,
  getAllAdminCourses,
  getAllAdminTickets,
  respondToTicketByAdmin,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Secure all endpoints to authenticated Admins only
router.use(protect);
router.use(authorize('admin'));

router.post('/users', registerUserByAdmin);
router.get('/users', getUsersByRole);

router.post('/enroll', enrollStudentInCourse);
router.get('/courses', getAllAdminCourses);

router.get('/tickets', getAllAdminTickets);
router.patch('/tickets/:id', respondToTicketByAdmin);

export default router;