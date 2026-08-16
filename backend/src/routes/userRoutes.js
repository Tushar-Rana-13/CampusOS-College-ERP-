import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users - Restrict access to authenticated Admins and Faculty
router.get('/', protect, authorize('admin', 'faculty'), getUsers);

export default router;