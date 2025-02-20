// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path to your User model
const isAdmin = require('./isAdminMiddleware'); // Import the isAdmin middleware
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // If user is an admin, generate a JWT token with isAdmin in the payload
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },  // Include isAdmin in the token
            'your-secret-key', // Secret key to sign the token
            { expiresIn: '1h' } // Token expiration time
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token, // Send the token as part of the response
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Example route protected by isAdmin middleware
router.get('/admin-dashboard', isAdmin, (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard!' });
});

module.exports = router;
