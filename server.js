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
const HomeContent = require('./models/HomeContent');
require('dotenv').config();



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
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});
// Initialize Express app

const port = process.env.PORT || 5000;
// 6. MIDDLEWARE (AFTER APP INIT
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/images', express.static(path.join(__dirname, 'images')));
// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Models
const Post = require(path.join(__dirname, 'models', 'Post'));  // Match exact filename
const User = require(path.join(__dirname, 'models', 'User'));
const Header = require(path.join(__dirname, 'models', 'Header'));
const Service = require(path.join(__dirname, 'models', 'Service'));
const Footer = require(path.join(__dirname, 'models', 'Footer'));




// 7. ROUTES (AFTER MIDDLEWARE)
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    const newPost = await Post.create({
      title: req.body.title,
      content: req.body.content,
      image: req.file?.path
    });
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. ERROR HANDLER (AFTER ROUTES)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 7. Define routes AFTER all configurations
app.post('/api/posts', 
  authenticateAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      console.log('Uploaded file:', req.file);
      console.log('Text fields:', req.body);

      const newPost = await Post.create({
        title: req.body.title,
        content: req.body.content,
        image: req.file?.path
      });

      res.status(201).json({ 
        success: true, 
        data: newPost 
      });
    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);
// Route to get home page content
app.get('/api/home-content', async (req, res) => {
  try {
    const homeContent = await HomeContent.findOne(); // Assuming only one document
    if (!homeContent) {
      return res.status(404).json({ success: false, message: "Home content not found" });
    }

    res.json({
      header: {
        title: homeContent.headerTitle,
        image: homeContent.headerImage, // Cloudinary URL
      },
      services: homeContent.services, // Should be an array of service objects
      footer: {
        footerText: homeContent.footerText,
      }
    });
  } catch (err) {
    console.error('Error fetching home content:', err);
    res.status(500).json({ success: false, message: err.message });
  }
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

// Middleware setup
// Configure CORS properly (place this after express initialization but before routes)
app.use(cors({
  origin: [
    'https://my-website-backend-ixzh.onrender.com',
    'http://localhost:3000' // Add your frontend origin
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());
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
        email: 'admin@example.com',
        password: 'admin123',
        passwordConfirm: 'admin123',
        role: 'admin'
      });
      ;
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

// Header routes
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
      message: 'Failed to fetch header'
    });
  }
});

app.put('/api/header', 
  authenticateAdmin,
  upload.single('image'),
  handleUploadErrors,
  async (req, res) => {
    try {
      const updateData = {
        title: req.body.title
      };

      if (req.file) {
        updateData.image = req.file.path;
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
      console.error('Header update error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Service routes
// Ensure these routes exist in your server.js
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Service routes
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id });
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

// Add proper error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  
  // Always return JSON, even for errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});
// In server.js
app.put('/api/services/:id', authenticateAdmin, upload.single('media'), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description
    };

    if (req.file && req.file.path) {
      updateData.mediaUrl = req.file.path; // This is the Cloudinary URL
    }

    const service = await Service.findOneAndUpdate(
      { serviceId: req.params.id },
      updateData,
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, data: service, message: 'Service updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Footer routes
app.get('/api/footer', authenticateAdmin, async (req, res) => {
  try {
    const footer = await Footer.findOne() || { text: '' };
    res.json({
      success: true,
      data: footer
    });
  } catch (error) {
    console.error('Footer fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch footer'
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
    res.json({
      success: true,
      message: 'Footer updated successfully',
      data: footer
    });
  } catch (error) {
    console.error('Footer update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update footer'
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
///////////////////////////////////////////
///========service===================
// Header routes (consolidated)
app.route('/api/header')
  .get(async (req, res) => {
    try {
      const header = await Header.findOne() || { 
        headerText: 'Default Header Text' 
      };
      res.json(header);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .put(authenticateAdmin, async (req, res) => {
    try {
      const { headerText } = req.body;
      const header = await Header.findOneAndUpdate(
        {},
        { headerText },
        { upsert: true, new: true }
      );
      res.json(header);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
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
    const defaultImage = req.file ? `/uploads/${req.file.filename}` : "";
    const defaultServicesContent = new DefaultServicesContent({
      title: req.body.defaultServicesTitle,
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
    const savedService = await Service2.create(service2Data);

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
// Add these missing routes
app.route('/api/content/footer')
  .get(async (req, res) => {
    try {
      const footer = await Footer.findOne() || { 
        text: '© 2025 My Blog. All Rights Reserved.' 
      };
      res.json(footer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .put(authenticateAdmin, async (req, res) => {
    try {
      const { text } = req.body;
      const footer = await Footer.findOneAndUpdate(
        {},
        { text },
        { upsert: true, new: true }
      );
      res.json(footer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Services routes
app.route('/api/services')
  .get(async (req, res) => {
    try {
      const services = await Service.find();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .post(authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
      const { title, description } = req.body;
      const image = req.file ? req.file.path : '';
      const service = await Service.create({ title, description, image });
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
///==========End service code =======
///////////////////////////////////////////
////=======Blog========
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
////=======End Blog====
/////////////////////////////////////////////////////////////////////////////////////////////////
////=========vacancy and scholar===========
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


///==========End of vacancy and scholar====
// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});