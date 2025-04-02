const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Load environment variables
dotenv.config();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Enhanced Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensure HTTPS
});

// Optimized Cloudinary Storage Configuration
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

// Configure Multer with better error handling
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Error handling middleware for uploads
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

  //=====////====///
  async function initializeDefaultService() {
    try {
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
      console.error('Error initializing default service:', error);
    }
  }
  
  // Call after MongoDB connection
  mongoose.connection.once('open', initializeDefaultService);
  ///====////====///
// Models
const User = require('./models/User');
const Header = require('./models/Header');
const Service = require('./models/Service');
const Footer = require('./models/Footer');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
  origin: [
    'https://your-frontend-domain.com', // Your production frontend
    'http://localhost:3000'            // Local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure admin exists on startup
async function ensureAdminExists() {
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
}

mongoose.connection.once('open', async () => {
  await ensureAdminExists();
});

// Authentication middleware
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Unified file upload handler
const handleCloudinaryUpload = async (file, folder) => {
  if (!file) return null;
  
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `future_tech_talent/${folder}`,
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw new Error('File upload failed');
  }
};

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
    if (!user || !(await user.correctPassword(password))) {
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
// Update your header routes to match frontend expectations
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
      message: 'Failed to fetch header',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Upload service image/update service
app.put('/api/services/:id', 
  upload.single('media'),
  handleUploadErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      
      const updateData = { title, description };
      if (req.file) {
        updateData.media = {
          url: req.file.path,
          public_id: req.file.filename,
          resource_type: req.file.resource_type
        };
      }

      const service = await Service.findOneAndUpdate(
        { serviceId: parseInt(id) },
        updateData,
        { new: true }
      );

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: service
      });
    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename, {
          resource_type: req.file.resource_type
        });
      }
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Upload header image
app.put('/api/header', 
  upload.single('image'),
  handleUploadErrors,
  async (req, res) => {
    try {
      const updateData = {
        title: req.body.title
      };

      if (req.file) {
        updateData.image = {
          url: req.file.path,
          public_id: req.file.filename
        };
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
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);
// Services routes
// Get service by numeric ID
app.get('/api/services/:serviceId', async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: parseInt(req.params.serviceId) });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update service
app.put('/api/services/:serviceId', async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { serviceId: parseInt(req.params.serviceId) },
      req.body,
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Footer routes
app.get('/api/footer', authenticateAdmin, async (req, res) => {
  try {
    const footer = await Footer.findOne() || { text: '' };
    res.json(footer);
  } catch (error) {
    console.error('Footer fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch footer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.json(footer);
  } catch (error) {
    console.error('Footer update error:', error);
    res.status(500).json({ 
      message: 'Failed to update footer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Default error handler
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Static files and fallback
app.use(express.static(path.join(__dirname, 'Admin')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


//===================
// Service Endpoints
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: parseInt(req.params.id) });
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

// Content Endpoints
app.post('/api/content/header', async (req, res) => {
  try {
    // Process header update
    res.json({ 
      success: true,
      message: 'Header updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/content/footer', async (req, res) => {
  try {
    // Process footer update
    res.json({ 
      success: true,
      message: 'Footer updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});