const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const app = express();
const favicon = require('serve-favicon');

// 3. Load environment variables
dotenv.config();

//4. CONFIGURE CLOUDINARY (AFTER DOTENV)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// 5. SETUP MULTER STORAGE
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog-posts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi']

  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// 6. MIDDLEWARE (AFTER APP INIT
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// 8. ERROR HANDLER (AFTER ROUTES)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
///===========
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});
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


// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});