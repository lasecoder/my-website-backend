const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Set up storage engine for images and videos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Mongoose models
const Content = mongoose.model('Content', new mongoose.Schema({
    section: { type: String, required: true },
    content: { type: String, required: true },
    image: String,
    video: String,
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/futuretech', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log(err));

// Routes
// GET route to retrieve Home page content
app.get('/api/content/home-content', async (req, res) => {
    try {
        const content = await Content.findOne({ section: 'home' });
        res.json(content);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching content', error: err });
    }
});

// PUT route to update content
app.put('/api/content/home-content', upload.fields([{ name: 'image' }, { name: 'video' }]), async (req, res) => {
    try {
        const { content } = req.body;
        const homeContent = await Content.findOne({ section: 'home' });

        if (!homeContent) {
            return res.status(404).json({ message: 'Home content not found' });
        }

        homeContent.content = content;
        if (req.files['image']) {
            homeContent.image = req.files['image'][0].path;
        }
        if (req.files['video']) {
            homeContent.video = req.files['video'][0].path;
        }

        await homeContent.save();
        res.json({ success: true, message: 'Home content updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating content', error: err });
    }
});

// Similar PUT routes can be added for other sections such as 'about-us', 'services', etc.

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
