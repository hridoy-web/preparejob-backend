import { Router } from 'express';
import { getUserBookmarks, getUserCommentedBlogs, getUserLikedBlogs, toggleBookmark } from '../controller/user.controller.js';

const router = Router();

// Routes for User Dashboard & Tracking Module
router.patch('/bookmark', toggleBookmark);
router.get('/bookmarks/:userId', getUserBookmarks);
router.get('/liked-blogs/:userId', getUserLikedBlogs);
router.get('/commented-blogs/:userId', getUserCommentedBlogs);

export default router;