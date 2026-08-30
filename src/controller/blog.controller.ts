// POST /api/v1/blogs → createBlog
// Purpose: Create a new blog post with a cover image using upload.single('image')

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