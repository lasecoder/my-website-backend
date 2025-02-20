const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogs = await BlogPost.find().sort({ date: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Add a new blog post
router.post('/', async (req, res) => {
  try {
    const newBlog = new BlogPost({
      title: req.body.title,
      content: req.body.content
    });
    await newBlog.save();
    res.json(newBlog);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
