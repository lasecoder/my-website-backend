const mongoose = require("mongoose");

const FooterSchema = new mongoose.Schema({
    text: String,
    year: Number,
});

const Footer = mongoose.models.Footer || mongoose.model("Footer", FooterSchema);

module.exports = Footer;
