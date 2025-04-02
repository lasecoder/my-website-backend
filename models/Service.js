// In your server.js or models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: { type: Number, required: true, unique: true }, // Numeric ID for easy reference
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: String,
  createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', serviceSchema);