const mongoose = require('mongoose');

const VacancySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }
});

module.exports = mongoose.model('Vacancy', VacancySchema);