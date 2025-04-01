const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User'); // Add this with other model imports
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Load environment variables
dotenv.config();

// Configure Cloudinary FIRST (before routes)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: 'future_tech_talent', // Main folder for all uploads
      resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Auto-resize
    };
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1); // Exit if DB connection fails
});
// Models (your existing models)
// ... [keep all your model requires] ...

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
  origin: 'https://my-website-backend-ixzh.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Remove local uploads directory setup (not needed with Cloudinary)

// MongoDB connection (keep your existing code)
// ... [keep your MongoDB connection code] ...

// ==================== Updated Routes ====================

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

// Updated Scholarship Endpoint
app.post('/api/scholarships', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const imageUrl = req.file 
      ? (await handleCloudinaryUpload(req.file, 'scholarships')) 
      : null;

    const newScholarship = new Scholarship({ 
      title, 
      description, 
      image: imageUrl 
    });

    await newScholarship.save();
    res.status(201).json(newScholarship);
  } catch (err) {
    console.error("Error creating scholarship:", err);
    res.status(400).json({ 
      message: err.message || 'Error creating scholarship' 
    });
  }
});

// Updated Vacancy Endpoint
app.post('/api/vacancies', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const imageUrl = req.file 
      ? (await handleCloudinaryUpload(req.file, 'vacancies')) 
      : null;

    const newVacancy = new Vacancy({ 
      title, 
      description, 
      imageUrl 
    });

    await newVacancy.save();
    res.status(201).json(newVacancy);
  } catch (error) {
    res.status(500).json({ 
      error: error.message || 'Error creating vacancy' 
    });
  }
});

// Updated Post Endpoint (handles both images and videos)
app.post('/api/posts', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Process image
    const imageUrl = req.files?.image?.[0] 
      ? (await handleCloudinaryUpload(req.files.image[0], 'posts/images')) 
      : null;
    
    // Process video
    const videoUrl = req.files?.video?.[0] 
      ? (await handleCloudinaryUpload(req.files.video[0], 'posts/videos')) 
      : null;

    const newPost = new Post({ 
      title, 
      content, 
      image: imageUrl, 
      video: videoUrl 
    });

    await newPost.save();
    res.status(201).json({ 
      message: 'Post created successfully!', 
      post: newPost 
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message || 'Error creating post' 
    });
  }
});

// Updated Header Endpoint
app.put('/api/content/header', upload.single('image'), async (req, res) => {
  try {
    const { title } = req.body;
    
    const imageUrl = req.file 
      ? (await handleCloudinaryUpload(req.file, 'headers')) 
      : null;

    const update = {
      'header.title': title,
      ...(imageUrl && { 'header.image': imageUrl })
    };

    const content = await HomeContent.findOneAndUpdate(
      {},
      update,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: content.header
    });
  } catch (error) {
    console.error('Error updating header:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update header' 
    });
  }
});

// ... [keep all your other routes unchanged] ...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});
// Make sure you have this exact route in server.js
app.post('/admin/login', async (req, res) => {
  console.log('🔹 Admin login attempt received');
  
  try {
    // 1) Validate input
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // 2) Find user with explicit password selection
    const user = await User.findOne({ email: email.trim() }).select('+password');
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 3) Verify password
    const isMatch = await user.correctPassword(password.trim());
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 4) Verify admin role
    if (user.role !== 'admin') {
      console.log(`❌ Non-admin login attempt: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // 5) Successful login
    console.log(`✅ Admin login successful: ${email}`);
    res.status(200).json({
      success: true,
      token: 'your-jwt-token', // Implement JWT here
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ ADMIN LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
});
app.get('/admin/healthcheck', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({
      status: 'OK',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      adminUsersExist: adminCount > 0,
      bcryptWorking: await bcrypt.compare('test', await bcrypt.hash('test', 10))
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});
// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});