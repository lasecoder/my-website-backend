const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Contact = require('./models/Contact'); // Ensure the path is correct
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3001; // Ensure your frontend is sending requests to this port

// Enable CORS and middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mywebsite')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ Error connecting to MongoDB:', err));


// 🛠️ FIXED: Move this route ABOVE `app.listen()`
app.post("/contact", async (req, res) => {
    try {
        console.log("📩 Received request body:", req.body); // Debug request body

        const { name, email, message } = req.body;

        // Check if all fields are provided
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        // Save the contact message in the database
        const contact = new Contact({ name, email, message });
        await contact.save();

        res.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("❌ Server error:", error); // Log the actual error
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

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

        if (!section || !content) {
            return res.status(400).json({ success: false, message: "Missing data!" });
        }

        const updatedContent = await Contact.findOneAndUpdate(
            { section },
            { content },
            { new: true, upsert: true }
        );

        console.log("✅ Updated content:", updatedContent);
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

        console.log("✅ Updated home header:", updatedHeader);
        res.json({ success: true, message: "Home header updated!", updatedHeader });
    } catch (error) {
        console.error("❌ Error updating home header:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});
// POST /signup route
app.post('/signup', async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;
  
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match!" });
      }
  
       // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds set to 10

        // Create new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
      res.json({ success: true, message: "User signed up successfully!" });
    } catch (error) {
      console.error("❌ Error during signup:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });
  app.post('/login', async (req, res) => {
    console.log("📤 Login request received");
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('❌ Error during login:', error); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
