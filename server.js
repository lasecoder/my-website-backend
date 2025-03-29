const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
// Models
const HomeContent = require('./models/HomeContent');
const User = require('./models/User');
const Service1 = require('./models/Service1');
const Service = require('./models/Service');
const DefaultServicesContent = require('./models/DefaultServicesContent');
const Footer = require("./models/Footer");
const Post = require('./models/Post');
const Scholarship = require("./models/Scholarship");
const Header = require("./models/Header");
const Logo = require('./models/Logo');
const Message = require('./models/Message');
const Vacancy = require('./models/Vacancy');

// Create upload directories with proper permissions
const uploadDir = path.join(__dirname, 'uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.chmodSync(uploadDir, 0o755);
}
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
  fs.chmodSync(imageDir, 0o755);
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
  fs.chmodSync(videoDir, 0o755);
}

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MongoDB URI is undefined. Check your .env file.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

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

// Modified static file serving to ensure permissions
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  if (fs.existsSync(filePath)) {
    try {
      fs.chmodSync(filePath, 0o644); // Ensure files are readable
    } catch (err) {
      console.error('Error setting file permissions:', err);
    }
  }
  express.static(uploadDir)(req, res, next);
});

// Multer setup for file uploads with improved path handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadDir;
    if (file.fieldname.includes('image')) dest = imageDir;
    if (file.fieldname.includes('video')) dest = videoDir;
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
      fs.chmodSync(dest, 0o755);
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ==================== API ROUTES ====================
// (ALL YOUR EXISTING ROUTES REMAIN EXACTLY THE SAME)
// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working", timestamp: new Date() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Header endpoints
app.get('/api/header', async (req, res) => {
  try {
    const header = await Header.findOne();
    if (!header) {
      return res.status(404).json({ message: 'Header not found' });
    }
    res.json(header);
  } catch (error) {
    console.error('Error fetching header:', error);
    res.status(500).json({ message: 'Failed to fetch header' });
  }
});

// Update these routes in your server.js
// Get complete home content
app.get('/api/home-content', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    console.error('Error fetching home content:', error);
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});

// Update header content
app.put('/api/content/header', upload.single('image'), async (req, res) => {
  try {
    const { title } = req.body;
    const image = req.file ? req.file.path : null;

    const update = {
      'header.title': title,
      ...(image && { 'header.image': image })
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
    res.status(500).json({ error: 'Failed to update header' });
  }
});

// ... (CONTINUE WITH ALL YOUR OTHER EXISTING ROUTES EXACTLY AS THEY WERE)
// Footer endpoints, Services endpoints, Content management, Blog endpoints, etc.
// ALL ROUTES REMAIN UNCHANGED FROM YOUR ORIGINAL CODE

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Admin user creation
async function createAdminUser() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const adminName = 'Admin User';

  try {
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created:', adminEmail);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();

// Chat endpoints
app.post('/api/messages', async (req, res) => {
  try {
    const { sender, content } = req.body;
    const newMessage = new Message({ sender, content });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Failed to save message' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(50);
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});