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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage });

// Models
const HomeContent = require('./models/HomeContent');
const Message = require('./models/message');
const User = require('./models/User');
const Service1 = require('./models/Service1');
const DefaultServicesContent = require('./models/DefaultServicesContent');
const Footer = require('./models/Footer');
const Post = require('./models/Post');
const Vacancy = require('./models/Vacancy');
const Scholarship = require('./models/Scholarship');
const Header = require('./models/Header'); // Ensure this path is correct

// ------------------------ Routes ------------------------

// Homepage route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Update Home Content (Header, Services, Footer)
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
    console.error('❌ Error updating content:', error);
    res.status(500).json({ message: 'Failed to update content' });
  }
});

// API: Fetch Home Content
app.get('/api/content', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({ message: 'No content found' });
    }
    res.json(content);
  } catch (error) {
    console.error('❌ Error fetching content:', error);
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});

// API: Fetch Header Content
app.get('/api/content/header', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content?.header || { title: "Default Title", image: "default-logo.png" });
  } catch (error) {
    console.error('❌ Error fetching header:', error);
    res.status(500).json({ message: 'Failed to fetch header' });
  }
});

// API: Fetch Services
app.get('/api/services', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content?.services || []);
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// API: Store Chat Message
app.post('/api/chat', async (req, res) => {
  const { userMessage, sender } = req.body;

  if (!userMessage || !sender) {
    return res.status(400).json({ error: 'Message and sender are required' });
  }

  try {
    const message = new Message({ userMessage, sender });
    await message.save();
    res.status(200).json({ message: 'Message saved successfully' });
  } catch (error) {
    console.error("❌ Error saving message:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Fetch Footer
app.get('/api/content/footer', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content?.footer || { content: "© 2025 FutureTechTalent. All Rights Reserved." });
  } catch (error) {
    console.error('❌ Error fetching footer:', error);
    res.status(500).json({ message: 'Failed to fetch footer' });
  }
});

// ------------------------ Blog Routes --------------------

// Create Blog Post
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

// Get All Blog Posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error });
  }
});

// Multer Configuration for File Uploads
// API Endpoints

// Add new Service (POST)
app.post("/api/services", upload.fields([{ name: "service-image" }, { name: "service-video" }]), async (req, res) => {
  try {
      const { "service-title": title, "service-description": description } = req.body;
      const imagePath = req.files["service-image"] ? `uploads/images/${req.files["service-image"][0].filename}` : "";
      const videoPath = req.files["service-video"] ? `uploads/videos/${req.files["service-video"][0].filename}` : "";

      const newService = new Service({ title, description, image: imagePath, video: videoPath });
      await newService.save();

      res.json({ message: "✅ Service added successfully!", service: newService });
  } catch (error) {
      console.error("❌ Error saving service:", error);
      res.status(500).json({ message: "Error saving service", error: error.message });
  }
});

// Get all Services (GET)
app.get("/api/services", async (req, res) => {
  try {
      const services = await Service.find();
      res.json(services);
  } catch (error) {
      res.status(500).json({ message: "Error fetching services", error });
  }
});

// ------------------------
// Route to update Footer (PUT)
// ------------------------
app.put('/api/content/footer', async (req, res) => {
  console.log("📩 Received request:", req.body);

  if (!req.body["footer-text"]) {
      return res.status(400).json({ error: "⚠️ Footer text is required" });
  }

  try {
      let footer = await Footer.findOne(); // Find existing footer

      if (!footer) {
          footer = new Footer({ footerText: req.body["footer-text"] });
      } else {
          footer.footerText = req.body["footer-text"];
      }

      await footer.save();
      console.log("✅ Footer updated successfully");
      res.status(200).json({ message: "Footer updated successfully" });

  } catch (error) {
      console.error("❌ Error updating footer:", error);
      res.status(500).json({ error: "Failed to update footer", details: error.message });
  }
});

// Route to get the footer (GET)
app.get("/api/content/footer", async (req, res) => {
  try {
      const footer = await Footer.findOne();  // Get the footer document from DB
      if (!footer) {
          return res.status(404).json({ error: "Footer not found" });
      }
      res.json({ footerText: footer.footerText });  // Return the footer text in JSON format
  } catch (error) {
      console.error("Error fetching footer:", error);
      res.status(500).json({ error: "Failed to fetch footer", details: error.message });
  }
});

// ------------------------
// Route to update Header (PUT)
// ------------------------
app.put("/api/header", async (req, res) => {
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

// API endpoint to get header text (GET)
app.get("/api/header", async (req, res) => {
  console.log("GET /api/header request received");  // Add this log
  try {
      const header = await Header.findOne();
      if (!header) {
          return res.status(404).json({ message: "Header text not found" });
      }
      res.json({ headerText: header.headerText });
  } catch (error) {
      res.status(500).json({ message: "Error fetching header text", error: error.message });
  }
});

// ------------------------ Server Initialization ------------------------

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});