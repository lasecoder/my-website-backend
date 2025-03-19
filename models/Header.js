const mongoose = require('mongoose');

const headerSchema = new mongoose.Schema({
    text: { type: String, required: true }
});

const Header = mongoose.model('Header', headerSchema); // ✅ Correct way to create a model

module.exports = Header; // ✅ Ensure this line exists
