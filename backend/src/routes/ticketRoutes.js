import express from 'express';
import {
  createTicket,
  getTickets,
  updateTicketStatus,
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('student'), createTicket)
  .get(getTickets);

router
  .route('/:id')
  .put(authorize('admin', 'faculty'), updateTicketStatus);

export default router;