import express from 'express';
import {
  createCourse,
  getCourses,
  enrollInCourse, 
  addCourseMaterial,
  getCourseMaterials,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all course endpoints
router.use(protect);

router
  .route('/')
  .get(getCourses)
  .post(authorize('admin', 'faculty'), createCourse);

router
  .route('/:id/enroll')
  .post(authorize('admin', 'student'), enrollInCourse);

router
  .route('/:id/materials')
  .get(getCourseMaterials)
  .post(authorize('faculty', 'admin'), addCourseMaterial);

export default router;