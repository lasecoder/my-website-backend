const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Post title is required'],
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: { 
    type: String, 
    required: [true, 'Post content is required'],
    minlength: [10, 'Content must be at least 10 characters']
  },
  image: {
    type: String,
    validate: {
      validator: v => v === '' || /\.(jpg|jpeg|png|gif)$/i.test(v),
      message: 'Image must be a valid URL with jpg, jpeg, png, or gif extension'
    }
  },
  video: {
    type: String,
    validate: {
      validator: v => v === '' || /\.(mp4|mov|avi)$/i.test(v),
      message: 'Video must be a valid URL with mp4, mov, or avi extension'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for better query performance
postSchema.index({ title: 'text', content: 'text' });

// Middleware to update the 'updatedAt' field before saving
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);