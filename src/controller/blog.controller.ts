import { Request, Response } from 'express';
import fs from 'fs';
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

export interface BlogRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

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

const normalizeCategory = (value: string): string => value.trim().replace(/\s+/g, ' ');

// ---------------------------------------------------------------------------
// POST /api/v1/blogs (Admin Dashboard)
// ---------------------------------------------------------------------------
export const createBlog = asyncHandler(async (req: BlogRequest, res: Response) => {
  const { title, content, category, readTime } = req.body;

  if (typeof title !== 'string' || typeof content !== 'string' || typeof category !== 'string') {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new ApiError(400, 'title, content and category must be strings');
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const trimmedCategory = normalizeCategory(category);
  const trimmedReadTime = typeof readTime === 'string' && readTime.trim() ? readTime.trim() : undefined;

  if (!trimmedTitle || !trimmedContent || !trimmedCategory) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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
        : error instanceof Error
        ? error
        : new ApiError(500, 'Failed to create blog');
    }
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/blogs (Blog Grid & Admin Table)
// ---------------------------------------------------------------------------
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
  
  if (category) {
    match.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }
  
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
    ...(search ? [{ $addFields: { score: { $meta: 'textScore' } } }] as PipelineStage[] : []),
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

  const total = result?.metadata?.[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        blogs: result?.data || [],
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

// ---------------------------------------------------------------------------
// GET /api/v1/blogs/:slug (Single Blog Page)
// ---------------------------------------------------------------------------
export const getBlogBySlug = asyncHandler(async (req: BlogRequest, res: Response) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string') {
    throw new ApiError(400, 'Slug is required');
  }
  const normalizedSlug = slug.trim().toLowerCase();

  const blog = await Blog.findOne({ slug: normalizedSlug });
  if (!blog) {
    throw new ApiError(404, 'Blog not found');
  }

  const userId = req.user?._id?.toString();

  const responseBody: Record<string, unknown> = blog.toObject();
  const likesArray = Array.isArray(blog.likes) ? blog.likes : [];

  responseBody.likesCount = likesArray.length;
  responseBody.isLikedByUser = userId
    ? likesArray.some((id: unknown) => id?.toString() === userId)
    : false;

  return res.status(200).json(new ApiResponse(200, responseBody, 'Blog fetched successfully'));
});



// ---------------------------------------------------------------------------
// PUT /api/v1/blogs/:id → updateBlog   (admin only - enforced in routes.ts)
// ---------------------------------------------------------------------------

const isDuplicateKeyError = (error: unknown, field: string): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { code?: unknown; keyPattern?: unknown };
  return (
    err.code === 11000 &&
    typeof err.keyPattern === 'object' &&
    err.keyPattern !== null &&
    field in err.keyPattern
  );
};
export const updateBlog = asyncHandler(async (req: BlogRequest, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid blog id');
  }

  const blog = await Blog.findById(id);
  if (!blog) throw new ApiError(404, 'Blog not found');

  const { title, content, category, readTime } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string') throw new ApiError(400, 'title must be a string');
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new ApiError(400, 'title cannot be empty');
    if (trimmedTitle !== blog.title) {
      blog.title = trimmedTitle;
      blog.slug = await generateUniqueSlug(trimmedTitle, id);
    }
  }

  if (content !== undefined) {
    if (typeof content !== 'string') throw new ApiError(400, 'content must be a string');
    const trimmedContent = content.trim();
    if (!trimmedContent) throw new ApiError(400, 'content cannot be empty');
    blog.content = trimmedContent;
  }

  if (category !== undefined) {
    if (typeof category !== 'string') throw new ApiError(400, 'category must be a string');
    const normalized = normalizeCategory(category);
    if (!normalized) throw new ApiError(400, 'category cannot be empty');
    blog.category = normalized;
  }

  if (readTime !== undefined) {
    if (typeof readTime !== 'string') throw new ApiError(400, 'readTime must be a string');
    const trimmedReadTime = readTime.trim();
    if (!trimmedReadTime) throw new ApiError(400, 'readTime cannot be empty');
    blog.readTime = trimmedReadTime;
  }

  // uploadOnCloudinary already deletes the local temp file on both success
  // and failure - no cleanup needed here, adding one would duplicate that
  // responsibility.
  let newUploadPublicId: string | null = null;
  let oldPublicId: string | null = null;

  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) {
      throw new ApiError(500, 'Failed to upload new banner image');
    }

    newUploadPublicId = uploadResult.public_id;
    oldPublicId = blog.bannerImage.publicId;
    blog.bannerImage = { url: uploadResult.secure_url, publicId: uploadResult.public_id };
  }

  try {
    await blog.save();
  } catch (error: unknown) {
    const isDuplicateSlug = isDuplicateKeyError(error, 'slug');

    // deleteFromCloudinary never throws (it catches and logs internally),
    // so this call can't mask the real save() error below.
    if (newUploadPublicId) {
      await deleteFromCloudinary(newUploadPublicId);
    }

    if (isDuplicateSlug) {
      throw new ApiError(409, 'Slug already exists, please modify the title');
    }
    throw error instanceof Error ? error : new ApiError(500, 'Failed to update blog');
  }

  // save() succeeded - the update is a success from the client's point of
  // view regardless of what happens next. A failure here is logged inside
  // deleteFromCloudinary and never surfaces as an API error.
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }

  return res.status(200).json(new ApiResponse(200, blog, 'Blog updated successfully'));
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/blogs/:id → deleteBlog   (admin only - enforced in routes.ts)
// ---------------------------------------------------------------------------
export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid blog id');
  }

  const blog = await Blog.findById(id);
  if (!blog) throw new ApiError(404, 'Blog not found');

  const publicId = blog.bannerImage.publicId;

  await blog.deleteOne();

  await deleteFromCloudinary(publicId);

  return res.status(200).json(new ApiResponse(200, { _id: id }, 'Blog deleted successfully'));
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/blogs/:id/like → toggleLikeBlog
// ---------------------------------------------------------------------------
export const toggleLikeBlog = asyncHandler(async (req: BlogRequest, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid blog id');
  }

  const { userId } = req.body;
  if (!userId || typeof userId !== 'string' || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid user id is required');
  }

  const blog = await Blog.findByIdAndUpdate(
    id,
    [
      {
        $set: {
          likes: {
            $cond: {
              if: { $in: [userId, { $ifNull: ['$likes', []] }] },
              then: { $setDifference: ['$likes', [userId]] },
              else: { $concatArrays: [{ $ifNull: ['$likes', []] }, [userId]] },
            },
          },
        },
      },
    ],
    { new: true, updatePipeline: true }
  ).select('likes');

  if (!blog) throw new ApiError(404, 'Blog not found');

  const liked = blog.likes.includes(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, { liked, likesCount: blog.likes.length }, liked ? 'Blog liked' : 'Blog unliked'));
});



// ---------------------------------------------------------------------------
// POST /api/v1/blogs/:id/comment → addComment
// ---------------------------------------------------------------------------
export const addComment = asyncHandler(async (req: BlogRequest, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid blog id');
  }

  const { userId, userName, userImage, commentText } = req.body;

  if (!userId || typeof userId !== 'string' || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid user id is required');
  }
  if (typeof userName !== 'string' || !userName.trim()) {
    throw new ApiError(400, 'userName is required');
  }
  if (typeof commentText !== 'string') {
    throw new ApiError(400, 'commentText is required');
  }

  const comment = commentText.trim();
  if (!comment) throw new ApiError(400, 'Comment cannot be empty');
  if (comment.length > 500) throw new ApiError(400, 'Comment cannot exceed 500 characters');

  const newComment = {
    userId,
    userName: userName.trim(),
    userImage: typeof userImage === 'string' ? userImage : undefined,
    commentText: comment,
  };

  const blog = await Blog.findByIdAndUpdate
  (id, { $push: { comments: newComment } },
     { new: true }).select(
    'comments'
  );

  if (!blog) throw new ApiError(404, 'Blog not found');

  const savedComment = blog.comments[blog.comments.length - 1];

  return res.status(201).json(new ApiResponse(201, savedComment, 'Comment added successfully'));
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/blogs/:id/comment/:commentId → deleteComment
// ---------------------------------------------------------------------------
export const deleteComment = asyncHandler(async (req: BlogRequest, res: Response) => {
  const { id, commentId } = req.params;

  if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid blog id');
  }
  if (!commentId || typeof commentId !== 'string' || !isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id');
  }

  const { userId } = req.body;
  if (!userId || typeof userId !== 'string' || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid user id is required');
  }

  const blog = await Blog.findById(id).select('comments');
  if (!blog) throw new ApiError(404, 'Blog not found');

  const comment = blog.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  if (comment.userId !== userId) {
    throw new ApiError(403, 'You are not allowed to delete this comment');
  }

  await Blog.updateOne({ _id: id }, { $pull: { comments: { _id: commentId } } });

  return res.status(200).json(new ApiResponse(200, { _id: commentId }, 'Comment deleted successfully'));
});
