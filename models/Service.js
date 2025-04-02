// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: String
}, { timestamps: true });

// Add static method for easier querying
serviceSchema.statics.findByServiceId = function(id) {
  return this.findOne({ serviceId: id });
};

module.exports = mongoose.model('Service', serviceSchema);