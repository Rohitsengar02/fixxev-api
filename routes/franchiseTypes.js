const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Franchise Type Schema
const franchiseTypeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['Spare Parts', 'Service Center'], default: 'Spare Parts' },
    description: { type: String, default: '' },
    benefits: [{ type: String }],
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const FranchiseType = mongoose.models.FranchiseType || mongoose.model('FranchiseType', franchiseTypeSchema);

// Get all franchise types
router.get('/', async (req, res) => {
    try {
        const types = await FranchiseType.find().sort({ order: 1 });
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create franchise type
router.post('/', async (req, res) => {
    try {
        const type = new FranchiseType(req.body);
        const savedType = await type.save();
        res.status(201).json(savedType);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update franchise type
router.put('/:id', async (req, res) => {
    try {
        const type = await FranchiseType.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(type);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete franchise type
router.delete('/:id', async (req, res) => {
    try {
        await FranchiseType.findByIdAndDelete(req.params.id);
        res.json({ message: 'Franchise type deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed default data
router.post('/seed', async (req, res) => {
    try {
        const count = await FranchiseType.countDocuments();
        if (count > 0) {
            return res.json({ message: 'Data already exists' });
        }

        const defaultTypes = [
            {
                title: 'Spare Parts Dealer',
                type: 'Spare Parts',
                description: 'Become an authorized FIXXEV spare parts distributor. Access our extensive inventory of genuine EV components and parts for all major brands.',
                benefits: [
                    'Direct OEM partnerships',
                    'Competitive wholesale pricing',
                    'Inventory management support',
                    'Marketing & branding assistance',
                    'Training on EV components',
                ],
                imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
                order: 1,
            },
            {
                title: 'Service Center Dealer',
                type: 'Service Center',
                description: 'Open an authorized FIXXEV service center. Get complete setup support, technical training, and access to our AIOT diagnostic platform.',
                benefits: [
                    'Complete center setup support',
                    'AIOT diagnostic tools access',
                    'Certified technician training',
                    'Lead generation support',
                    'Fleet management contracts',
                ],
                imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
                order: 2,
            },
        ];

        await FranchiseType.insertMany(defaultTypes);
        res.json({ message: 'Default franchise types seeded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
