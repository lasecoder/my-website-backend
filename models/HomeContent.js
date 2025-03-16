const mongoose = require('mongoose');

const homeContentSchema = new mongoose.Schema({
  header: {
    title: String,
    content: String,
    image: String,
  },
  footer: {
    footerText: String,
  },
  services: [{
    title: String,
    description: String,
    image: String,
  }]
});

const HomeContent = mongoose.model('HomeContent', homeContentSchema);

module.exports = HomeContent;
