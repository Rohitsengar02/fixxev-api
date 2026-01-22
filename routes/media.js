const express = require('express');
const router = express.Router();
const Media = require('../models/Media');

// Get all media items
router.get('/', async (req, res) => {
    try {
        const media = await Media.find().sort({ createdAt: -1 });
        res.json(media);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed some initial data if empty
router.post('/seed', async (req, res) => {
    try {
        const count = await Media.countDocuments();
        if (count > 0) return res.json({ message: 'Media already seeded' });

        const initialMedia = [
            { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800', fileName: 'ebike.jpg', fileType: 'image' },
            { url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', fileName: 'charging.jpg', fileType: 'image' },
            { url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800', fileName: 'ev-car.jpg', fileType: 'image' },
            { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', fileName: 'tech.jpg', fileType: 'image' },
        ];

        await Media.insertMany(initialMedia);
        res.json({ message: 'Media seeded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a media item (usually after Cloudinary upload)
router.post('/', async (req, res) => {
    const media = new Media({
        url: req.body.url,
        public_id: req.body.public_id,
        fileName: req.body.fileName,
        fileType: req.body.fileType || 'image'
    });

    try {
        const newMedia = await media.save();
        res.status(201).json(newMedia);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a media item
router.delete('/:id', async (req, res) => {
    try {
        await Media.findByIdAndDelete(req.params.id);
        res.json({ message: 'Media deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
