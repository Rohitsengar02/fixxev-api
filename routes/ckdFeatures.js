const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// CKD Feature Schema
const ckdFeatureSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, enum: ['Infrastructure', 'Technology', 'Design', 'Efficiency', 'Sustainability', 'Support'], default: 'Infrastructure' },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const CKDFeature = mongoose.models.CKDFeature || mongoose.model('CKDFeature', ckdFeatureSchema);

// Get all features
router.get('/', async (req, res) => {
    try {
        const features = await CKDFeature.find().sort({ order: 1 });
        res.json(features);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create feature
router.post('/', async (req, res) => {
    try {
        const feature = new CKDFeature(req.body);
        const savedFeature = await feature.save();
        res.status(201).json(savedFeature);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update feature
router.put('/:id', async (req, res) => {
    try {
        const feature = await CKDFeature.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(feature);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete feature
router.delete('/:id', async (req, res) => {
    try {
        await CKDFeature.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feature deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed default data
router.post('/seed', async (req, res) => {
    try {
        await CKDFeature.deleteMany({});

        const defaultFeatures = [
            {
                title: 'Product Sourcing & Compatibility Testing',
                subtitle: 'Strategic Sourcing',
                description: 'We connect you with reliable, audited EV factories producing proven low-speed platforms. Our team handles rigorous compatibility testing to ensure components meet Indian road conditions and user expectations before you commit to a brand launch.',
                category: 'Support',
                order: 1,
            },
            {
                title: 'CKD Import & Logistics Handling',
                subtitle: 'Seamless Logistics',
                description: 'Our team manages the entire complex import chain, including factory coordination, professional CKD packing, export documentation, international shipping, and customs clearance. We ensure secure port-to-factory movement for your kits.',
                category: 'Support',
                order: 2,
            },
            {
                title: 'Local Assembly Support & Quality Checks',
                subtitle: 'Precision Assembly',
                description: 'Fixx EV provides hands-on support for assembly line setup, technician training, and standard operating procedures (SOPs). We implement multi-stage quality inspections and rigorous testing to ensure every vehicle is market-ready and reliable.',
                category: 'Support',
                order: 3,
            },
            {
                title: 'Branding, Marketing & Sales Support',
                subtitle: 'Brand Growth',
                description: 'We help you transform generic kits into a premium brand. This includes designing your brand identity, model-specific decals, Indianized packaging, and user manuals. Beyond product, we assist in market positioning and dealer strategies.',
                category: 'Support',
                order: 4,
            }
        ];

        await CKDFeature.insertMany(defaultFeatures);
        res.json({ message: 'Default CKD features seeded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
