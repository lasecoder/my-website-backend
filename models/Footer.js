const mongoose = require("mongoose");

const FooterSchema = new mongoose.Schema({
    footerText: { type: String, required: true }
});

module.exports = mongoose.model("Footer", FooterSchema);
