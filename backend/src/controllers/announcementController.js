import Announcement from '../models/Announcement.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (Faculty, Admin)
 */
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, category, priority, targetAudience } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Please provide both title and content for the announcement');
  }

  const announcement = await Announcement.create({
    title,
    content,
    category,
    priority,
    targetAudience,
    createdBy: req.user._id, // Attached by protect middleware
  });

  // Populate author details (name and role only) for immediate frontend rendering
  await announcement.populate('createdBy', 'name role');

  res.status(201).json({
    message: 'Announcement published successfully',
    announcement,
  });
});

/**
 * @desc    Get announcements relevant to logged-in user
 * @route   GET /api/announcements
 * @access  Private (All authenticated users)
 */
export const getAnnouncements = asyncHandler(async (req, res) => {
  const userRole = req.user.role; // Extract user role from token payload via protect middleware

  // Filter logic: Admins see everything; students/faculty see 'all' + their specific target audience
  let filter = { isActive: true };

  if (userRole !== 'admin') {
    filter.targetAudience = { $in: ['all', userRole] };
  }

  const announcements = await Announcement.find(filter)
    .populate('createdBy', 'name role email')
    .sort({ createdAt: -1 }); // Newest first

  res.status(200).json({
    count: announcements.length,
    announcements,
  });
});

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Faculty author or Admin)
 */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  // Authorization Check: Only Admin OR the Faculty member who created it can delete
  const isAuthor = announcement.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this announcement');
  }

  await announcement.deleteOne();

  res.status(200).json({
    message: 'Announcement removed successfully',
    id: req.params.id,
  });
});