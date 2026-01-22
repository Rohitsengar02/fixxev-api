const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');

// Get all offers (Mainly for Admin)
router.get('/', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get active offers (For Users)
router.get('/active', async (req, res) => {
    try {
        const offers = await Offer.find({ status: 'Active' }).sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create an offer
router.post('/', async (req, res) => {
    const offer = new Offer(req.body);
    try {
        const newOffer = await offer.save();
        res.status(201).json(newOffer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an offer
router.put('/:id', async (req, res) => {
    try {
        const updatedOffer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedOffer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an offer
router.delete('/:id', async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
