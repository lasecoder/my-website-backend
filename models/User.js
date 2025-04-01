// Update the correctPassword method to be more robust
userSchema.methods.correctPassword = async function(candidatePassword) {
  // Add validation checks
  if (!candidatePassword || typeof candidatePassword !== 'string') {
    throw new Error('Invalid candidate password');
  }
  
  if (!this.password) {
    throw new Error('User password not available');
  }

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Password comparison error:', err);
    throw new Error('Password comparison failed');
  }
};