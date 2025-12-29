/**
 * Marketing Options Online - CMS Backend Server
 * Node.js + Express + JSON File Storage
 * (No native dependencies required)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database file paths
const DB_DIR = path.join(__dirname, 'database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const POSTS_FILE = path.join(DB_DIR, 'posts.json');
const CATEGORIES_FILE = path.join(DB_DIR, 'categories.json');
const MEDIA_FILE = path.join(DB_DIR, 'media.json');
const LEADS_FILE = path.join(DB_DIR, 'leads.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'assets', 'images', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple JSON Database Helper
class JsonDB {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error(`Error loading ${this.filePath}:`, err.message);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`Error saving ${this.filePath}:`, err.message);
    }
  }

  getAll() {
    return this.data;
  }

  getById(id) {
    return this.data.find(item => item.id === id);
  }

  getByField(field, value) {
    return this.data.find(item => item[field] === value);
  }

  filterBy(field, value) {
    return this.data.filter(item => item[field] === value);
  }

  insert(item) {
    const id = this.data.length > 0 ? Math.max(...this.data.map(i => i.id)) + 1 : 1;
    const newItem = { id, ...item, created_at: new Date().toISOString() };
    this.data.push(newItem);
    this.save();
    return newItem;
  }

  update(id, updates) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.data[index];
    }
    return null;
  }

  delete(id) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }
}

// Initialize databases
const usersDB = new JsonDB(USERS_FILE);
const postsDB = new JsonDB(POSTS_FILE);
const categoriesDB = new JsonDB(CATEGORIES_FILE);
const mediaDB = new JsonDB(MEDIA_FILE);
const leadsDB = new JsonDB(LEADS_FILE);

// Create default admin user if not exists
if (!usersDB.getByField('email', 'admin@marketingoptionsonline.com')) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  usersDB.insert({
    name: 'Admin User',
    email: 'admin@marketingoptionsonline.com',
    password: hashedPassword,
    role: 'admin'
  });
  console.log('Default admin user created: admin@marketingoptionsonline.com / admin123');
}

// Create default categories if empty
if (categoriesDB.getAll().length === 0) {
  const defaultCategories = [
    { name: 'SEO', slug: 'seo', description: 'Search Engine Optimization tips and strategies' },
    { name: 'Social Media', slug: 'social-media', description: 'Social media marketing insights' },
    { name: 'Google Business', slug: 'google-business', description: 'Google Business Profile optimization' },
    { name: 'AI Marketing', slug: 'ai-marketing', description: 'AI-powered marketing strategies' },
    { name: 'Website Design', slug: 'website-design', description: 'Web design and development tips' },
    { name: 'Content Creation', slug: 'content-creation', description: 'Content marketing strategies' },
    { name: 'Reviews', slug: 'reviews', description: 'Review management and reputation' },
    { name: 'General', slug: 'general', description: 'General marketing tips' }
  ];
  defaultCategories.forEach(cat => categoriesDB.insert(cat));
}

// Create sample blog posts if empty
if (postsDB.getAll().length === 0) {
  const samplePosts = [
    {
      title: '10 SEO Strategies That Will Transform Your Local Business in 2025',
      slug: '10-seo-strategies-2025',
      content: '<p>Discover the proven SEO tactics that are helping local businesses dominate search results...</p>',
      excerpt: 'Discover the proven SEO tactics that are helping local businesses dominate search results and attract more customers than ever before.',
      category: 'seo',
      tags: ['SEO', 'Local Business', '2025'],
      status: 'published',
      meta_title: '10 SEO Strategies for Local Business in 2025',
      meta_description: 'Discover the proven SEO tactics that are helping local businesses dominate search results.',
      author_id: 1,
      views: 1234,
      published_at: new Date().toISOString()
    },
    {
      title: 'How to Create a Social Media Strategy That Actually Converts',
      slug: 'social-media-strategy-converts',
      content: '<p>Stop posting randomly and start seeing real results from your social media efforts...</p>',
      excerpt: 'Stop posting randomly and start seeing real results from your social media efforts with this proven strategy framework.',
      category: 'social-media',
      tags: ['Social Media', 'Strategy', 'Marketing'],
      status: 'published',
      author_id: 1,
      views: 987,
      published_at: new Date().toISOString()
    },
    {
      title: 'The Ultimate Guide to Google Business Profile Optimization',
      slug: 'google-business-profile-optimization',
      content: '<p>Learn how to fully optimize your Google Business Profile to appear in the local pack...</p>',
      excerpt: 'Learn how to fully optimize your Google Business Profile to appear in the local pack and attract more customers.',
      category: 'google-business',
      tags: ['Google Business', 'Local SEO'],
      status: 'published',
      author_id: 1,
      views: 756,
      published_at: new Date().toISOString()
    },
    {
      title: '5 AI Tools Every Small Business Should Be Using Right Now',
      slug: '5-ai-tools-small-business',
      content: '<p>Artificial intelligence isn\'t just for big corporations...</p>',
      excerpt: 'Artificial intelligence isn\'t just for big corporations. These affordable AI tools can transform how you market your business.',
      category: 'ai-marketing',
      tags: ['AI', 'Tools', 'Small Business'],
      status: 'draft',
      author_id: 1,
      views: 0
    }
  ];
  samplePosts.forEach(post => postsDB.insert(post));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = usersDB.getByField('email', email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = usersDB.getById(req.user.id);
  if (user) {
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// ==================== POSTS ROUTES ====================

// Get all posts
app.get('/api/posts', (req, res) => {
  const { status, category, limit = 20, offset = 0 } = req.query;

  let posts = postsDB.getAll();

  // Filter by status
  if (status) {
    posts = posts.filter(p => p.status === status);
  }

  // Filter by category
  if (category) {
    posts = posts.filter(p => p.category === category);
  }

  // Sort by created_at descending
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Get total before pagination
  const total = posts.length;

  // Paginate
  posts = posts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  // Add author name
  posts = posts.map(post => {
    const author = usersDB.getById(post.author_id);
    return { ...post, author_name: author ? author.name : 'Unknown' };
  });

  res.json({ posts, total, limit: parseInt(limit), offset: parseInt(offset) });
});

// Get single post by slug
app.get('/api/posts/:slug', (req, res) => {
  const post = postsDB.getByField('slug', req.params.slug);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Increment views
  postsDB.update(post.id, { views: (post.views || 0) + 1 });

  // Add author name
  const author = usersDB.getById(post.author_id);
  const postWithAuthor = { ...post, author_name: author ? author.name : 'Unknown' };

  res.json(postWithAuthor);
});

// Create post
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, content, excerpt, category, tags, status, metaTitle, metaDescription, slug, featuredImage } = req.body;

  // Generate slug if not provided
  const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check for duplicate slug
  const existing = postsDB.getByField('slug', postSlug);
  if (existing) {
    return res.status(400).json({ message: 'A post with this URL already exists' });
  }

  // Generate excerpt if not provided
  const postExcerpt = excerpt || (content ? content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '');

  const newPost = postsDB.insert({
    title,
    slug: postSlug,
    content,
    excerpt: postExcerpt,
    category,
    tags: tags || [],
    status: status || 'draft',
    meta_title: metaTitle || title,
    meta_description: metaDescription || postExcerpt,
    featured_image: featuredImage || null,
    author_id: req.user.id,
    views: 0,
    published_at: status === 'published' ? new Date().toISOString() : null
  });

  res.status(201).json({
    id: newPost.id,
    slug: postSlug,
    message: 'Post created successfully'
  });
});

// Update post
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const { title, content, excerpt, category, tags, status, metaTitle, metaDescription, slug, featuredImage } = req.body;
  const postId = parseInt(req.params.id);

  const existing = postsDB.getById(postId);
  if (!existing) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Check slug uniqueness if changed
  if (slug && slug !== existing.slug) {
    const slugExists = postsDB.getByField('slug', slug);
    if (slugExists && slugExists.id !== postId) {
      return res.status(400).json({ message: 'A post with this URL already exists' });
    }
  }

  const postExcerpt = excerpt || (content ? content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : existing.excerpt);
  const publishedAt = status === 'published' && existing.status !== 'published'
    ? new Date().toISOString()
    : existing.published_at;

  postsDB.update(postId, {
    title: title || existing.title,
    slug: slug || existing.slug,
    content: content !== undefined ? content : existing.content,
    excerpt: postExcerpt,
    category: category || existing.category,
    tags: tags || existing.tags,
    status: status || existing.status,
    meta_title: metaTitle || existing.meta_title,
    meta_description: metaDescription || existing.meta_description,
    featured_image: featuredImage !== undefined ? featuredImage : existing.featured_image,
    published_at: publishedAt
  });

  res.json({ message: 'Post updated successfully' });
});

// Delete post
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postId = parseInt(req.params.id);
  const deleted = postsDB.delete(postId);

  if (!deleted) {
    return res.status(404).json({ message: 'Post not found' });
  }

  res.json({ message: 'Post deleted successfully' });
});

// ==================== CATEGORIES ROUTES ====================

app.get('/api/categories', (req, res) => {
  const categories = categoriesDB.getAll();
  res.json(categories);
});

// ==================== MEDIA ROUTES ====================

// Upload image
app.post('/api/media/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const newMedia = mediaDB.insert({
    filename: req.file.filename,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    size: req.file.size,
    path: `/assets/images/uploads/${req.file.filename}`,
    uploaded_by: req.user.id
  });

  res.json({
    id: newMedia.id,
    filename: req.file.filename,
    path: `/assets/images/uploads/${req.file.filename}`,
    message: 'File uploaded successfully'
  });
});

// Get all media
app.get('/api/media', authenticateToken, (req, res) => {
  const media = mediaDB.getAll();
  media.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(media);
});

// Delete media
app.delete('/api/media/:id', authenticateToken, (req, res) => {
  const mediaId = parseInt(req.params.id);
  const media = mediaDB.getById(mediaId);

  if (!media) {
    return res.status(404).json({ message: 'Media not found' });
  }

  // Delete file from filesystem
  const filePath = path.join(__dirname, '..', media.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  mediaDB.delete(mediaId);

  res.json({ message: 'Media deleted successfully' });
});

// ==================== LEADS ROUTES ====================

// Submit lead (contact form, lead magnet, etc.)
app.post('/api/leads', (req, res) => {
  const { name, email, business, phone, service, message, source } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const newLead = leadsDB.insert({
    name,
    email,
    business,
    phone,
    service,
    message,
    source: source || 'website'
  });

  res.status(201).json({
    id: newLead.id,
    message: 'Thank you! We\'ll be in touch soon.'
  });
});

// Get all leads (admin)
app.get('/api/leads', authenticateToken, (req, res) => {
  const leads = leadsDB.getAll();
  leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(leads);
});

// ==================== STATS ROUTES ====================

app.get('/api/stats', authenticateToken, (req, res) => {
  const posts = postsDB.getAll();
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLeads = leadsDB.getAll().length;

  res.json({
    totalPosts,
    publishedPosts,
    draftPosts,
    totalViews,
    totalLeads
  });
});

// ==================== SERVER ====================

// Serve static files - catch all for SPA
app.get('*', (req, res) => {
  // Check if requesting an HTML file that exists
  const requestedPath = path.join(__dirname, '..', req.path);
  if (fs.existsSync(requestedPath) && requestedPath.endsWith('.html')) {
    return res.sendFile(requestedPath);
  }
  // Default to index.html
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
  =========================================
  Marketing Options Online CMS Server
  =========================================
  Server running on http://localhost:${PORT}

  Default admin credentials:
  Email: admin@marketingoptionsonline.com
  Password: admin123

  IMPORTANT: Change these in production!
  =========================================
  `);
});

module.exports = app;
