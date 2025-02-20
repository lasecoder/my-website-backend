const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true },
    content: { type: String, required: true }
});

module.exports = mongoose.model('Content', ContentSchema);
