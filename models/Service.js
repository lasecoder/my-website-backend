const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const router = express.Router();

// ✅ Service Schema & Model
const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: String,
    video: String
});
const Service = mongoose.model("Service", serviceSchema);

// ✅ Footer Schema & Model
const footerSchema = new mongoose.Schema({
    footerText: { type: String, required: true }
});
const Footer = mongoose.model("Footer", footerSchema);

// ✅ Multer Storage for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// -------------------------------------------
// ✅ SERVICES API
// -------------------------------------------

// Get All Services
router.get("/services", async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: "Error fetching services" });
    }
});

// Add a New Service
router.post("/services", upload.single("service-image"), async (req, res) => {
    try {
        const { serviceTitle, serviceDescription } = req.body;
        const service = new Service({
            title: serviceTitle,
            description: serviceDescription,
            image: req.file ? `/uploads/${req.file.filename}` : ""
        });

        await service.save();
        res.json({ message: "Service added successfully!", service });
    } catch (error) {
        res.status(500).json({ error: "Error adding service" });
    }
});

// -------------------------------------------
// ✅ FOOTER API
// -------------------------------------------

// Get Footer Text
router.get("/footer", async (req, res) => {
    try {
        const footer = await Footer.findOne();
        res.json(footer);
    } catch (error) {
        res.status(500).json({ error: "Error fetching footer" });
    }
});

// Update Footer Text
router.put("/footer", async (req, res) => {
    try {
        const { footerText } = req.body;
        let footer = await Footer.findOne();

        if (!footer) {
            footer = new Footer({ footerText });
        } else {
            footer.footerText = footerText;
        }

        await footer.save();
        res.json({ message: "Footer updated successfully!", footer });
    } catch (error) {
        res.status(500).json({ error: "Error updating footer" });
    }
});

module.exports = router;
