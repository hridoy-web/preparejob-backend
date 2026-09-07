import { Request, Response } from 'express';
import { Blog } from '../models/blog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { PipelineStage, Types } from 'mongoose';
import { IUser } from '../models/user.model.js';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const SORTABLE_FIELDS = ['createdAt', 'title'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];
type BlogRequest = Request & { user?: IUser };

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const slugify = (text: string): string =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') 
    .replace(/[\s_]+/g, '-') 
    .replace(/^-+|-+$/g, ''); 

const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const base = slugify(title);

  if (!base) {
    throw new ApiError(400, 'Title must contain at least one letter or number');
  }

  let slug = base;
  let counter = 1;

  while (await Blog.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
};

const normalizeCategory = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

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
  const trimmedCategory = normalizeCategory(category);
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
const parsePositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return fallback;

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;

  return parsed;
};

const getStringQueryParam = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const isSortableField = (value: string): value is SortableField =>
  (SORTABLE_FIELDS as readonly string[]).includes(value);

const MAX_SKIP = 10_000;

export const getAllBlogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);

  const skip = (page - 1) * limit;
  if (skip > MAX_SKIP) {
    throw new ApiError(400, 'Page number too large - please refine your search or filters');
  }

  const search = getStringQueryParam(req.query.search)?.trim();

  const rawCategory = getStringQueryParam(req.query.category);
  const category = rawCategory ? normalizeCategory(rawCategory) : undefined;

  const orderParam = getStringQueryParam(req.query.order);
  const order: 1 | -1 = orderParam === 'asc' ? 1 : -1;

  const requestedSort = getStringQueryParam(req.query.sort);
  const hasValidRequestedSort = requestedSort !== undefined && isSortableField(requestedSort);
  const sortField: SortableField = hasValidRequestedSort ? requestedSort : 'createdAt';

  const match: Record<string, unknown> = {};
  if (category) match.category = category;
  if (search) match.$text = { $search: search };

  const sortStage: Record<string, 1 | -1 | { $meta: 'textScore' }> =
    search && !hasValidRequestedSort
      ? { score: { $meta: 'textScore' } }
      : { [sortField]: order };

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $addFields: {
        likesCount: { $size: { $ifNull: ['$likes', []] } },
        commentsCount: { $size: { $ifNull: ['$comments', []] } },
      },
    },
    ...(search ? [{ $addFields: { score: { $meta: 'textScore' } } }] : []),
    { $sort: sortStage },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              title: 1,
              slug: 1,
              bannerImage: 1,
              category: 1,
              readTime: 1,
              likesCount: 1,
              commentsCount: 1,
              createdAt: 1,
              excerpt: {
                $cond: {
                  if: { $gt: [{ $strLenCP: '$content' }, 180] },
                  then: { $concat: [{ $substrCP: ['$content', 0, 180] }, '...'] },
                  else: '$content',
                },
              },
            },
          },
        ],
      },
    },
  ];

  let result;
  try {
    [result] = await Blog.aggregate(pipeline);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('text index required')) {
      throw new ApiError(500, 'Search is temporarily unavailable - missing search index');
    }
    throw error;
  }

  const total = result.metadata[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        blogs: result.data,
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Blogs fetched successfully'
    )
  );
});


// GET /api/v1/blogs/:slug → getBlogBySlug
// Purpose: Retrieve a single blog post using its SEO-friendly slug

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const getSingleParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getBlogBySlug = asyncHandler(async (req: BlogRequest, res: Response) => {
  const rawSlug = getSingleParam(req.params.slug);
  const slug = rawSlug?.trim().toLowerCase();

  if (!slug || !SLUG_PATTERN.test(slug)) {
    throw new ApiError(400, 'Invalid slug format');
  }

  const blog = await Blog.findOne({ slug });
  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }
    const userId = req.user?._id?.toString();

  const responseBody: Record<string, unknown> = blog.toObject();
  responseBody.likesCount = blog.likes.length;
  responseBody.isLikedByUser = userId
  ? blog.likes.includes(userId)
  : false;

  return res.status(200).json(new ApiResponse(200, responseBody, 'Blog fetched successfully'));
});


// DELETE /api/v1/blogs/:id → deleteBlog
// Purpose: Delete a blog post from the database

// PATCH /api/v1/blogs/:id/like → toggleLikeBlog
// Purpose: Toggle like/unlike count for a blog post

// POST /api/v1/blogs/:id/comment → addComment
// Purpose: Add a new user comment to a blog post

// DELETE /api/v1/blogs/:id/comment/:commentId → deleteComment
// Purpose: Remove a specific comment from a blog post