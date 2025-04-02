// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);