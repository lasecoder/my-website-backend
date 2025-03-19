const mongoose = require("mongoose");

const HeaderSchema = new mongoose.Schema({
  text: { type: String, required: true },
  logoUrl: { type: String, required: true }
});

// Define and export the Header model
const Header = mongoose.models.Header || mongoose.model("Header", HeaderSchema);
module.exports = Header;
