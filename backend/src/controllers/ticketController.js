import Ticket from '../models/Ticket.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new support ticket
 * @route   POST /api/tickets
 * @access  Private (Student)
 */
export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {
    res.status(400);
    throw new Error('Please provide title, description, and category');
  }

  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority: priority || 'Medium',
    raisedBy: req.user._id,
  });

  res.status(201).json({
    message: 'Helpdesk ticket raised successfully',
    ticket,
  });
});

/**
 * @desc    Get tickets raised by the logged-in student (or all tickets for Admin)
 * @route   GET /api/tickets
 * @access  Private (Student - Own tickets, Admin/Faculty - All or Assigned tickets)
 */
export const getTickets = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'student') {
    // Students only see their own tickets
    query.raisedBy = req.user._id;
  } else if (req.user.role === 'faculty') {
    // Faculty sees assigned tickets or academic-related issues
    query = {
      $or: [{ assignedTo: req.user._id }, { category: 'Academic' }],
    };
  }
  // Admins see all tickets (query remains empty `{}`)

  const tickets = await Ticket.find(query)
    .populate('raisedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    count: tickets.length,
    tickets,
  });
});

/**
 * @desc    Update ticket status, assign administrator, or add resolution notes
 * @route   PUT /api/tickets/:id
 * @access  Private (Admin, Assigned Faculty)
 */
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes, assignedTo } = req.body;

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Update fields if provided
  if (status) {
    ticket.status = status;
    if (status === 'Resolved' || status === 'Closed') {
      ticket.resolvedAt = new Date();
    }
  }

  if (resolutionNotes) {
    ticket.resolutionNotes = resolutionNotes;
  }

  if (assignedTo) {
    ticket.assignedTo = assignedTo;
  }

  await ticket.save();

  res.status(200).json({
    message: 'Ticket updated successfully',
    ticket,
  });
});