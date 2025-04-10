const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String // Cloudinary image URL
});

const HomeContentSchema = new mongoose.Schema({
  headerTitle: String,
  headerImage: String, // Cloudinary logo URL
  services: [ServiceSchema],
  footerText: String
});

module.exports = mongoose.model('HomeContent', HomeContentSchema);
