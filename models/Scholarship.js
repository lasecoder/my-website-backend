const mongoose = require("mongoose");

const ScholarshipSchema = new mongoose.Schema({
    name: String,
    amount: Number,
    eligibility: String,
    deadline: Date
});

const Scholarship = mongoose.models.Scholarship || mongoose.model("Scholarship", ScholarshipSchema);

module.exports = Scholarship;
