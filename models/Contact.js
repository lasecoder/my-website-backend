// models/Contact.js

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true },
    content: { type: String, required: true }
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
