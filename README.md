# ⚡ PrepareJob - Backend Server REST API

Crack your dream tech interview with our powerful backend architecture. This repository contains the official REST API server designed to power high-speed technical interview preparation workflows.

<p align="left">
  <a href="https://github.com/hridoy-web/preparejob-frontend" target="_blank"><img src="https://img.shields.io/badge/💻_Frontend_REPOSITORY-18181b?style=for-the-badge&logo=github&logoColor=white" alt="Backend Repo" /></a> &nbsp;&nbsp;
  <a href="https://preparejob.infozia.site" target="_blank"><img src="https://img.shields.io/badge/🌐_EXPLORE_LIVE_WEBSITE-0ea5e9?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Site" /></a>
</p>

---

## 🔒 Terms of Use & Learning Policy
> **This backend source code is strictly intended for personal learning and technical interview preparation. You are welcome to explore and study the architecture. However, you are not permitted to copy this code or its assets to claim them as your own or use them outside of personal educational purposes.**

---

## 📂 Project Architecture & Folder Structure

```text
preparejob-backend/
├── api/index.ts                 # Serverless entry point for Vercel
├── public/temp/                 # Temporary folder for media uploads
├── src/
│   ├── config/db.ts            # MongoDB database connection setup
│   ├── controllers/            # Core business logic and request handlers
│   │   ├── admin.controller.ts # Admin controls & system stats
│   │   ├── blog.controller.ts  # Blog fetching, likes & comments
│   │   ├── question.controller.ts # Question filtering & search
│   │   └── user.controller.ts  # User bookmarks & tracking
│   ├── middlewares/            # Security filters & file upload handling
│   │   └── multer.middleware.ts
│   ├── models/                 # Mongoose database schemas and types
│   │   ├── blog.model.ts       # Blog schema
│   │   ├── question.model.ts   # Question schema
│   │   └── user.model.ts       # User schema
│   ├── routes/                 # API endpoint routing setup
│   │   ├── admin.routes.ts     # Routes for /api/admin/*
│   │   ├── blog.routes.ts      # Routes for /api/blogs/*
│   │   ├── question.routes.ts  # Routes for /api/questions/*
│   │   └── user.routes.ts      # Routes for /api/user/*
│   ├── utils/                  # Reusable helper tools & functions
│   │   ├── ApiError.ts         # Centralized error handler
│   │   ├── ApiResponse.ts      # Standardized JSON response helper
│   │   ├── asyncHandler.ts     # Async try-catch wrapper
│   │   └── cloudinary.ts       # Cloudinary storage config
│   ├── app.ts                  # Express config, CORS & routes
│   └── server.ts               # Database listener & server startup
├── .env                        # Environment variables and secrets
├── .gitignore                  # Ignored files for Git
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── vercel.json                 # Vercel deployment settings
```
---

## 🔌 API Module Breakdown & Endpoints

### 1. Question Module (`question.controller.ts`)
* **POST `/api/questions`** — Create new questions (Admin Dashboard).
* **GET `/api/questions`** — Fetch all questions with pagination and sorting.
* **GET `/api/questions/:id`** — Read a specific question's details.
* **PUT `/api/questions/:id`** — Update existing questions.
* **DELETE `/api/questions/:id`** — Remove a question.

### 2. Blog Module (`blog.controller.ts`)
* **POST `/api/blogs`** — Create a new blog article with image banner.
* **GET `/api/blogs`** — Fetch all blogs with pagination.
* **GET `/api/blogs/:slug`** — Read detailed blog content via slug.
* **PUT `/api/blogs/:id`** — Update blog article details.
* **DELETE `/api/blogs/:id`** — Delete a blog post.
* **PATCH `/api/blogs/:id/like`** — Toggle or count user likes.
* **POST `/api/blogs/:id/comment`** — Save user comments.
* **DELETE `/api/blogs/:id/comment/:commentId`** — Remove a comment.

### 3. User Dashboard & Tracking Module (`user.controller.ts`)
* **PATCH `/api/user/bookmark`** — Save or remove question IDs in bookmarks.
* **GET `/api/user/bookmarks/:userId`** — Fetch saved questions for Dashboard.
* **GET `/api/user/liked-blogs/:userId`** — Track blogs liked by the user.
* **GET `/api/user/commented-blogs/:userId`** — Track user comments.

### 4. Admin Dashboard Module (`admin.controller.ts`)
* **GET `/api/admin/stats`** — Overview counts for users, questions, and blogs.
* **GET `/api/admin/users`** — Fetch all registered users with pagination.
* **PATCH `/api/admin/users/:id/status`** — Toggle user status (Active/Blocked).
* **DELETE `/api/admin/users/:id`** — Remove spam users.

---

## 🛠️ Tech Stack & Tools

* **Runtime:** Node.js, Express.js (REST APIs)
* **Database & ODM:** MongoDB, Mongoose
* **Media Management:** Cloudinary & Multer
* **Language:** TypeScript
* **Deployment:** Vercel Serverless

---

## 👥 Backend Development Team & Contributions

| Contributor | GitHub Profile | Core Responsibilities & Modules |
| :--- | :--- | :--- |
| **Hridoy Chowdhury** *(Team Lead)* | [@hridoy-web](https://github.com/hridoy-web) | Handled overall backend setup, folder structure, Mongoose models, database configuration, Cloudinary setup, helper utilities (ApiError, ApiResponse, asyncHandler), and team workflow management. |
| **Shihab Bhuiya** | [@shihab-bhuiya](https://github.com/shihab-bhuiya) | Developed the Question Module (question.controller.ts), handling question creation, filtering, search, updates, and pagination. |
| **Shihab Ul Islam** | [@shihab-5](https://github.com/shihab-5) | Developed the Blog Module (blog.controller.ts), handling article creation, updates, reader interactions, comments, and likes. |
| **Anim** | [@anim710](https://github.com/anim710) | Developed the User & Admin Tracking Modules (user.controller.ts & admin.controller.ts), managing system stats, user bookmarks, status toggling, and user management features. |

---

<p align="left">
  <a href="https://github.com/hridoy-web/preparejob-backend" target="_blank"><img src="https://img.shields.io/badge/💻_BACKEND_REPOSITORY-18181b?style=for-the-badge&logo=github&logoColor=white" alt="Backend Repo" /></a> &nbsp;&nbsp;
  <a href="https://preparejob.infozia.site" target="_blank"><img src="https://img.shields.io/badge/🌐_EXPLORE_LIVE_WEBSITE-0ea5e9?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Site" /></a>
</p>
