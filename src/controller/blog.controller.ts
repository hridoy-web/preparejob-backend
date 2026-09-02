import { Request, Response } from 'express';
import { Blog } from '../models/blog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';

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

   if (typeof title !== 'string' || typeof content !== 'string' || typeof category !== 'string') {
    throw new ApiError(400, 'title, content and category must be strings');
  }
   if (readTime !== undefined && typeof readTime !== 'string') {
    throw new ApiError(400, 'readTime must be a string');
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const trimmedCategory = category.trim();
  const trimmedReadTime = typeof readTime === 'string' ? readTime.trim() : undefined;


  if (!trimmedTitle || !trimmedContent || !trimmedCategory) {
    throw new ApiError(400, 'title, content and category are required');
  }

  if (!req.file) {
    throw new ApiError(400, 'A banner image is required');
  }
  
  let slug = await generateUniqueSlug(trimmedTitle);

  const uploadResult = await uploadOnCloudinary(req.file.path);
  if (!uploadResult) {
    throw new ApiError(500, 'Failed to upload banner image');
  }
  const MAX_SLUG_RETRIES = 3;
  let attempt = 0;

   while (true) {
    try {
      const blog = await Blog.create({
        title: trimmedTitle,
        slug,
        content: trimmedContent,
        category: trimmedCategory,
        bannerImage: { url: uploadResult.secure_url, publicId: uploadResult.public_id },
        ...(trimmedReadTime ? { readTime: trimmedReadTime } : {}),
      });

      // 5. Success
      return res.status(201).json(new ApiResponse(201, blog, 'Blog created successfully'));
    } catch (error: any) {
      const isDuplicateSlug = error?.code === 11000 && error?.keyPattern?.slug;

      if (isDuplicateSlug && attempt < MAX_SLUG_RETRIES) {
        attempt += 1;
        slug = await generateUniqueSlug(trimmedTitle);
        continue;
      }
      await deleteFromCloudinary(uploadResult.public_id);

      throw isDuplicateSlug
        ? new ApiError(409, 'Could not generate a unique slug, please try again')
        : (error instanceof Error ? error : new ApiError(500, 'Failed to create blog'));
    }
  }
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