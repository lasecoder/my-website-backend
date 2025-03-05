const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Import models
const Footer = require("./models/Footer"); // Ensure this file exists
const Header = require("./models/Header"); // Import Header model

const app = express();
const port = 4001;

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/servicesDB")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Schema & Model for Service
const serviceSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    video: String
});
const Service = mongoose.model("Service", serviceSchema);

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let targetDir = file.mimetype.startsWith("video") ? "uploads/videos/" : "uploads/images/";
        fs.mkdirSync(path.join(__dirname, targetDir), { recursive: true });
        cb(null, targetDir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

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

// ------------------------
// Start Server
// ------------------------
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
