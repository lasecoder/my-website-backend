const mongoose = require("mongoose");

// Define schema to store website content
const homeContentSchema = new mongoose.Schema({
  header: {
    title: { type: String, required: true },
    image: { type: String, default: null }, 
  },
  intro: { text: String },
  services: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      image: { type: String, default: null }, 
    }
  ],
  blog: { text: String },
  cta: { text: String, link: String },
  footer: { text: String },
});

// Create and export model
const HomeContent = mongoose.model("HomeContent", homeContentSchema);
module.exports = HomeContent;
