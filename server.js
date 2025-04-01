const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
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
  console.log('🔹 Admin login attempt received'); // Log receipt of request
  
  try {
    const { email, password } = req.body;
    console.log('🔹 Login attempt for:', email);

    // 1) Input validation
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide both email and password' 
      });
    }

    // 2) Find user
    const user = await User.findOne({ email }).select('+password');
    console.log(user ? '🔹 User found' : '❌ User not found');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' // Generic message for security
      });
    }

    // 3) Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch ? '🔹 Password matches' : '❌ Password mismatch');
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // 4) Verify admin role
    console.log('🔹 User role:', user.role);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin privileges required' 
      });
    }

    // 5) Successful login
    console.log('✅ Successful admin login');
    res.status(200).json({
      success: true,
      token: 'your-generated-jwt-here', // Implement JWT if needed
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});