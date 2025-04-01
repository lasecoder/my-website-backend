// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please tell us your name!'],
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,  // This creates an index automatically
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    maxlength: [100, 'Email cannot be longer than 100 characters']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords do not match!'
    },
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],  // Added moderator role
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true  // Prevents modification after creation
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Remove the separate index definition since 'unique: true' already creates it
// userSchema.index({ email: 1 }, { unique: true });  // REMOVE THIS LINE

// Document middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Update passwordChangedAt when password is modified
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // 1 second in past
  next();
});

// Query middleware to filter out inactive users
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance method for password comparison
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Virtual property for user's display name
userSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.role})`;
});

module.exports = mongoose.model('User', userSchema);