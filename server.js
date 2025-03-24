const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');
// Models
const HomeContent = require('./models/HomeContent');
const User = require('./models/User');
const Service1 = require('./models/Service1');
const Service = require('./models/Service'); // Ensure this path is correct
const DefaultServicesContent = require('./models/DefaultServicesContent');
const Footer = require("./models/Footer");
const Post = require('./models/Post');
const Scholarship = require("./models/Scholarship");
const Header = require("./models/Header");  // Importing Header model
const Logo = require('./models/Logo');
const message = require('./models/Message'); // Use the correct case
const Vacancy = require('./models/Vacancy'); // Import the Vacancy model
// Load environment variables
dotenv.config();
const uploadDir = 'uploads';
const imageDir = `${uploadDir}/images`;
const videoDir = `${uploadDir}/videos`;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
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

// Middleware

const express = require('express');
const cors = require('cors');


// ✅ Only add CORS **once**, configured properly
app.use(cors({
  origin: 'https://my-website-backend-ixzh.onrender.com', // ✅ your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
const express = require('express');
const cors = require('cors');


// ✅ CORS config for your frontend
app.use(cors({
  origin: 'https://my-website-backend-ixzh.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ✅ Sample routes
app.get('/api/services', (req, res) => {
  res.json([
    {
      title: "Service One",
      image: "uploads/service1.png",
      description: "Description for Service One"
    },
    {
      title: "Service Two",
      image: "uploads/service2.png",
      description: "Description for Service Two"
    }
  ]);
});

app.get('/api/content/header', (req, res) => {
  res.json({
    title: "Welcome to FutureTechTalent",
    image: "uploads/default-logo.png"
  });
});

app.get('/api/content/footer', (req, res) => {
  res.json({
    footerText: "© 2025 FutureTechTalent. All rights reserved."
  });
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://my-website-backend-ixzh.onrender.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage });

// ------------------------ Routes ------------------------

// Homepage route
app.get('/api/header', async (req, res) => {
  try {
    const header = await Header.findOne();
    if (!header) {
      return res.status(404).json({ message: 'Header not found' });
    }
    res.json({ title: header.title, image: header.logoUrl });
  } catch (error) {
    console.error('Error fetching header:', error);
    res.status(500).json({ message: 'Failed to fetch header' });
  }
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
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
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
    const footer = await Footer.findOne();
    res.json({ footerText: footer ? footer.content : "© 2025 FutureTechTalent. All Rights Reserved." });
  } catch (error) {
    console.error('Error fetching footer:', error);
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
app.get('/api/header', async (req, res) => {
  try {
      const header = await Header.findOne();
      if (!header) {
          return res.status(404).json({ message: 'Header not found' });
      }
      res.json(header);
  } catch (error) {
      console.error('Error fetching header text:', error);
      res.status(500).json({ message: 'Error fetching header text', error: error.message });
  }
});

// Optionally, add insertDefaultHeader function here, but ensure Header is declared once
async function insertDefaultHeader() {
  const existingHeader = await Header.findOne();
  if (!existingHeader) {
      await Header.create({ text: "Welcome to my website" });
      console.log("✅ Default header added");
  }
}

insertDefaultHeader(); // Insert if needed

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
app.get('/api/header', async (req, res) => {
  try {
      console.log("GET /api/header request received"); // Debugging log

      const header = await Header.findOne(); // ✅ Correct function call
      if (!header) {
          return res.status(404).json({ message: 'Header not found' });
      }
      res.json(header);
  } catch (error) {
      console.error("Error fetching header text:", error);
      res.status(500).json({ message: 'Error fetching header text', error: error.message });
  }
});

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
// ------------------------ Server Initialization ------------------------
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

//--------------
app.get('/api/services', async (req, res) => {
  // Handle the request for services
});

app.get('/api/content/footer', async (req, res) => {
  // Handle the request for footer content
});

app.get('/api/header', async (req, res) => {
  // Handle the request for header content
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
//=========================vacancy and scholar server=============

// 🎯 VACANCY ROUTES
app.get('/api/vacancies', async (req, res) => {
  try {
      const vacancies = await Vacancy.find();  // Fetch vacancies from database
      res.json(vacancies);
  } catch (error) {
      console.error("Error fetching vacancies:", error);
      res.status(500).json({ message: "Internal Server Error" });
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
//====================Blog server=======================

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
//=============service server ==========================
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
// Define the /api/logo endpoint
app.get("/api/logo", async (req, res) => {
  try {
      const logo = await Logo.findOne(); // Fetch the logo from the database
      if (!logo) {
          return res.status(404).json({ message: "Logo not found" });
      }
      res.json({ logoUrl: logo.imageUrl }); // Return the logo URL
  } catch (error) {
      console.error("Error fetching logo:", error);
      res.status(500).json({ message: "Error fetching logo", error: error.message });
  }
});


// Login routes
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.status(200).json({ success: true, message: 'Login successful', user });
  } catch (error) {
    console.error('❌ Error during login:', error);
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
    console.error('❌ Error during admin login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Admin user creation
async function createAdminUser() {
  const adminEmail = 'admin@example.com'; // Admin email
  const adminPassword = 'admin123'; // Admin password
  const adminName = 'Admin User'; // Add a name for the admin user

  try {
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        name: adminName, // Provide the required name field
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('ℹ️ Admin user already exists:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

createAdminUser(); // Run this function to create the admin user
// Serve the admin-dashboard.html file from the Admin folder
app.get('/admin_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin', 'admin_dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});
//====================start server======================
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});