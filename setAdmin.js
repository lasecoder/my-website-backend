const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');  // Adjust the path if needed

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mywebsite', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@example.com';  // The email for the admin user
    const adminPassword = 'admin123';  // Set your admin password here
    const adminName = 'Admin User';  // The name for the admin user

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      process.exit();
    }

    // Hash the password for storage
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create new admin user
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,  // Make sure this field is set to true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    process.exit();
  })
  .catch((error) => {
    console.error('❌ Error creating admin:', error);
    process.exit();
  });
