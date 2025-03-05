const mongoose = require('mongoose');

const HomeContentSchema = new mongoose.Schema({
  header: {
    title: String,
    image: String,
  },
  services: [
    {
      title: String,
      description: String,
      image: String,
    }
  ],
  footer: { 
    footerText: String
  }
});

module.exports = mongoose.model('HomeContent', HomeContentSchema);
