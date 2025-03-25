// models/HomeContent.js
const mongoose = require('mongoose');

const HomeContentSchema = new mongoose.Schema({
  header: {
    title: {
      type: String,
      default: "FutureTechTalent - Professional Business "
    },
    content: String,
    image: {
      type: String,
      default: "/uploads/default-logo.png"
    }
  },
  services: [{
    title: String,
    description: String,
    image: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  footer: {
    footerText: {
      type: String,
      default: "© 2025 FutureTechTalent Business Solutions. All Rights Reserved."
    }
  }
}, { timestamps: true });

// Add static methods
HomeContentSchema.statics.findOrCreate = async function() {
  let content = await this.findOne();
  if (!content) {
    content = await this.create({});
  }
  return content;
};

module.exports = mongoose.model('HomeContent', HomeContentSchema);