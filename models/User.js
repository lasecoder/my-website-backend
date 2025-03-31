const userSchema = new mongoose.Schema({
  // ... other fields stay the same ...
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords do not match!'
    },
    select: false // Add this to match password field
  }
});

// Add this method to your schema for password comparison
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};