// verify.js - silent version
const fs = require('fs');
const path = require('path');

try {
  if (!fs.existsSync(path.join(__dirname, 'models', 'Post.js'))) {
    throw new Error('Post model missing');
  }
} catch (err) {
  console.error('❌ Deployment error:', err.message);
  process.exit(1);
}