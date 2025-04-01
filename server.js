require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const multer = require('multer');

// Initialize Firebase using environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
const bucket = admin.storage().bucket();

// Initialize Express
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://my-website-backend-ixzh.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Models
const HomeContent = require('./models/HomeContent');
const User = require('./models/User');
const Service = require('./models/Service');
const Footer = require("./models/Footer");
const Post = require('./models/Post');
const Scholarship = require("./models/Scholarship");
const Header = require("./models/Header");
const Message = require('./models/Message');
const Vacancy = require('./models/Vacancy');
const ScholarHeader = require('./models/ScholarHeader');

// Firebase Upload Helper
async function uploadToFirebase(file, folder = '') {
  if (!file) return null;
  
  const fileName = folder ? `${folder}/${Date.now()}-${file.originalname}` : `${Date.now()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: { contentType: file.mimetype }
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      await fileUpload.makePublic();
      resolve(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
    });
    stream.end(file.buffer);
  });
}
// ==================== API ROUTES ====================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Authentication
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await newUser.save();
    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    res.status(200).json({ 
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Content Management
app.get('/api/home-content', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content || { message: 'Content not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch content', error: error.message });
  }
});

app.post('/api/content', upload.single('image'), async (req, res) => {
  try {
    const { section, title, description, footerText } = req.body;
    const imageUrl = await uploadToFirebase(req.file, section);

    const updateData = {};
    if (section === "header") {
      updateData["header"] = {
        title: title || "Default Header Title",
        content: description || "",
        image: imageUrl || ""
      };
    } else if (section === "footer") {
      updateData["footer"] = { footerText: footerText || "© 2025 FutureTechTalent. All Rights Reserved." };
    } else if (section === "services") {
      updateData["$push"] = { services: { title, description, image: imageUrl || "" } };
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
    res.status(500).json({ message: 'Failed to update content', error: error.message });
  }
});

// Header/Footer
app.get('/api/header', async (req, res) => {
  try {
    const header = await Header.findOne();
    res.json(header || { title: "Welcome to Our Site", image: "" });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch header', error: error.message });
  }
});

app.put('/api/header', upload.single('image'), async (req, res) => {
  try {
    const { headerText } = req.body;
    const imageUrl = await uploadToFirebase(req.file, 'headers');

    const update = { headerText };
    if (imageUrl) update.image = imageUrl;

    const header = await Header.findOneAndUpdate(
      {},
      update,
      { new: true, upsert: true }
    );
    res.json(header);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update header', error: error.message });
  }
});

app.get('/api/content/footer', async (req, res) => {
  try {
    const footer = await Footer.findOne();
    res.json({ footerText: footer ? footer.content : "© 2025 FutureTechTalent. All Rights Reserved." });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch footer', error: error.message });
  }
});

app.put('/api/content/footer', async (req, res) => {
  try {
    const footerText = req.body["footer-text"];
    if (!footerText) return res.status(400).json({ error: "Footer text is required" });

    const footer = await Footer.findOneAndUpdate(
      {},
      { footerText },
      { new: true, upsert: true }
    );
    res.json(footer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update footer', error: error.message });
  }
});

// Services
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
});

app.post('/api/services', upload.fields([{ name: "service-image" }, { name: "service-video" }]), async (req, res) => {
  try {
    const { "service-title": title, "service-description": description } = req.body;
    
    const [imageUrl, videoUrl] = await Promise.all([
      uploadToFirebase(req.files["service-image"]?.[0], "services/images"),
      uploadToFirebase(req.files["service-video"]?.[0], "services/videos")
    ]);

    const newService = new Service({ 
      title, 
      description, 
      image: imageUrl || "", 
      video: videoUrl || "" 
    });
    
    await newService.save();
    res.json({ message: "Service added successfully!", service: newService });
  } catch (error) {
    res.status(500).json({ message: "Error saving service", error: error.message });
  }
});

// Blog Posts
app.get('/api/posts', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const posts = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } }
      ]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

app.post('/api/posts', upload.fields([{ name: 'image' }, { name: 'video' }]), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const [imageUrl, videoUrl] = await Promise.all([
      uploadToFirebase(req.files['image']?.[0], "posts/images"),
      uploadToFirebase(req.files['video']?.[0], "posts/videos")
    ]);

    const newPost = new Post({ 
      title, 
      content, 
      image: imageUrl || null, 
      video: videoUrl || null 
    });
    
    await newPost.save();
    res.status(201).json({ message: 'Post created successfully!', post: newPost });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// Vacancies
app.get('/api/vacancies', async (req, res) => {
  try {
    const vacancies = await Vacancy.find();
    res.json(vacancies);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vacancies', details: error.message });
  }
});

app.post('/api/vacancies', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imageUrl = await uploadToFirebase(req.file, 'vacancies');

    const newVacancy = new Vacancy({ 
      title, 
      description, 
      imageUrl: imageUrl || null 
    });

    await newVacancy.save();
    res.status(201).json(newVacancy);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vacancy', details: error.message });
  }
});

// Scholarships
app.get('/api/scholarships', async (req, res) => {
  try {
    const scholarships = await Scholarship.find();
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/scholarships', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imageUrl = await uploadToFirebase(req.file, 'scholarships');

    const newScholarship = new Scholarship({ 
      title, 
      description, 
      image: imageUrl || null 
    });

    await newScholarship.save();
    res.status(201).json(newScholarship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Scholar Header/Footer
app.get("/api/scholar-header", async (req, res) => {
  try {
    const data = await ScholarHeader.findOne({});
    res.json(data || { header: "" });
  } catch (error) {
    res.status(500).json({ error: "Error fetching scholar header", details: error.message });
  }
});

app.post("/api/scholar-header", async (req, res) => {
  try {
    const { header } = req.body;
    let data = await ScholarHeader.findOne({});
    
    if (data) {
      data.header = header || data.header;
      await data.save();
    } else {
      data = new ScholarHeader({ header });
      await data.save();
    }
    
    res.json({ message: "Scholar Header updated successfully", data });
  } catch (error) {
    res.status(500).json({ error: "Error saving scholar header", details: error.message });
  }
});

// Chatbot Messages
app.post('/api/messages', async (req, res) => {
  try {
    const { sender, content } = req.body;
    const newMessage = new Message({ sender, content });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save message', error: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(50);
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Admin Dashboard
app.get('/admin_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin', 'admin_dashboard.html'));
});

// Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start Server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Create initial admin user
async function createAdminUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

createAdminUser();