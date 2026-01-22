const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get settings (singleton-like)
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({}); // Create default if not exists
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settings
router.put('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
