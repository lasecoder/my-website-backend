const mongoose = require('mongoose'); // Add this line

const VacancySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Add other fields as needed
});

module.exports = mongoose.model('Vacancy', VacancySchema);