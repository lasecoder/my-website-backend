const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses JSON request body

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/myDatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Schema & Model
const ContentSchema = new mongoose.Schema({
    section: String,
    content: String
});

const Content = mongoose.model("Content", ContentSchema);

// 🟢 GET Content Route (FIXED)
app.get("/api/content", async (req, res) => {
    try {
        const content = await Content.find();
        
        if (!content.length) {
            return res.status(404).json({ error: "No content found" });
        }

        const contentData = {};
        content.forEach(item => {
            contentData[item.section] = item.content;
        });

        res.json(contentData);
    } catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔵 POST Update Content Route (FIXED)
app.post("/api/content/update", async (req, res) => {
    try {
        const { section, content } = req.body;

        if (!section || !content) {
            return res.status(400).json({ error: "Missing section or content" });
        }

        // 🟢 Update content or insert if not exists
        const updatedContent = await Content.findOneAndUpdate(
            { section: section }, // Find by section
            { content: content }, // Update content
            { upsert: true, new: true } // Create if not exists
        );

        if (!updatedContent) {
            return res.status(500).json({ error: "Failed to update content" });
        }

        console.log(`✅ ${section} updated successfully in MongoDB`);
        res.json({ success: true, message: `${section} updated successfully!` });
    } catch (error) {
        console.error("❌ Error updating content:", error);
        res.status(500).json({ error: "Failed to update content" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
