const mongoose = require('mongoose');

const HeaderSchema = new mongoose.Schema({
  headerText: { type: String, default: 'Default Header Text' }
});

module.exports = mongoose.model('Header', HeaderSchema);