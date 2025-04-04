const fs = require('fs');
const path = require('path');

console.log('=== Deployment Verification ===');
console.log('Current directory:', __dirname);

const modelPath = path.join(__dirname, 'models', 'post.js');
const exists = fs.existsSync(modelPath);

console.log(`post.js exists: ${exists}`);
console.log('Models directory contents:', fs.existsSync(path.join(__dirname, 'models')) 
  ? fs.readdirSync(path.join(__dirname, 'models')) 
  : 'Models directory does not exist');

if (!exists) {
  console.error('❌ Error: post.js not found in models directory');
  process.exit(1);
}

console.log('✅ All files verified successfully');