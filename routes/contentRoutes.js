// routes/contentRoutes.js
const express = require('express');
const Content = require('../models/Content'); // Import Content model
const router = express.Router();

// Get content for a specific section
router.get('/home-content', async (req, res) => {
    try {
        const homeContent = await Content.findOne({ section: 'home-content' });
        res.json(homeContent);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching content' });
    }
});

// Update content for a specific section
router.put('/home-content', async (req, res) => {
    const { content } = req.body;

    try {
        const homeContent = await Content.findOneAndUpdate(
            { section: 'home-content' },
            { content },
            { new: true }
        );
        res.json(homeContent);
    } catch (err) {
        res.status(500).json({ message: 'Error updating content' });
    }
});

// You can create similar routes for other sections (e.g., services, about, etc.)
router.put('/services', async (req, res) => {
    const { content } = req.body;
    try {
        const servicesContent = await Content.findOneAndUpdate(
            { section: 'services' },
            { content },
            { new: true }
        );
        res.json(servicesContent);
    } catch (err) {
        res.status(500).json({ message: 'Error updating services' });
    }
});

// Add more routes for other sections as needed

module.exports = router;
