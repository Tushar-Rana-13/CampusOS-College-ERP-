// server/src/controllers/userController.js
import { User } from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js'; // Assuming you have a custom ApiError handler

// @desc    Get All Users (Filtered / Paginated ready)
// @route   GET /api/v1/users
// @access  Private (Admin / Faculty)
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  
  return res
    .status(200)
    .json(new ApiResponse(200, users, 'Users retrieved successfully'));
});

// @desc    Get Current Logged-in User Profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Profile retrieved successfully'));
});

// @desc    Update Profile Details
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, department, semester, rollNumber, designation } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update base profile fields
  if (name !== undefined) user.name = name.trim();
  if (department !== undefined) user.department = department.trim();

  // Role-specific field assignment
  if (user.role === 'student') {
    if (semester !== undefined) user.semester = Number(semester);
    if (rollNumber !== undefined) user.rollNumber = rollNumber.trim();
  } else if (user.role === 'faculty') {
    if (designation !== undefined) user.designation = designation.trim();
  }

  const updatedUser = await user.save();

  // Omit password from response
  const userResponse = updatedUser.toObject();
  delete userResponse.password;

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, 'Profile updated successfully'));
});