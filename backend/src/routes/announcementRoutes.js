import express from 'express';
import {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getAnnouncements)
    .post(authorize('faculty', 'admin'), createAnnouncement);

router.route('/:id').delete(authorize('faculty', 'admin'), deleteAnnouncement);

export default router;