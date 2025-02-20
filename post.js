const mongoose = require('mongoose');

// Define the schema for posts
const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true }
}, { timestamps: true });

// Create and export the Post model
module.exports = mongoose.model('Post', PostSchema);
