import express from 'express';
import {
  createTicket,
  getTickets,
  updateTicketStatus,
  addTicketComment,
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

router
  .route('/":id/comments')
  .post(addTicketComment);
  
export default router;