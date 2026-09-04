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

// Interface extension if your Auth Middleware attaches user data to req.user
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id?: string;
    role: string;
  };
}

// GET /api/v1/admin/stats → getAdminStats
export const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
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
export const toggleUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Retrieve current admin ID from Auth Middleware (req.user) or request payload (req.body.adminId)
  const currentAdminId = req.user?._id?.toString() || req.body.adminId;

  // 🔒 Security Check: Prevent admins from blocking themselves
  if (currentAdminId && currentAdminId === id) {
    throw new ApiError(400, 'You cannot block or modify your own account status');
  }

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
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Retrieve current admin ID from Auth Middleware (req.user) or request payload (req.body.adminId)
  const currentAdminId = req.user?._id?.toString() || req.body.adminId;

  // 🔒 Security Check: Prevent admins from deleting their own account
  if (currentAdminId && currentAdminId === id) {
    throw new ApiError(400, 'You cannot delete your own admin account');
  }

  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'User account deleted successfully')
  );
});