const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Initialize express app
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());  // For parsing application/json
app.use(cors());  // Enable CORS for cross-origin requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Serve static files for images

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Folder to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));  // Use timestamp as filename
    }
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/vacancies_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected successfully');
}).catch((error) => {
    console.log('❌ MongoDB connection failed:', error);
});

// Vacancy Schema and Model
const VacancySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String }  // To store image URL
});

const Vacancy = mongoose.model('Vacancy', VacancySchema);

// Footer Schema and Model
const FooterSchema = new mongoose.Schema({
    content: { type: String, required: true }
});

const Footer = mongoose.model('Footer', FooterSchema);

// API Routes

// Get all vacancies
app.get('/api/vacancies', async (req, res) => {
    try {
        const vacancies = await Vacancy.find();
        res.json(vacancies);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching vacancies' });
    }
});

// Create new vacancy (with image upload)
app.post('/api/vacancies', upload.single('image'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newVacancy = new Vacancy({
            title,
            description,
            imageUrl
        });

        await newVacancy.save();
        res.status(201).json(newVacancy);
    } catch (error) {
        res.status(500).json({ error: 'Error creating vacancy' });
    }
});

// Delete a vacancy
app.delete('/api/vacancies/:id', async (req, res) => {
    try {
        const vacancyId = req.params.id;
        await Vacancy.findByIdAndDelete(vacancyId);
        res.status(200).json({ message: 'Vacancy deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting vacancy' });
    }
});

// Route to get the footer content
app.get('/api/footer', async (req, res) => {
    try {
        const footer = await Footer.findOne().sort({ _id: -1 });  // Fetch the most recent footer
        if (footer) {
            res.json({ footerContent: footer.content });
        } else {
            res.json({ footerContent: "Default footer content" }); // Return default if no footer is in the DB
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching footer content' });
    }
});


// Update footer content
app.post('/api/footer', async (req, res) => {
    try {
        const { footerContent } = req.body;
        // Optional: delete all previous footers before saving new one
        await Footer.deleteMany({});
        const newFooter = new Footer({ content: footerContent });
        await newFooter.save();
        
        res.json({ message: "Footer updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: 'Error saving footer content' });
    }
});


// ✅ Define Header Schema
const headerSchema = new mongoose.Schema({
    title: { type: String, default: "Admin Dashboard - Vacancy Management" },
    logoUrl: { type: String, default: "/uploads/default-logo.png" },
});

const Header = mongoose.model("Header", headerSchema);

// ✅ API: Get Header Details
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

// ✅ API: Update Header
app.post("/api/header", upload.single("logo"), async (req, res) => {
    try {
        let header = await Header.findOne();
        if (!header) header = new Header();

        // Update Title
        if (req.body.title) header.title = req.body.title;

        // Update Logo (if uploaded)
        if (req.file) {
            if (header.logoUrl !== "/uploads/default-logo.png") {
                fs.unlinkSync("." + header.logoUrl); // Delete old logo file
            }
            header.logoUrl = "/uploads/" + req.file.filename;
        }

        await header.save();
        res.json({ message: "✅ Header updated successfully", header });
    } catch (error) {
        console.error("❌ Error updating header:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
