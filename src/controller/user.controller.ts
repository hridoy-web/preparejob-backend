import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Blog } from '../models/blog.model.js';
import { Question } from '../models/question.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Helper function to extract string ID safely from req.params
const parseParamId = (param: string | string[] | undefined): string | null => {
  if (!param) return null;
  const id = Array.isArray(param) ? param[0] : param;
  return id.trim() || null;
};

// PATCH /api/v1/user/bookmark → toggleBookmark
export const toggleBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { userId, questionId } = req.body;

  if (!userId || !questionId) {
    throw new ApiError(400, 'userId and questionId are required');
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(questionId)) {
    throw new ApiError(400, 'Invalid userId or questionId format');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const questionObjectId = new mongoose.Types.ObjectId(questionId);
  const question = await Question.findById(questionObjectId);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  const isBookmarked = user.bookmarks.some((id: mongoose.Types.ObjectId) =>
    id.equals(questionObjectId)
  );

  const update = isBookmarked
    ? { $pull: { bookmarks: questionObjectId } }
    : { $addToSet: { bookmarks: questionObjectId } };

  const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).populate('bookmarks');

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedUser?.bookmarks,
      isBookmarked ? 'Bookmark removed successfully' : 'Bookmark added successfully'
    )
  );
});

// GET /api/v1/user/bookmarks/:userId → getUserBookmarks
export const getUserBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const targetUserId = parseParamId(req.params.userId);

  if (!targetUserId) {
    throw new ApiError(400, 'userId is required');
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, 'Invalid userId format');
  }

  const user = await User.findById(targetUserId).populate({
    path: 'bookmarks',
    model: 'Question',
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, user.bookmarks, 'Bookmarks fetched successfully')
  );
});

// GET /api/v1/user/liked-blogs/:userId → getUserLikedBlogs
export const getUserLikedBlogs = asyncHandler(async (req: Request, res: Response) => {
  const targetUserId = parseParamId(req.params.userId);

  if (!targetUserId) {
    throw new ApiError(400, 'userId is required');
  }

  const likedBlogs = await Blog.find({ likes: targetUserId });

  return res.status(200).json(
    new ApiResponse(200, likedBlogs, 'Liked blogs fetched successfully')
  );
});

// GET /api/v1/user/commented-blogs/:userId → getUserCommentedBlogs
export const getUserCommentedBlogs = asyncHandler(async (req: Request, res: Response) => {
  const targetUserId = parseParamId(req.params.userId);

  if (!targetUserId) {
    throw new ApiError(400, 'userId is required');
  }

  const commentedBlogs = await Blog.find({ 'comments.userId': targetUserId });

  return res.status(200).json(
    new ApiResponse(200, commentedBlogs, 'Commented blogs fetched successfully')
  );
});