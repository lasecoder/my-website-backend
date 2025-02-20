const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');  // Adjust the path if needed

mongoose.connect('mongodb://localhost:27017/mywebsite', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const adminEmail = 'admin@example.com'; // Use your admin email
    const adminPassword = 'admin123'; // Use your admin password
    const adminName = 'Admin User'; // Use the admin name
    
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('❌ Admin already exists!');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true, // Set to true to give admin privileges
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    process.exit();
  })
  .catch((error) => {
    console.error('❌ Error creating admin:', error);
    process.exit();
  });
