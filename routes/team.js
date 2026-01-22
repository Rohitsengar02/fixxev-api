const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');

// Get all
router.get('/', async (req, res) => {
    try {
        const members = await TeamMember.find();
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create
router.post('/', async (req, res) => {
    const memberData = {
        name: req.body.name,
        role: req.body.role,
        bio: req.body.bio,
        category: req.body.category || 'Our Core Team'
    };
    if (req.body.image && req.body.image.trim() !== '') {
        memberData.image = req.body.image;
    }

    const member = new TeamMember(memberData);

    try {
        const newMember = await member.save();
        res.status(201).json(newMember);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update team member
router.put('/:id', async (req, res) => {
    try {
        const updated = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete team member
router.delete('/:id', async (req, res) => {
    try {
        await TeamMember.findByIdAndDelete(req.params.id);
        res.json({ message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
