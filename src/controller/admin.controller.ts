// GET /api/v1/admin/stats → getAdminStats
// Purpose: Fetch overview metrics (total users, questions, blogs count) for Admin Dashboard

// GET /api/v1/admin/users → getAllUsers
// Purpose: Retrieve all registered users with pagination for User Management table

// PATCH /api/v1/admin/users/:id/status → toggleUserStatus
// Purpose: Toggle user status between 'active' and 'blocked'

// DELETE /api/v1/admin/users/:id → deleteUser
// Purpose: Permanently remove a user account from the database

import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { Question } from '../models/question.model.js';
import { Blog } from '../models/blog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /api/v1/admin/stats → getAdminStats
export const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  // Count documents across all primary collections concurrently
  const [totalUsers, totalQuestions, totalBlogs] = await Promise.all([
    User.countDocuments(),
    Question.countDocuments(),
    Blog.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { totalUsers, totalQuestions, totalBlogs },
      'Admin dashboard overview metrics fetched successfully'
    )
  );
});

// GET /api/v1/admin/users → getAllUsers
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    User.find()
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          totalUsers,
          currentPage: page,
          totalPages,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      'Users retrieved successfully'
    )
  );
});

// PATCH /api/v1/admin/users/:id/status → toggleUserStatus
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Toggle status between active and blocked
  user.status = user.status === 'active' ? 'blocked' : 'active';
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { userId: user._id, status: user.status },
      `User status updated to ${user.status} successfully`
    )
  );
});

// DELETE /api/v1/admin/users/:id → deleteUser
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'User account deleted successfully')
  );
});