const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userMessage: {
        type: String,
        required: true, // Ensure userMessage is required
    },
    sender: {
        type: String,
        required: true, // Ensure sender is required
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the creation time
    },
});

module.exports = mongoose.model('Message', messageSchema);
