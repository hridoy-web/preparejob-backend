import { Router } from 'express';
import {
  getUserBookmarks,
  getUserCommentedBlogs,
  getUserLikedBlogs,
  toggleBookmark,
  toggleBlogLike,
  getUserStats,
} from '../controller/user.controller.js';

const router = Router();

// Routes for User Dashboard & Tracking Module
router.patch('/bookmark', toggleBookmark);
router.patch('/blogs/:blogId/like', toggleBlogLike);

router.get('/bookmarks/:userId', getUserBookmarks);
router.get('/liked-blogs/:userId', getUserLikedBlogs);
router.get('/commented-blogs/:userId', getUserCommentedBlogs);
router.get('/stats/:userId', getUserStats);

export default router;