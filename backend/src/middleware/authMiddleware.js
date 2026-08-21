// server/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read JWT from Auth Header or Cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route.');
  }

  try {
    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach User to Request object (excluding password)
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error('User account not found or deactivated.');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Invalid or expired authentication token.');
  }
});

// Role Guarding Middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized to perform this action.`);
    }
    next();
  };
};