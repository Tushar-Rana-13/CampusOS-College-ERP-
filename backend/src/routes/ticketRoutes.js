// server/src/routes/ticketRoutes.js
import express from 'express';
import {
  createTicket,
  getTickets,
  updateTicketStatus,
  addTicketComment,
  assignTicket,
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all helpdesk routes
router.use(protect);

// Root tickets endpoints
router
  .route('/')
  .post(authorize('student'), createTicket)
  .get(getTickets);

// Status update endpoint (Matches: PATCH /api/tickets/:id/status)
router
  .route('/:id/status')
  .patch(authorize('admin', 'faculty'), updateTicketStatus);

// Comments endpoint (Matches: POST /api/tickets/:id/comments)
router
  .route('/:id/comments')
  .post(authorize('student', 'faculty', 'admin'), addTicketComment);

router
  .route('/:id/assign')
  .patch(authorize('admin'), assignTicket);
  
export default router;