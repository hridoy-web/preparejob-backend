import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Blog } from '../models/blog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Question } from '../models/question.model.js';

// PATCH /api/v1/user/bookmark → toggleBookmark
export const toggleBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { userId, questionId } = req.body;

  if (!userId || !questionId) {
    throw new ApiError(400, 'userId and questionId are required');
  }

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new ApiError(400, 'Invalid questionId format');
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


  // Explicitly typed (id: mongoose.Types.ObjectId) to resolve TypeScript error
  const isBookmarked = user.bookmarks.some((id: mongoose.Types.ObjectId) =>
    id.equals(questionObjectId)
  );

  // Toggle bookmark: remove if present, add if not
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
  const { userId } = req.params;
//   console.log('Fetching bookmarks for userId:', userId);

  const user = await User.findById(userId).populate({
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
  const { userId } = req.params;

  const likedBlogs = await Blog.find({ likes: userId });

  return res.status(200).json(
    new ApiResponse(200, likedBlogs, 'Liked blogs fetched successfully')
  );
});

// GET /api/v1/user/commented-blogs/:userId → getUserCommentedBlogs
export const getUserCommentedBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const commentedBlogs = await Blog.find({ 'comments.userId': userId });

  return res.status(200).json(
    new ApiResponse(200, commentedBlogs, 'Commented blogs fetched successfully')
  );
});