const express = require('express');
const router = express.Router();
const Tip = require('../models/Tip');

// Get all tips (Admin)
router.get('/', async (req, res) => {
    try {
        const tips = await Tip.find().sort({ createdAt: -1 });
        res.json(tips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get active tips (User)
router.get('/active', async (req, res) => {
    try {
        const tips = await Tip.find({ status: 'Active' }).sort({ createdAt: -1 });
        res.json(tips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a tip
router.post('/', async (req, res) => {
    const tip = new Tip(req.body);
    try {
        const newTip = await tip.save();
        res.status(201).json(newTip);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a tip
router.put('/:id', async (req, res) => {
    try {
        const updatedTip = await Tip.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTip);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a tip
router.delete('/:id', async (req, res) => {
    try {
        await Tip.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tip deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
