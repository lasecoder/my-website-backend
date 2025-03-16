const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// ✅ CORS Configuration
const allowedOrigins = ['http://localhost:8080', 'http://localhost:5500']; // Add your frontend URL

app.use(cors({ 
    origin: '*',  // Allow all origins (ONLY for development)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));


// ✅ Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  
app.use(bodyParser.json());

// ✅ Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/vacancies_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected successfully'))
  .catch((error) => console.log('❌ MongoDB connection failed:', error));

// ✅ Vacancy Schema
const VacancySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String }
});
const Vacancy = mongoose.model('Vacancy', VacancySchema);

// ✅ Scholarship Schema
const ScholarshipSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const Scholarship = mongoose.model('Scholarship', ScholarshipSchema);
// Define a combined schema for scholar header and footer

// MongoDB models for Scholar Header and Scholar Footer
const ScholarHeader = mongoose.model("ScholarHeader", new mongoose.Schema({
    header: String,
  }));
  
  const ScholarFooter = mongoose.model("ScholarFooter", new mongoose.Schema({
    footer: String,
  }));
  

// ✅ Header Schema
const HeaderSchema = new mongoose.Schema({
    title: { type: String, default: "Admin Dashboard - Vacancy Management" },
    logoUrl: { type: String, default: "/uploads/default-logo.png" }
});
const Header = mongoose.model("Header", HeaderSchema);

// ✅ Footer Schema
const FooterSchema = new mongoose.Schema({
    content: { type: String, required: true }
});
const Footer = mongoose.model('Footer', FooterSchema);

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


// ✅ Start the Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
