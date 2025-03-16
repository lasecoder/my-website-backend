const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Add API or other routes
app.get('/api/content', (req, res) => {
    res.json({
        homeHeaderTitle: 'FutureTechTalent - Professional Business Solutions',
        homeIntroText: 'Your partner in Cybersecurity, IT Consulting, and Business Growth. We provide expert guidance to secure and scale your business.',
        homeServicesText: 'We help businesses protect their data and infrastructure with top-tier security solutions.',
        homeBlogText: 'Latest Articles: Stay updated with our insights on cybersecurity, IT trends, and more.',
        homeCtaText: 'Let\'s Grow Your Business',
        homeCtaLink: 'contact.html',
        homeFooterText: '© 2025 FutureTechTalent Business Solutions. All Rights Reserved.',
    });
});

// Serve your HTML file (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
