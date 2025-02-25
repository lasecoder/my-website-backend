const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const { ServicesHeader, DefaultServicesContent, Service1, Service2, Footer } = require('./models/ServicesHeader');  // Import models

const app = express();
const port = 4001;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/myDatabase')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Middleware to handle CORS and file uploads
app.use(cors());
app.use(express.json()); // For handling JSON requests
app.use(express.urlencoded({ extended: true })); // For handling URL-encoded data

// Multer setup for handling file uploads
const upload = multer({ dest: 'uploads/' });

// ------------------------
// Route to update Services Header
// ------------------------
app.put("/api/content/services-header", upload.single('services-header-image'), async (req, res) => {
    console.log("Updating Services Header:", req.body);  // Log incoming request

    // Validate 'services-header-title' exists
    if (!req.body["services-header-title"]) {
      return res.status(400).json({ error: "services-header-title is required" });
    }

    try {
      const headerImage = req.file ? req.file.path : "";  // Set image path if file exists

      const servicesHeader = new ServicesHeader({
        servicesHeaderTitle: req.body["services-header-title"],
        servicesHeaderImage: headerImage
      });

      await servicesHeader.save();
      console.log("Services Header updated:", servicesHeader);

      res.status(200).json({ message: "Services header updated successfully" });
    } catch (error) {
      console.error("Error updating services header:", error);
      res.status(500).json({ error: "Failed to update services header", details: error.message });
    }
});

// ------------------------
// Route to update Default Services Content
// ------------------------
app.put('/api/content/services', upload.single('default-services-image'), async (req, res) => {
    console.log('Updating Default Services Content:', req.body);  // Log incoming request

    // Validate that required data exists
    if (!req.body["default-services-title"] || !req.body["default-services-content"]) {
      return res.status(400).json({ error: "Both 'default-services-title' and 'default-services-content' are required" });
    }

    try {
      const defaultImage = req.file ? req.file.path : "";

      const defaultServicesContent = new DefaultServicesContent({
        title: req.body["default-services-title"],
        content: req.body["default-services-content"],
        image: defaultImage
      });

      await defaultServicesContent.save();
      console.log('Default Services Content updated:', defaultServicesContent);

      res.status(200).json({ message: 'Default services content updated successfully' });
    } catch (error) {
      console.error("Error updating default services content:", error);
      res.status(500).json({ error: "Failed to update default services content", details: error.message });
    }
});

// ------------------------
// Route to update Service 1
// ------------------------
app.put('/api/services/1', upload.single('service-img-1'), async (req, res) => {
    console.log('Updating Service 1:', req.body);  // Log incoming request

    if (!req.body["service-title-1"] || !req.body["service-description-1"]) {
      return res.status(400).json({ error: "Both 'service-title-1' and 'service-description-1' are required" });
    }

    try {
      const serviceImage1 = req.file ? req.file.path : "";

      const service1Data = new Service1({
        title: req.body["service-title-1"],
        description: req.body["service-description-1"],
        image: serviceImage1
      });

      await service1Data.save();
      console.log('Service 1 updated:', service1Data);

      res.status(200).json({ message: 'Service 1 updated successfully' });
    } catch (error) {
      console.error("Error updating service 1:", error);
      res.status(500).json({ error: "Failed to update service 1", details: error.message });
    }
});

// ------------------------
// Route to update Service 2
// ------------------------
app.put('/api/services/2', upload.single('service-img-2'), async (req, res) => {
    console.log('Updating Service 2:', req.body);  // Log incoming request
    
    // Validate required fields: title and description
    if (!req.body["service-title-2"] || !req.body["service-description-2"]) {
      return res.status(400).json({ error: "Both 'service-title-2' and 'service-description-2' are required" });
    }
  
    try {
      // Get the image path if file is uploaded
      const serviceImage2 = req.file ? req.file.path : "";
  
      // Handle the optional link field: if it's not provided, set it to null or an empty string
      const serviceLink2 = req.body["service-link-2"] || "";  // Default to empty string if not provided
  
      // Create data object for service 2
      const service2Data = {
        title: req.body["service-title-2"],
        description: req.body["service-description-2"],
        image: serviceImage2,
        link: serviceLink2  // Add the optional field to the data
      };
  
      // Example: Replace with your model logic to save the data to the database
      // await Service2Model.create(service2Data);
  
      console.log('Service 2 updated:', service2Data);
  
      res.status(200).json({ message: 'Service 2 updated successfully' });
    } catch (error) {
      console.error("Error updating service 2:", error);
      res.status(500).json({ error: "Failed to update service 2", details: error.message });
    }
  });
  
// ------------------------
// Route to update Footer
// ------------------------
app.put('/api/content/footer', async (req, res) => {
    console.log('Updating Footer:', req.body);

    if (!req.body["footer-text"]) {
      return res.status(400).json({ error: "Footer text is required" });
    }

    try {
      const footerData = new Footer({
        footerText: req.body["footer-text"]
      });

      await footerData.save();
      console.log('Footer updated:', footerData);

      res.status(200).json({ message: 'Footer updated successfully' });
    } catch (error) {
      console.error("Error updating footer:", error);
      res.status(500).json({ error: "Failed to update footer", details: error.message });
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
