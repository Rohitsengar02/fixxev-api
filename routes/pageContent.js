const express = require('express');
const router = express.Router();
const PageContent = require('../models/PageContent');

// Get all page content entries
router.get('/', async (req, res) => {
    try {
        const pages = await PageContent.find({}, 'pageName updatedAt');
        res.json(pages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Get content for a specific page
router.get('/:pageName', async (req, res) => {
    try {
        let page = await PageContent.findOne({ pageName: req.params.pageName });
        if (!page) {
            // Return empty or default if not found
            return res.json({ pageName: req.params.pageName, content: {} });
        }
        res.json(page);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update or create content for a page
router.post('/:pageName', async (req, res) => {
    try {
        const { content } = req.body;
        let page = await PageContent.findOneAndUpdate(
            { pageName: req.params.pageName },
            { content, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(page);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
