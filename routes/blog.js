const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create blog
router.post('/', async (req, res) => {
    const blogData = {
        title: req.body.title,
        date: req.body.date,
        category: req.body.category,
        excerpt: req.body.excerpt,
        content: req.body.content
    };
    if (req.body.image && req.body.image.trim() !== '') {
        blogData.image = req.body.image;
    }

    const blog = new Blog(blogData);

    try {
        const newBlog = await blog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete blog
router.delete('/:id', async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Blog deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update blog
router.put('/:id', async (req, res) => {
    try {
        const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
