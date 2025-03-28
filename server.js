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
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory');
}

// Add default image if missing
const defaultImagePath = path.join(uploadDir, 'default-logo.png');
if (!fs.existsSync(defaultImagePath)) {
  fs.writeFileSync(defaultImagePath, fs.readFileSync(path.join(__dirname, 'public', 'default-logo.png')));
  console.log('Created default image');
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
// Replace existing static file middleware with this:
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  fallthrough: false // Strictly handle only /uploads
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use the absolute path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
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
// Serve static files from 'uploads'
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));
app.use('/api/*', (req, res, next) => {
  if (req.method === 'GET' && req.query.image) {
    const filePath = path.join(uploadDir, req.query.image);
    if (!fs.existsSync(filePath)) {
      console.warn('Missing image:', filePath);
    }
  }
  next();
});

// Add this ABOVE your catch-all route
app.get('/uploads/:filename', (req, res) => {
  const file = path.join(__dirname, 'uploads', req.params.filename);
  
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send('Image not found');
  }
});
app.get('/fix-images', async (req, res) => {
  // 1. Delete all existing content
  await HomeContent.deleteMany({});
  
  // 2. Create fresh entry with test image
  await HomeContent.create({
    header: {
      title: "TEST TITLE",
      image: "/uploads/default-logo.png" // MUST exist in uploads/
    }
  });
  
  res.send("Database reset with test image");
});

// Add this route to test file access
app.get('/debug-file', (req, res) => {
  const testFile = path.join(__dirname, 'uploads', 'default-logo.png');
  
  if (fs.existsSync(testFile)) {
    res.send(`File exists at: ${testFile}`);
  } else {
    res.status(404).send(`File NOT FOUND at: ${testFile}`);
  }
});
// ==================== API ROUTES ====================
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded!" });
  }
  console.log("File saved at:", req.file.path); // Check the saved path
  res.json({ path: `/uploads/${req.file.filename}` });
});
// ✅ API: Update Home Content (Header, Services, Footer)
// Modify your upload endpoint:
app.post('/api/content', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file 
      ? `/uploads/${req.file.filename}`  // Absolute path
      : "/uploads/default-logo.png";

    const updateData = {
      header: {
        title: req.body.title || "Default Title",
        image: imagePath,
        content: req.body.description || ""
      }
    };

    const result = await HomeContent.findOneAndUpdate(
      {},
      updateData,
      { upsert: true, new: true }
    );
    
    res.status(200).json({ 
      message: "Content updated successfully!",
      data: result
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: "Update failed" });
  }
});
// Add this before your routes
app.use('/api/content', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});
// ✅ API: Fetch Home Content (Header, Services, Footer)
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

// ✅ API: Fetch Header Content
app.get('/api/content/header', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content?.header || { title: "Default Title", image: "default-logo.png" });
  } catch (error) {
    console.error('❌ Error fetching header:', error);
    res.status(500).json({ message: 'Failed to fetch header' });
  }
});

// ✅ API: Fetch Services
app.get('/api/services', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content?.services || []);
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// API to store a chat message
app.post('/api/chat', async (req, res) => {
  const { userMessage, sender } = req.body;

  // Check if both userMessage and sender are provided
  if (!userMessage || !sender) {
      return res.status(400).json({ error: 'Message and sender are required' });
  }

  try {
      // Create a new message document and save it
      const message = new Message({ userMessage, sender });
      await message.save();  // Save the message to MongoDB

      res.status(200).json({ message: 'Message saved successfully' });
  } catch (error) {
      console.error("❌ Error saving message:", error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ✅ API: Fetch Footer
app.get('/api/content/footer', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content?.footer || { content: "© 2025 FutureTechTalent. All Rights Reserved." });
  } catch (error) {
    console.error('❌ Error fetching footer:', error);
    res.status(500).json({ message: 'Failed to fetch footer' });
  }
});

// ✅ API: Fetch Home Content (alternative to /api/content)
app.get('/api/home-content', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({ 
        header: { 
          title: "Default Title", 
          content: "", 
          image: "/uploads/default-logo.png" 
        },
        services: [],
        footer: { footerText: "© 2025 FutureTechTalent. All Rights Reserved." }
      });
    }

    // Verify image exists
    const headerImage = content.header?.image || "/uploads/default-logo.png";
    const imageExists = fs.existsSync(path.join(__dirname, headerImage));

    res.json({
      header: {
        ...content.header,
        image: imageExists ? headerImage : "/uploads/default-logo.png"
      },
      services: content.services || [],
      footer: content.footer || { footerText: "© 2025 FutureTechTalent. All Rights Reserved." }
    });
    
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      details: error.message 
    });
  }
});
// ==================== Blog ====================
// Create Post (with Image and Video Upload Support)
app.post("/api/posts", upload.fields([{ name: "image" }, { name: "video" }]), async (req, res) => {
  try {
      const { title, content } = req.body;
      const image = req.files["image"] ? req.files["image"][0].filename : null;
      const video = req.files["video"] ? req.files["video"][0].filename : null;
      const newPost = new Post({ title, content, image, video });
      await newPost.save();
      res.status(201).json({ message: "Post created successfully!", post: newPost });
  } catch (error) {
      res.status(500).json({ message: "Error creating post", error });
  }
});

// Get All Posts
app.get("/api/posts", async (req, res) => {
  try {
      const posts = await Post.find();
      res.json(posts);
  } catch (error) {
      res.status(500).json({ message: "Error fetching posts", error });
  }
});

// Update Post
app.put("/api/posts/:id", async (req, res) => {
  try {
      const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ message: "Post updated successfully!", post: updatedPost });
  } catch (error) {
      res.status(500).json({ message: "Error updating post", error });
  }
});

// Delete Post
app.delete("/api/posts/:id", async (req, res) => {
  try {
      await Post.findByIdAndDelete(req.params.id);
      res.json({ message: "Post deleted successfully!" });
  } catch (error) {
      res.status(500).json({ message: "Error deleting post", error });
  }
});
// Endpoint to get posts with search functionality
app.get("/api/posts", async (req, res) => {
  const searchQuery = req.query.search || ''; // Get the search query from the URL

  // Find posts that match the search query in either title or content
  const posts = await Post.find({
      $or: [
          { title: { $regex: searchQuery, $options: 'i' } },  // Case-insensitive search on title
          { content: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search on content
      ]
  });

  res.json(posts);  // Send the filtered posts as a response
});
// ------------------------
// Route to update Services Header
// ------------------------
app.put("/api/content/services-header", upload.single('services-header-image'), async (req, res) => {
  console.log("Updating Services Header:", req.body);  // Log incoming request

  // Validate 'services-header-title' exists
  if (!req.body["services-header-title"]) {
    return res.status(400).json({ error: "services-header-title is required" });
  }

  try {
    const headerImage = req.file ? req.file.path : "";  // Set image path if file exists

    const servicesHeader = new ServicesHeader({
      servicesHeaderTitle: req.body["services-header-title"],
      servicesHeaderImage: headerImage
    });

    await servicesHeader.save();
    console.log("Services Header updated:", servicesHeader);

    res.status(200).json({ message: "Services header updated successfully" });
  } catch (error) {
    console.error("Error updating services header:", error);
    res.status(500).json({ error: "Failed to update services header", details: error.message });
  }
});

// ------------------------
// Route to update Default Services Content
// ------------------------
app.put('/api/content/services', upload.single('default-services-image'), async (req, res) => {
  console.log('Updating Default Services Content:', req.body);  // Log incoming request

  // Validate that required data exists
  if (!req.body["default-services-title"] || !req.body["default-services-content"]) {
    return res.status(400).json({ error: "Both 'default-services-title' and 'default-services-content' are required" });
  }

  try {
    const defaultImage = req.file ? req.file.path : "";

    const defaultServicesContent = new DefaultServicesContent({
      title: req.body["default-services-title"],
      content: req.body["default-services-content"],
      image: defaultImage
    });

    await defaultServicesContent.save();
    console.log('Default Services Content updated:', defaultServicesContent);

    res.status(200).json({ message: 'Default services content updated successfully' });
  } catch (error) {
    console.error("Error updating default services content:", error);
    res.status(500).json({ error: "Failed to update default services content", details: error.message });
  }
});

// ------------------------
// Route to update Service 1
// ------------------------
app.put('/api/services/1', upload.single('service-img-1'), async (req, res) => {
  console.log('Updating Service 1:', req.body);  // Log incoming request

  if (!req.body["service-title-1"] || !req.body["service-description-1"]) {
    return res.status(400).json({ error: "Both 'service-title-1' and 'service-description-1' are required" });
  }

  try {
    const serviceImage1 = req.file ? req.file.path : "";

    const service1Data = new Service1({
      title: req.body["service-title-1"],
      description: req.body["service-description-1"],
      image: serviceImage1
    });

    await service1Data.save();
    console.log('Service 1 updated:', service1Data);

    res.status(200).json({ message: 'Service 1 updated successfully' });
  } catch (error) {
    console.error("Error updating service 1:", error);
    res.status(500).json({ error: "Failed to update service 1", details: error.message });
  }
});

// ------------------------
// Route to update Service 2
// ------------------------
app.put('/api/services/2', upload.single('service-img-2'), async (req, res) => {
  console.log('Updating Service 2:', req.body);  // Log incoming request
  
  // Validate required fields: title and description
  if (!req.body["service-title-2"] || !req.body["service-description-2"]) {
    return res.status(400).json({ error: "Both 'service-title-2' and 'service-description-2' are required" });
  }

  try {
    // Get the image path if file is uploaded
    const serviceImage2 = req.file ? req.file.path : "";

    // Handle the optional link field: if it's not provided, set it to null or an empty string
    const serviceLink2 = req.body["service-link-2"] || "";  // Default to empty string if not provided

    // Create data object for service 2
    const service2Data = {
      title: req.body["service-title-2"],
      description: req.body["service-description-2"],
      image: serviceImage2,
      link: serviceLink2  // Add the optional field to the data
    };

    // Example: Replace with your model logic to save the data to the database
    // await Service2Model.create(service2Data);

    console.log('Service 2 updated:', service2Data);

    res.status(200).json({ message: 'Service 2 updated successfully' });
  } catch (error) {
    console.error("Error updating service 2:", error);
    res.status(500).json({ error: "Failed to update service 2", details: error.message });
  }
});

// ------------------------
// Route to update Footer
// ------------------------
app.put('/api/content/footer', async (req, res) => {
  console.log('Updating Footer:', req.body);

  if (!req.body["footer-text"]) {
    return res.status(400).json({ error: "Footer text is required" });
  }

  try {
    const footerData = new Footer({
      footerText: req.body["footer-text"]
    });

    await footerData.save();
    console.log('Footer updated:', footerData);

    res.status(200).json({ message: 'Footer updated successfully' });
  } catch (error) {
    console.error("Error updating footer:", error);
    res.status(500).json({ error: "Failed to update footer", details: error.message });
  }
});

// 🎯 VACANCY ROUTES
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

app.delete('/api/vacancies/:id', async (req, res) => {
  try {
      await Vacancy.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Vacancy deleted successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Error deleting vacancy' });
  }
});

// 🎯 SCHOLARSHIP ROUTES
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
      console.error("❌ Error creating scholarship:", err);
      res.status(400).json({ message: err.message });
  }
});

app.put('/api/scholarships/:id', upload.single('image'), async (req, res) => {
  try {
      const scholarship = await Scholarship.findById(req.params.id);
      if (!scholarship) return res.status(404).json({ message: "Scholarship not found" });

      scholarship.title = req.body.title || scholarship.title;
      scholarship.description = req.body.description || scholarship.description;

      if (req.file) {
          if (scholarship.image) fs.unlinkSync("." + scholarship.image);
          scholarship.image = "/uploads/" + req.file.filename;
      }

      const updatedScholarship = await scholarship.save();
      res.json(updatedScholarship);
  } catch (err) {
      console.error("❌ Error updating scholarship:", err);
      res.status(400).json({ message: err.message });
  }
});

app.delete('/api/scholarships/:id', async (req, res) => {
  try {
      const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
      if (!scholarship) return res.status(404).json({ message: "Scholarship not found" });
      if (scholarship.image) fs.unlinkSync("." + scholarship.image);
      res.json({ message: 'Scholarship deleted' });
  } catch (err) {
      console.error("❌ Error deleting scholarship:", err);
      res.status(400).json({ message: err.message });
  }
});

// 🎯 HEADER ROUTES
app.get("/api/header", async (req, res) => {
  try {
      let header = await Header.findOne();
      if (!header) {
          header = new Header();
          await header.save();
      }
      res.json(header);
  } catch (error) {
      console.error("❌ Error fetching header:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/header", upload.single("logo"), async (req, res) => {
  try {
      let header = await Header.findOne() || new Header();
      if (req.body.title) header.title = req.body.title;
      if (req.file) {
          if (header.logoUrl !== "/uploads/default-logo.png") fs.unlinkSync("." + header.logoUrl);
          header.logoUrl = "/uploads/" + req.file.filename;
      }
      await header.save();
      res.json({ message: "✅ Header updated successfully", header });
  } catch (error) {
      console.error("❌ Error updating header:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🎯 FOOTER ROUTES
app.get('/api/footer', async (req, res) => {
  try {
      const footer = await Footer.findOne().sort({ _id: -1 });
      res.json({ footerContent: footer ? footer.content : "Default footer content" });
  } catch (error) {
      res.status(500).json({ error: 'Error fetching footer content' });
  }
});

app.post('/api/footer', async (req, res) => {
  try {
      const { footerContent } = req.body;
      await Footer.deleteMany({});
      const newFooter = new Footer({ content: footerContent });
      await newFooter.save();
      res.json({ message: "Footer updated successfully!" });
  } catch (error) {
      res.status(500).json({ error: 'Error saving footer content' });
  }
});
// API routes

// Get header and footer content

// API Routes for Scholar Header and Footer
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

app.get("/api/scholar-footer", async (req, res) => {
  try {
    const data = await ScholarFooter.findOne({});
    res.json(data || { footer: "" });
  } catch (error) {
    res.status(500).json({ error: "Error fetching scholar footer" });
  }
});

app.post("/api/scholar-footer", async (req, res) => {
  const { footer } = req.body;
  try {
    let data = await ScholarFooter.findOne({});
    if (data) {
      data.footer = footer || data.footer;
      await data.save();
    } else {
      data = new ScholarFooter({ footer });
      await data.save();
    }
    res.json({ message: "Scholar Footer updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving scholar footer" });
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
  if (!req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
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