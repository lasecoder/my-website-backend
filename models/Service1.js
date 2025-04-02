// D:/book/my-website-backend/models/Service1.js
const mongoose = require('mongoose');

const Service1Schema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String }
});

const Service1 = mongoose.model('Service1', Service1Schema);
module.exports = Service1;
