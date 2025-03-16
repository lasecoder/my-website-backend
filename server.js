const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const HomeContent = require('./models/HomeContent'); // Import Mongoose Model
const Message = require('./models/message');  // Correct import path
 // Import Message model
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Serve static files from the 'public' folder inside the backend directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static CSS from the 'css' folder inside the backend directory
app.use(express.static(path.join(__dirname, 'css')));

// Define a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Send the index.html from public folder
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const mongoose = require('mongoose');

// Use environment variables for sensitive information like MongoDB URI
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.log('Error connecting to MongoDB:', err);
  });

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// ✅ File Upload Setup (Multer)
const storage = multer.diskStorage({
  destination: 'uploads/', 
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage });

// ✅ API: Update Home Content (Header, Services, Footer)
app.post('/api/content', upload.single('image'), async (req, res) => {
  try {
    const { section, title, description, footerText } = req.body;
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;  // Normalize file path for cross-platform compatibility

    // Prepare the data to update based on section
    const updateData = {};

    // Handle different sections
    if (section === "header") {
      updateData["header"] = {
        title: title || "Default Header Title", // Default if title is not provided
        content: description || "",  // Default empty content
        image: imagePath || "No image"  // Default to "No image" if no image provided
      };
    } else if (section === "footer") {
      updateData["footer"] = { footerText: footerText || "© 2025 FutureTechTalent. All Rights Reserved." };
    } else if (section === "services") {
      // Push new service to the services array
      updateData["$push"] = { services: { title, description, image: imagePath || "No image" } };
    } else {
      return res.status(400).json({ message: "Invalid section specified." });  // Return error if section is invalid
    }

    // Find the document in MongoDB and update it (upsert will create a new document if none is found)
    const updatedContent = await HomeContent.findOneAndUpdate(
      {},  // Find the first document in the collection (empty filter {})
      updateData,  // The data to update
      { new: true, upsert: true }  // Return the updated document and create if not found
    );

    // Respond with the updated content
    res.status(200).json({ message: `${section} updated successfully!`, data: updatedContent });

  } catch (error) {
    console.error('❌ Error updating content:', error);
    res.status(500).json({ message: 'Failed to update content' });
  }
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


