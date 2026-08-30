// PATCH /api/v1/user/bookmark → toggleBookmark
// Purpose: Toggle bookmarking (add or remove a question ID in user's bookmarks array)

// GET /api/v1/user/bookmarks/:userId → getUserBookmarks
// Purpose: Fetch saved questions using .populate('bookmarks')

// GET /api/v1/user/liked-blogs/:userId → getUserLikedBlogs
// Purpose: Track and list all blog posts liked by the user

// GET /api/v1/user/commented-blogs/:userId → getUserCommentedBlogs
// Purpose: Track and list all blog posts where the user has commented