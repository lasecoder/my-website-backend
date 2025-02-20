const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Contact = require('./models/Contact'); // Correct path to Contact model

const app = express();
const port = 3000;

// Enable CORS and middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mywebsite', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ Error connecting to MongoDB:', err));

// Route to fetch contact content
app.get('/contact-content', async (req, res) => {
    try {
        const content = await Contact.find();
        res.json(content);
    } catch (error) {
        console.error("❌ Error fetching content:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Route to update contact content
app.post('/update-contact-content', async (req, res) => {
    try {
        const { section, content } = req.body;

        console.log("Received data:", { section, content });

        if (!section || !content) {
            return res.status(400).json({ success: false, message: "Missing data!" });
        }

        const updatedContent = await Contact.findOneAndUpdate(
            { section },  
            { content },  
            { new: true, upsert: true }  
        );

        console.log("Updated content:", updatedContent);

        res.json({ success: true, message: "Content updated!", updatedContent });
    } catch (error) {
        console.error("❌ Error updating content:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// 🆕 Route to fetch home header content
app.get('/home-header', async (req, res) => {
    try {
        const content = await Contact.findOne({ section: "home-header" });
        res.json(content || { section: "home-header", content: "Default Home Header" });
    } catch (error) {
        console.error("❌ Error fetching home header:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 🆕 Route to update home header content
app.post('/update-home-header', async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, message: "Missing content!" });
        }

        const updatedHeader = await Contact.findOneAndUpdate(
            { section: "home-header" },
            { content },
            { new: true, upsert: true }
        );

        console.log("Updated home header:", updatedHeader);

        res.json({ success: true, message: "Home header updated!", updatedHeader });
    } catch (error) {
        console.error("❌ Error updating home header:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
