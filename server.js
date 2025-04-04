const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Add at the top of server.js
const fs = require('fs');
const path = require('path');

//Debug deployment structure
/*console.log('=== Server Starting ===');
console.log('Current directory:', __dirname);
console.log('Directory contents:', fs.readdirSync(__dirname));
try {
  console.log('Models directory contents:', fs.readdirSync(path.join(__dirname, 'models')));
} catch (err) {
  console.error('Error reading models directory:', err);
}*/
dotenv.config();

// Enhanced Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensure HTTPS
});

// Optimized Cloudinary Storage Configuration=====
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
    const publicId = `${req.params.section || 'general'}_${Date.now()}`;
    
    return {
      folder: 'future_tech_talent',
      public_id: publicId,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:best' }
      ],
      overwrite: false,
      tags: ['admin_dashboard', req.params.section]
    };
  }
});
// After cloudinary.config()
cloudinary.api.ping()
  .then(() => console.log('✅ Cloudinary connection OK'))
  .catch(err => console.error('❌ Cloudinary connection failed:', err));

/////////////
// Add this at the top of your routes
const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'blog-posts',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Then modify your POST route
app.post('/api/posts', 
  authenticateAdmin,
  upload.single('image'), // 'image' must match your FormData field name
  async (req, res) => {
    try {
      console.log('Uploaded file:', req.file); // Debug Cloudinary upload
      console.log('Text fields:', req.body); // Debug title/content

      const newPost = await Post.create({
        title: req.body.title,
        content: req.body.content,
        image: req.file?.path // Cloudinary URL
      });

      res.status(201).json({ 
        success: true, 
        data: newPost 
      });
    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);
//=========
// Error handling middleware for uploads (now properly placed after initialization)
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE' 
        ? 'File too large (max 10MB)' 
        : 'File upload error'
    });
  } else if (err) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  next();
};

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Models
const Post = require(path.join(__dirname, 'models', 'Post'));  // Match exact filename
const User = require(path.join(__dirname, 'models', 'User'));
const Header = require(path.join(__dirname, 'models', 'Header'));
const Service = require(path.join(__dirname, 'models', 'Service'));
const Footer = require(path.join(__dirname, 'models', 'Footer'));


// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
// Replace your current CORS middleware with this:
app.use(cors({
  origin: [
    'https://my-website-backend-ixzh.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000' // Add your admin dashboard origin
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Admin')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin', 'admin_dashboard.html'));
});

// Initialize default data
async function initializeDefaultData() {
  try {
    // Ensure admin exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'securepassword123';
    
    const adminExists = await User.exists({ email: adminEmail, role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Default admin user created');
    }

    // Ensure default service exists
    const existingService = await Service.findOne({ serviceId: 1 });
    if (!existingService) {
      await Service.create({
        serviceId: 1,
        title: 'Default Service',
        description: 'This is the default service description',
        image: ''
      });
      console.log('✅ Default service created');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

mongoose.connection.once('open', initializeDefaultData);

// Authentication middleware
function authenticateAdmin(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Additional check for admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
}

/////////////////
// Add this middleware before your routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
// ==================== API Routes ====================

// Admin login
app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Header routes
app.get('/api/header', authenticateAdmin, async (req, res) => {
  try {
    const header = await Header.findOne() || { 
      title: 'FutureTechTalent - Professional Business Solutions',
      image: '' 
    };
    res.json({
      success: true,
      data: header
    });
  } catch (error) {
    console.error('Header fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch header'
    });
  }
});

app.put('/api/header', 
  authenticateAdmin,
  upload.single('image'),
  handleUploadErrors,
  async (req, res) => {
    try {
      const updateData = {
        title: req.body.title
      };

      if (req.file) {
        updateData.image = req.file.path;
      }

      const header = await Header.findOneAndUpdate(
        {},
        updateData,
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: 'Header updated successfully',
        data: header
      });
    } catch (error) {
      console.error('Header update error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Service routes
// Ensure these routes exist in your server.js
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Service routes
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id });
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: 'Service not found' 
      });
    }
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add proper error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  
  // Always return JSON, even for errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});
// In server.js
app.put('/api/services/:id', 
  authenticateAdmin,
  upload.single('image'),
  handleUploadErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        title: req.body.title,
        description: req.body.description
      };

      if (req.file) {
        updateData.image = req.file.path;
      }

      const service = await Service.findOneAndUpdate(
        { serviceId: id },
        updateData,
        { new: true }
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: service,
        message: 'Service updated successfully'
      });
    } catch (error) {
      console.error('Service update error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);
// Footer routes
app.get('/api/footer', authenticateAdmin, async (req, res) => {
  try {
    const footer = await Footer.findOne() || { text: '' };
    res.json({
      success: true,
      data: footer
    });
  } catch (error) {
    console.error('Footer fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch footer'
    });
  }
});

app.put('/api/footer', authenticateAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    const footer = await Footer.findOneAndUpdate(
      {}, 
      { text },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      message: 'Footer updated successfully',
      data: footer
    });
  } catch (error) {
    console.error('Footer update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update footer'
    });
  }
});

// Health check endpoint
app.get('/admin/healthcheck', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({
      status: 'OK',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      adminUsersExist: adminCount > 0,
      cloudinary: !!cloudinary.config().cloud_name
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

//===============Blog===
// Get all posts
// Get all posts - ensure this returns an array
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json({ 
      success: true, 
      data: posts 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Create a new post
// POST new post
app.post('/api/posts', 
  authenticateAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  handleUploadErrors,
  async (req, res) => {
    try {
      const { title, content } = req.body;
      const image = req.files?.image?.[0]?.path;
      const video = req.files?.video?.[0]?.path;

      const post = await Post.create({ title, content, image, video });
      res.status(201).json({ 
        success: true, 
        data: post 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

// Update a post
app.put('/api/posts/:id', 
  authenticateAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  handleUploadErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const image = req.files?.image?.[0]?.path || null;
      const video = req.files?.video?.[0]?.path || null;

      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { title, content, image, video },
        { new: true }
      );

      if (!updatedPost) {
        return res.status(404).json({ 
          success: false, 
          message: 'Post not found' 
        });
      }

      res.json({ 
        success: true, 
        data: updatedPost 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

// Delete a post
app.delete('/api/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
//=================end blog ===

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
//===============

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});