const mongoose = require('mongoose');
require('dotenv').config();  // Load environment variables from .env file

// MongoDB URI from the environment variables
const URI = process.env.MONGO_URI;  // Make sure this is set in your .env file

// MongoDB connection function
const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      // Connect to MongoDB only if no active connection exists
      await mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('MongoDB connected...');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1);  // Exit if the connection fails
    }
  } else {
    console.log('MongoDB is already connected');
  }
};

module.exports = connectDB;
