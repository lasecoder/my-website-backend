// verify.js - Silent version
const fs = require('fs');
const path = require('path');

try {
  // Check for model file without logging
  if (!fs.existsSync(path.join(__dirname, 'models', 'Post.js'))) {
    throw new Error('Post model file not found');
  }
} catch (err) {
  console.error('❌ Deployment verification failed:', err.message);
  process.exit(1);
}