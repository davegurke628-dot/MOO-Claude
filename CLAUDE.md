# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marketing Options Online (MOO) is a digital marketing agency website with a built-in CMS. It's a Node.js/Express application with a static HTML frontend and JSON file-based storage (no external database required). Requires Node.js 18+.

## Commands

```bash
# Install dependencies
npm install

# Start production server
npm start

# Start development server with hot reload
npm run dev

# Initial setup (creates uploads directory)
npm run setup
```

The server runs on `http://localhost:3000` by default (configurable via PORT env var).

## Architecture

### Backend (`server/server.js`)
- Single Express server handling both API routes and static file serving
- JSON file-based database using a custom `JsonDB` class that stores data in `server/database/`
- JWT authentication with bcryptjs password hashing
- Multer for image upload handling (5MB limit, images only)

**Database files (auto-created):**
- `users.json` - Admin users
- `posts.json` - Blog posts
- `categories.json` - Post categories
- `media.json` - Uploaded media metadata
- `leads.json` - Contact form submissions

**API Routes:**
- `/api/auth/*` - Login, current user
- `/api/posts/*` - CRUD for blog posts
- `/api/categories` - List categories
- `/api/media/*` - Upload, list, delete images
- `/api/leads` - Contact form submissions
- `/api/stats` - Dashboard statistics

### Frontend

**Public pages:**
- `index.html` - Homepage with services, testimonials, lead magnet form, audit tool
- `services.html`, `about.html`, `contact.html`, `blog.html`, `blog-post.html`
- `service-*.html` - Individual service detail pages (seo, social-media, google-business, ai-marketing, content-creation, website-design)

**Admin pages (`admin/`):**
- `login.html` - Admin authentication
- `dashboard.html` - Stats overview
- `posts.html` - Post management with pagination
- `post-editor.html` - Create/edit posts
- `media.html` - Media library
- `settings.html` - User settings

**JavaScript (`assets/js/`):**
- `main.js` - Public site: header scroll, mobile menu, animations, form handling
- `admin.js` - Admin: authentication check, sidebar, API helper object (`window.api`)
- `audit-tool.js` - Website health check tool (simulated analysis)
- `hero-background.js` - Homepage animated background

### Default Credentials

Admin login: `admin@marketingoptionsonline.com` / `admin123`

(Created automatically on first server start if no users exist)

## Key Patterns

- Auth tokens stored in `localStorage` as `authToken`
- API requests use Bearer token authentication
- Posts use slug-based URLs, auto-generated from title if not provided
- All frontend forms submit via JavaScript to `/api/*` endpoints
- Toast notifications via global `showToast(message, type)` function
