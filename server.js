require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');

// Initialize Firebase with proper error handling
try {
  const firebaseConfig = {
    type: "service_account",
    project_id: "future-tech-254c0",
    private_key_id: "9df3b405a281639bc122a696720964eb25a6deda",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkEB0w/yX18QOb\nQMiUzj28LKYF1ihCXigaG8s2uLVlzJWMKFa9BLUVb3vGolNHTMK/bGe4I4S/vo78\npfHQFOtSfCk3dgqckSgoG0BMawexTz7/fwJfBlnqapOHrS8ragfcJEfmxUvghw+9\nKcZ3YZtjd4FPGt/gcEn5pjSPPIKPYUOvcWYS3nnqI+WHPPx3Gf4ZQXuC9EMO0+0v\nojEsYs90EJBe7w13tD2eVe+k0M/W/6XL7rldSNhnmwRptMfsvO7ZSDZQVxzpxlAv\nCcZdaNRnY0+lWK7spEmST+nGB8861+YhANgI36WgKxICzC25t/5o+5vz6PG2Zhcq\ncg8Hgiw1AgMBAAECggEAI7aGRDYmU0UlndQaVZoXgjDN6xNVLC1G2XgXYlAO3JwO\nKbZWO0sdCA9+iBypuCmTcwvr//9rVDns8j5FRyBmoUv5xOLjKHXIogJcmsXppMU1\nV3SUVY8SX57Xgn9Gd1LbZyZWqHtmKvf7ixfe5fnPU3WeJlQZS8flsnxlkJCBcyhF\n0ry+bpii/xAVKNg+b42TjzYmSJbJ+sTAzrivMvzTsJB7xt7D6AOP3T6c1lpZ8yMQ\naZdPzxIJ2A9AxEnw+i8cOsNCvRGkpvZnP1FykkvdhxXKNNa2F6UnkZQPZ8kMuMkc\nbnOx1kMx835D1mX4Y/G+pCHb5WG5krcUnfa77fBNwQKBgQDPez6hFVoFlqOPPLt0\nrGm4QUz38Qrm0f3ySBoWxww+QWUyuMyZYtExQbdcup1ogUVeIs6XDldFf39QAl45\naokicy0MDReNFgO/LaCtYuUH1JRLfmD+yUXYHQrleYo4c+zoW/xFUD1dFIMo+4DJ\nik7lLxTGE1FF5KRiNClxFQbJiQKBgQDKbaWz4gHAhmjA8CWYKTirQNRdsXmgQZiU\nqiJAA5MZxLyWL8LdnmOkhNfQ81TPtfcVuf+g/dYHua7x0aFT5hTRf1h5LYc8+7jW\nK2y5cfu1jR1N0neU5EC0c1/F0WGfNsnhGgmzPOd5fIrjPQZKM+TxWuk9UxY8hJ5L\nwEgUny2eTQKBgF1445VEfkLoQ5VjQfxlNFerK5bEBCpKzoJZU0+RqwVdBs9cC+jK\naP4s4gOnmwSawHqRacsJze1kbCHKf1KUmWVoyBGW0FZiZZu6XZnfZNkrPwfnzqDa\nYlnjc6ZAJDIcn81qq3M6m/qUJCbRb4rcgYCkvlIiH8pCIICRiV4FoAIpAoGAF0Lw\nVrJy9xe68+jkuQ6Ll4pUnQum6VaAXR0L4IVIox5reWq1ntfzpVUqo7VCmrfTU+jS\nykJBFRQuWVV4j3aSD9ztYsdrkgNvIxVMYicKALvdkTLNUQvFr7bOW6IK8MvP+REP\n6kvmYZyBLUm27lH2ThHfWY+xr3Sh6ByJa+06xcUCgYAgntz/4mN2HVFblkuCeMcA\nhLVPsEvpu1S+dwbI59gB9eKmp8bCVTCS6uTfLXZzStKCXyhGYO0LPaCr1N2vZQ2U\nlzoNLXzMl3Oy0otP9hr4dGudvyC2K005fJ/2ixNQEfj5oKNoQSW5SkBhvcHOjNxs\nsq/LD4lkpu5vIlOQyywN1w==\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@future-tech-254c0.iam.gserviceaccount.com",
    client_id: "107834567041766180705",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40future-tech-254c0.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  }
  

  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  process.exit(1);
}

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
const Logo = require('./models/Logo');
const Service1 = require('./models/Service1');
const DefaultServicesContent = require('./models/DefaultServicesContent');

// Firebase Upload Helper with enhanced error handling
async function uploadToFirebase(file, folder = '') {
  if (!file) return null;
  
  try {
    const fileName = folder ? `${folder}/${Date.now()}-${file.originalname}` : `${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype }
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        console.error('Firebase upload error:', err);
        reject(new Error('File upload failed'));
      });
      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          resolve(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
        } catch (err) {
          console.error('Error making file public:', err);
          reject(new Error('Failed to make file public'));
        }
      });
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error in uploadToFirebase:', error);
    throw error;
  }
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

// Authentication Routes
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

// Content Management Routes
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
    const imageUrl = req.file ? await uploadToFirebase(req.file, section) : null;

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

// Header/Footer Routes
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
    const imageUrl = req.file ? await uploadToFirebase(req.file, 'headers') : null;

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

// Services Routes
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
      req.files["service-image"] ? uploadToFirebase(req.files["service-image"][0], "services/images") : Promise.resolve(""),
      req.files["service-video"] ? uploadToFirebase(req.files["service-video"][0], "services/videos") : Promise.resolve("")
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

// Blog Posts Routes
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
      req.files['image'] ? uploadToFirebase(req.files['image'][0], "posts/images") : Promise.resolve(null),
      req.files['video'] ? uploadToFirebase(req.files['video'][0], "posts/videos") : Promise.resolve(null)
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

// Vacancies Routes
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
    const imageUrl = req.file ? await uploadToFirebase(req.file, 'vacancies') : null;

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

// Scholarships Routes
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
    const imageUrl = req.file ? await uploadToFirebase(req.file, 'scholarships') : null;

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

// Scholar Header/Footer Routes
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

// Chatbot Messages Routes
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

// Admin Dashboard Route
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
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

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