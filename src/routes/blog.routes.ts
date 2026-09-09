import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { addComment, createBlog, deleteBlog, deleteComment, getAllBlogs, getBlogBySlug, toggleLikeBlog, updateBlog } from '../controller/blog.controller.js';

const router = Router();

// Routes for Blog Module

router.post('/', upload.single('bannerImage'), createBlog);
router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);
router.put('/:id', upload.single('bannerImage'), updateBlog);
router.delete('/:id', deleteBlog);
router.patch('/:id/like', toggleLikeBlog);
router.post('/:id/comment', addComment);
router.delete('/:id/comment/:commentId', deleteComment);

export default router;