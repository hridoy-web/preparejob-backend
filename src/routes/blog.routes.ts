import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import {
  addComment,
  createBlog,
  deleteBlog,
  deleteComment,
  getAllBlogs,
  getBlogBySlug,
  toggleLikeBlog,
  updateBlog,
} from '../controller/blog.controller.js';

const router = Router();

// Create & Get All Blogs
router.route('/')
  .post(upload.single('bannerImage'), createBlog)
  .get(getAllBlogs);

// Get Single Blog by Slug
router.get('/slug/:slug', getBlogBySlug);

// Update & Delete Blog by ID
router.route('/:id')
  .patch(upload.single('bannerImage'), updateBlog)
  .delete(deleteBlog);

// Toggle Like
router.patch('/:id/like', toggleLikeBlog);

// Comments Handling
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

export default router;