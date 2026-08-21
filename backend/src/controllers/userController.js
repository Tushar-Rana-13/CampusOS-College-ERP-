// server/src/controllers/userController.js
import { User } from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get All Users
// @route   GET /api/v1/users
// @access  Private/Admin/Faculty
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully'));
});

// @desc    Get Current Logged-in User Profile
// @route   GET /api/v1/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Profile retrieved successfully'));
});

// @desc    Update Profile Details
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, department, semester, rollNumber, designation } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.name = name || user.name;
    user.department = department || user.department;

    if (user.role === 'student') {
      user.semester = semester || user.semester;
      user.rollNumber = rollNumber || user.rollNumber;
    } else if (user.role === 'faculty') {
      user.designation = designation || user.designation;
    }

    const updatedUser = await user.save();
    res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});