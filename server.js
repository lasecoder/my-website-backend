const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');

const HomeContent = require('./models/HomeContent');
const User = require('./models/User');
const Service1 = require('./models/Service1');
const Service = require('./models/Service');
const DefaultServicesContent = require('./models/DefaultServicesContent');
const Footer = require("./models/Footer");
const Post = require('./models/Post');
const Scholarship = require("./models/Scholarship");
const Header = require("./models/Header");
const Logo = require('./models/Logo');
const Message = require('./models/Message');
const Vacancy = require('./models/Vacancy');

dotenv.config();

const uploadDir = 'uploads';
const imageDir = `${uploadDir}/images`;
const videoDir = `${uploadDir}/videos`;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MongoDB URI is undefined. Check your .env file.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const app = express();
const port = process.env.PORT || 5000;

// ✅ Helmet CSP Middleware added here
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https://my-website-backend-ixzh.onrender.com'],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(cors({
  origin: 'https://my-website-backend-ixzh.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.get('/api/home-content', async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching home content' });
  }
});

app.get('/api/services1', async (req, res) => {
  try {
    const services = await Service1.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching services1' });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching services' });
  }
});

app.get('/api/default-services-content', async (req, res) => {
  try {
    const content = await DefaultServicesContent.findOne();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching default services content' });
  }
});

app.get('/api/footer', async (req, res) => {
  try {
    const footer = await Footer.findOne();
    res.json(footer);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching footer' });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

app.get('/api/scholarships', async (req, res) => {
  try {
    const scholarships = await Scholarship.find();
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching scholarships' });
  }
});

app.get('/api/header', async (req, res) => {
  try {
    const header = await Header.findOne();
    res.json(header);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching header' });
  }
});

app.get('/api/logo', async (req, res) => {
  try {
    const logo = await Logo.findOne();
    res.json(logo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching logo' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

app.get('/api/vacancies', async (req, res) => {
  try {
    const vacancies = await Vacancy.find();
    res.json(vacancies);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vacancies' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ message: 'Message submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting message' });
  }
});

app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

async function createAdminUser() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const adminName = 'Admin User';

  try {
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created:', adminEmail);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}
createAdminUser();

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
