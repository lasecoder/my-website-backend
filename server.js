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
// Create upload directories
const uploadDir = 'uploads';
const imageDir = `${uploadDir}/images`;
const videoDir = `${uploadDir}/videos`;

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir);

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
app.use('/uploads', express.static('uploads'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ==================== API ROUTES ====================
// ✅ Define User model, check if already exists in mongoose
let User;
try {
  User = mongoose.model('User');
} catch (error) {
  User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String
  }));
}

// ✅ Signup Route
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send('Email already registered');
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Simple test route - add this temporarily
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
app.put('/api/header', async (req, res) => {
  const { headerText } = req.body;

  if (!headerText) {
    return res.status(400).json({ message: "Header text is required" });
  }

  try {
    let header = await Header.findOne();
    if (!header) {
      header = new Header({ headerText });
    } else {
      header.headerText = headerText;
    }
    await header.save();
    res.status(200).json({ message: "Header updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating header text", error: error.message });
  }
});
app.get('/api/content/header', async (req, res) => {
  try {
    // Try to get header from database
    const header = await Header.findOne();
    
    // If no header exists, create a default one
    if (!header) {
      return res.json({
        title: "Welcome to Our Site",
        image: "/uploads/default-logo.png"
      });
    }
    
    // Return the found header
    res.json({
      title: header.title,
      image: header.logoUrl || "/uploads/default-logo.png"
    });
    
  } catch (error) {
    console.error('Header endpoint error:', error);
    // Always return JSON, even in error cases
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});
// Footer endpoints
app.get('/api/content/footer', async (req, res) => {
  try {
    const footer = await Footer.findOne();
    res.json({ footerText: footer ? footer.content : "© 2025 FutureTechTalent. All Rights Reserved." });
  } catch (error) {
    console.error('Error fetching footer:', error);
    res.status(500).json({ message: 'Failed to fetch footer' });
  }
});

app.put('/api/content/footer', async (req, res) => {
  if (!req.body["footer-text"]) {
    return res.status(400).json({ error: "Footer text is required" });
  }

  try {
    let footer = await Footer.findOne();
    if (!footer) {
      footer = new Footer({ footerText: req.body["footer-text"] });
    } else {
      footer.footerText = req.body["footer-text"];
    }
    await footer.save();
    res.status(200).json({ message: "Footer updated successfully" });
  } catch (error) {
    console.error("Error updating footer:", error);
    res.status(500).json({ error: "Failed to update footer", details: error.message });
  }
});

// Services endpoints
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

app.post('/api/services', upload.fields([{ name: "service-image" }, { name: "service-video" }]), async (req, res) => {
  try {
    const { "service-title": title, "service-description": description } = req.body;
    const imagePath = req.files["service-image"] ? `uploads/images/${req.files["service-image"][0].filename}` : "";
    const videoPath = req.files["service-video"] ? `uploads/videos/${req.files["service-video"][0].filename}` : "";

    const newService = new Service({ title, description, image: imagePath, video: videoPath });
    await newService.save();
    res.json({ message: "Service added successfully!", service: newService });
  } catch (error) {
    console.error("Error saving service:", error);
    res.status(500).json({ message: "Error saving service", error: error.message });
  }
});

// Content management
app.post('/api/content', upload.single('image'), async (req, res) => {
  try {
    const { section, title, description, footerText } = req.body;
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

    const updateData = {};

    if (section === "header") {
      updateData["header"] = {
        title: title || "Default Header Title",
        content: description || "",
        image: imagePath || "No image"
      };
    } else if (section === "footer") {
      updateData["footer"] = { footerText: footerText || "© 2025 FutureTechTalent. All Rights Reserved." };
    } else if (section === "services") {
      updateData["$push"] = { services: { title, description, image: imagePath || "No image" } };
    } else {
      return res.status(400).json({ message: "Invalid section specified." });
    }

    const updatedContent = await HomeContent.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );

    res.status(200).json({ message: `${section} updated successfully!`, data: updatedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Failed to update content' });
  }
});

// Blog endpoints
app.get('/api/posts', async (req, res) => {
  const searchQuery = req.query.search || '';
  
  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } }
      ]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error });
  }
});

app.post('/api/posts', upload.fields([{ name: 'image' }, { name: 'video' }]), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.files['image'] ? req.files['image'][0].filename : null;
    const video = req.files['video'] ? req.files['video'][0].filename : null;
    const newPost = new Post({ title, content, image, video });
    await newPost.save();
    res.status(201).json({ message: 'Post created successfully!', post: newPost });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error });
  }
});

// Vacancy endpoints
app.get('/api/vacancies', async (req, res) => {
  try {
    const vacancies = await Vacancy.find();
    res.json(vacancies);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vacancies' });
  }
});

app.post('/api/vacancies', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const newVacancy = new Vacancy({ title, description, imageUrl });
    await newVacancy.save();
    res.status(201).json(newVacancy);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vacancy' });
  }
});

// Scholarship endpoints
app.get('/api/scholarships', async (req, res) => {
  try {
    const scholarships = await Scholarship.find();
    res.json(scholarships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/scholarships', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const newScholarship = new Scholarship({ title, description, image });
    const savedScholarship = await newScholarship.save();
    res.status(201).json(savedScholarship);
  } catch (err) {
    console.error("Error creating scholarship:", err);
    res.status(400).json({ message: err.message });
  }
});

// Scholar header/footer endpoints
app.get("/api/scholar-header", async (req, res) => {
  try {
    const data = await ScholarHeader.findOne({});
    res.json(data || { header: "" });
  } catch (error) {
    res.status(500).json({ error: "Error fetching scholar header" });
  }
});

app.post("/api/scholar-header", async (req, res) => {
  const { header } = req.body;
  try {
    let data = await ScholarHeader.findOne({});
    if (data) {
      data.header = header || data.header;
      await data.save();
    } else {
      data = new ScholarHeader({ header });
      await data.save();
    }
    res.json({ message: "Scholar Header updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving scholar header" });
  }
});

// Authentication endpoints
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.status(200).json({ success: true, message: 'Login successful', user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.status(200).json({ success: true, message: 'Admin login successful', user });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Admin dashboard
app.get('/admin_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin', 'admin_dashboard.html'));
});

// Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});