const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("uploads")); // To serve uploaded files

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/blogDB", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Failed", err));

// Schema & Model
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    image: String,
    video: String
});
const Post = mongoose.model("Post", postSchema);

// Multer File Upload Setup
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Create Post (with Image and Video Upload Support)
app.post("/api/posts", upload.fields([{ name: "image" }, { name: "video" }]), async (req, res) => {
    try {
        const { title, content } = req.body;
        const image = req.files["image"] ? req.files["image"][0].filename : null;
        const video = req.files["video"] ? req.files["video"][0].filename : null;
        const newPost = new Post({ title, content, image, video });
        await newPost.save();
        res.status(201).json({ message: "Post created successfully!", post: newPost });
    } catch (error) {
        res.status(500).json({ message: "Error creating post", error });
    }
});

// Get All Posts
app.get("/api/posts", async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error });
    }
});

// Update Post
app.put("/api/posts/:id", async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Post updated successfully!", post: updatedPost });
    } catch (error) {
        res.status(500).json({ message: "Error updating post", error });
    }
});

// Delete Post
app.delete("/api/posts/:id", async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Post deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting post", error });
    }
});
// Endpoint to get posts with search functionality
app.get("/api/posts", async (req, res) => {
    const searchQuery = req.query.search || ''; // Get the search query from the URL

    // Find posts that match the search query in either title or content
    const posts = await Post.find({
        $or: [
            { title: { $regex: searchQuery, $options: 'i' } },  // Case-insensitive search on title
            { content: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search on content
        ]
    });

    res.json(posts);  // Send the filtered posts as a response
});

///============BOG==========
// Create Post (with Image and Video Upload Support)
app.post("/api/posts", upload.fields([{ name: "image" }, { name: "video" }]), async (req, res) => {
    try {
        const { title, content } = req.body;
        const image = req.files["image"] ? req.files["image"][0].filename : null;
        const video = req.files["video"] ? req.files["video"][0].filename : null;
        const newPost = new Post({ title, content, image, video });
        await newPost.save();
        res.status(201).json({ message: "Post created successfully!", post: newPost });
    } catch (error) {
        res.status(500).json({ message: "Error creating post", error });
    }
});

// Get All Posts
app.get("/api/posts", async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error });
    }
});

// Update Post
app.put("/api/posts/:id", async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Post updated successfully!", post: updatedPost });
    } catch (error) {
        res.status(500).json({ message: "Error updating post", error });
    }
});

// Delete Post
app.delete("/api/posts/:id", async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Post deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting post", error });
    }
});
// Endpoint to get posts with search functionality
app.get("/api/posts", async (req, res) => {
    const searchQuery = req.query.search || ''; // Get the search query from the URL

    // Find posts that match the search query in either title or content
    const posts = await Post.find({
        $or: [
            { title: { $regex: searchQuery, $options: 'i' } },  // Case-insensitive search on title
            { content: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search on content
        ]
    });

    res.json(posts);  // Send the filtered posts as a response
});
///============End BOg=========
// Start Server
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
