// server/src/controllers/ticketController.js
import Ticket from '../models/Ticket.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @desc    Create a new support ticket
 * @route   POST /api/tickets
 * @access  Private (Student)
 */
export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {
    throw new ApiError(400, 'Please provide title, description, and category');
  }

  const ticket = await Ticket.create({
    title: title.trim(),
    description: description.trim(),
    category,
    priority: priority || 'Medium',
    raisedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, ticket, 'Helpdesk ticket raised successfully'));
});

/**
 * @desc    Get tickets raised by student or all tickets for Admin/Faculty
 * @route   GET /api/tickets
 * @access  Private
 */
export const getTickets = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'student') {
    query.raisedBy = req.user._id;
  } else if (req.user.role === 'faculty') {
    query = {
      $or: [{ assignedTo: req.user._id }, { category: 'Academics' }],
    };
  }

  const tickets = await Ticket.find(query)
    .populate('raisedBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('comments.sender', 'name role')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tickets, 'Tickets retrieved successfully'));
});
/**
 * @desc    Update ticket status (Admin/Faculty)
 * @route   PATCH /api/tickets/:id/status
 * @access  Private (Admin, Faculty)
 */
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;

  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, 'Please provide a valid ticket status');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  ticket.status = status;

  // Auto-stamp resolution timestamp when marked resolved
  if (status === 'Resolved' || status === 'Closed') {
    ticket.resolvedAt = ticket.resolvedAt || new Date();
  }

  if (resolutionNotes) {
    ticket.resolutionNotes = resolutionNotes.trim();
  }

  await ticket.save();

  const updatedTicket = await Ticket.findById(id)
    .populate('raisedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.sender', 'name role');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTicket, `Ticket status updated to ${status}`));
});

/**
 * @desc    Add a comment/reply to a ticket thread
 * @route   POST /api/tickets/:id/comments
 * @access  Private
 */
export const addTicketComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw new ApiError(400, 'Comment text is required');
  }

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  const isOwner = ticket.raisedBy.toString() === req.user._id.toString();
  const isAssigned = ticket.assignedTo?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isFaculty = req.user.role === 'faculty';

  // Allow owner, assigned staff, admins, or faculty members to reply
  if (!isOwner && !isAssigned && !isAdmin && !isFaculty) {
    throw new ApiError(403, 'Not authorized to comment on this ticket');
  }

  ticket.comments.push({
    sender: req.user._id,
    text: text.trim(),
  });

  await ticket.save();

  // Return updated ticket with populated sender details
  const updatedTicket = await Ticket.findById(id)
    .populate('raisedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.sender', 'name role');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTicket, 'Comment added successfully'));
});