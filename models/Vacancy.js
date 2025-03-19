const mongoose = require("mongoose");

const VacancySchema = new mongoose.Schema({
    title: String,
    description: String,
    company: String,
    location: String,
    postedDate: { type: Date, default: Date.now }
});

const Vacancy = mongoose.models.Vacancy || mongoose.model("Vacancy", VacancySchema);

module.exports = Vacancy;
