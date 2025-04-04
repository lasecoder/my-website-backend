const fs = require('fs');
const path = require('path');

try {
  if (!fs.existsSync(path.join(__dirname, 'models', 'Post.js'))) {
    throw new Error('Post.js model not found in models directory');
  }
} catch (err) {
  console.error('❌ Deployment verification failed:', err.message);
  process.exit(1);
}