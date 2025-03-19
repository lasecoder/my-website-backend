const mongoose = require('mongoose');

const headerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true }
});

const HeaderModel = mongoose.model('Header', headerSchema);

module.exports = HeaderModel;
