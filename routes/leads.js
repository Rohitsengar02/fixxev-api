const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// Get all leads (Admin)
router.get('/', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new lead (Public)
router.post('/', async (req, res) => {
    const lead = new Lead(req.body);
    try {
        const newLead = await lead.save();
        res.status(201).json(newLead);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update lead status (Admin)
router.put('/:id', async (req, res) => {
    try {
        const updatedLead = await Lead.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(updatedLead);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete lead (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
