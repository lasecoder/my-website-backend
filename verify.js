const fs = require('fs');
const path = require('path');

console.log('=== Verifying Deployment Structure ===');
console.log('Current directory:', __dirname);

// Check for both possible filenames
const possiblePaths = [
  path.join('models', 'post.js'),
  path.join('models', 'Post.js'),
  'post.js',
  'Post.js'
];

let foundPath = null;
possiblePaths.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    foundPath = fullPath;
    console.log(`✅ Found model at: ${file}`);
  }
});

if (!foundPath) {
  console.error('❌ Error: Could not find Post model file');
  console.log('Searched in:', possiblePaths);
  process.exit(1);
}

console.log('✅ All required files present');