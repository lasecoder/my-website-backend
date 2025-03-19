// D:/book/my-website-backend/models/DefaultServicesContent.js
const mongoose = require('mongoose');

const DefaultServicesContentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String }
});

const DefaultServicesContent = mongoose.model('DefaultServicesContent', DefaultServicesContentSchema);
module.exports = DefaultServicesContent;
