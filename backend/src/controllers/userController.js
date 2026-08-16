import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get users list filtered by role (e.g., ?role=faculty)
 * @route   GET /api/users
 * @access  Private (Admin, Faculty)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const query = {};

  if (role) {
    query.role = role;
  }

  // Exclude sensitive fields like password
  const users = await User.find(query)
    .select('-password')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});