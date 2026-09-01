import { Request, Response } from 'express';
import { Blog } from '../models/blog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

/** Converts a title into a URL-safe slug. Pure string function, no DB access. */
const slugify = (text: string): string =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // strip punctuation
    .replace(/[\s_]+/g, '-') // spaces/underscores -> hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (await Blog.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
};

// ---------------------------------------------------------------------------
// POST /api/v1/blogs   
// ---------------------------------------------------------------------------
export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, category, readTime } = req.body;

  if (!title?.trim() || !content?.trim() || !category?.trim()) {
    throw new ApiError(400, 'title, content and category are required');
  }
  if (!req.file) {
    throw new ApiError(400, 'A banner image is required');
  }

  const uploadResult = await uploadOnCloudinary(req.file.path);
  if (!uploadResult) {
    throw new ApiError(500, 'Failed to upload banner image');
  }

  const slug = await generateUniqueSlug(title);

  const blog = await Blog.create({
    title: title.trim(),
    slug,
    content,
    category: category.trim(),
    bannerImage: uploadResult.secure_url,
    // Omit the key entirely if the client didn't send one, so Mongoose's
    // schema default ('5 min read') applies instead of storing an empty string.
    ...(readTime?.trim() ? { readTime: readTime.trim() } : {}),
  });

  return res.status(201).json
  (new ApiResponse(201, blog, 'Blog created successfully'));
});


// GET /api/v1/blogs → getAllBlogs
// Purpose: Fetch all blog posts with pagination for Blog grid & Admin table

// GET /api/v1/blogs/:slug → getBlogBySlug
// Purpose: Retrieve a single blog post using its SEO-friendly slug

// PUT /api/v1/blogs/:id → updateBlog
// Purpose: Update blog content or cover image

// DELETE /api/v1/blogs/:id → deleteBlog
// Purpose: Delete a blog post from the database

// PATCH /api/v1/blogs/:id/like → toggleLikeBlog
// Purpose: Toggle like/unlike count for a blog post

// POST /api/v1/blogs/:id/comment → addComment
// Purpose: Add a new user comment to a blog post

// DELETE /api/v1/blogs/:id/comment/:commentId → deleteComment
// Purpose: Remove a specific comment from a blog post