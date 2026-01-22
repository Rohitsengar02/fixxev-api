const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// About Section Schema
const aboutSectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    label: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, enum: ['Values', 'Vision', 'CSR', 'Future', 'Custom', 'Infrastructure', 'Technology', 'Franchise', 'Impact', 'Investment', 'Join'], default: 'Custom' },
    items: [{ type: String }],
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const AboutSection = mongoose.models.AboutSection || mongoose.model('AboutSection', aboutSectionSchema);

// Get all sections
router.get('/', async (req, res) => {
    try {
        const sections = await AboutSection.find().sort({ order: 1 });
        res.json(sections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create section
router.post('/', async (req, res) => {
    try {
        const section = new AboutSection(req.body);
        const savedSection = await section.save();
        res.status(201).json(savedSection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update section
router.put('/:id', async (req, res) => {
    try {
        const section = await AboutSection.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(section);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete section
router.delete('/:id', async (req, res) => {
    try {
        await AboutSection.findByIdAndDelete(req.params.id);
        res.json({ message: 'Section deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed default data
router.post('/seed', async (req, res) => {
    try {
        await AboutSection.deleteMany({});

        const defaultSections = [
            {
                title: 'Our Core Values',
                label: '// VALUES',
                description: 'At FIXXEV, we are driven by integrity, excellence, and a deep commitment to the environment.',
                type: 'Values',
                items: ['Integrity in every service', 'Excellence in engineering', 'Sustainable EV solutions'],
                order: 1,
            },
            {
                title: 'Corporate Social Responsibility',
                label: '// GIVING BACK',
                description: 'FIXXEV is committed to making a positive impact on the environment and society.',
                type: 'CSR',
                items: ['Green recycling programs', 'Community EV awareness', 'Waste reduction protocols'],
                order: 2,
            },
            {
                title: 'Our Goal',
                label: '// VISION',
                description: 'Our goal is to build India\'s most reliable EV support ecosystem.',
                type: 'Vision',
                items: ['Zero downtime for EV users', 'Nationwide service availability', 'Affordable premium care'],
                order: 3,
            },
            {
                title: 'Future Plans & Expansion',
                label: '// THE FUTURE',
                description: 'We are rapidly expanding our footprint across India with upcoming battery tech centers.',
                type: 'Future',
                items: ['Upcoming battery tech centers', 'Expansion to 200+ cities', 'Next-gen retrofit solutions'],
                order: 4,
            },
            {
                title: 'What We Are Building',
                label: '// INFRASTRUCTURE',
                description: '',
                type: 'Infrastructure',
                items: [
                    'A pan-India network of 500+ EV service centres',
                    'OEM-certified spares & standardized service processes',
                    'Skilled, trained technicians supported by Fixx EV',
                    'Centralized quality control & supply chain'
                ],
                imageUrl: 'https://images.unsplash.com/photo-1587352324982-d49d44f80877?auto=format&fit=crop&q=80&w=2000',
                order: 5
            },
            {
                title: 'Technology as the Backbone',
                label: '// INNOVATION',
                description: 'Our Fixx EV mobile application will connect EV owners to the nearest authorized Fixx EV service centre, enabling service bookings, diagnostics, and support — creating a seamless ownership experience.',
                type: 'Technology',
                imageUrl: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&q=80&w=2000',
                order: 6
            },
            {
                title: 'Franchise-Led Growth Model',
                label: '// GROWTH',
                description: 'Fixx EV follows a capital-light, franchise-driven expansion strategy, empowering local entrepreneurs and existing workshops to become part of a trusted national brand.',
                type: 'Franchise',
                items: [
                    'Branding & onboarding support',
                    'Technical training & SOPs',
                    'OEM-approved parts access',
                    'Digital tools & customer acquisition'
                ],
                imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=2000',
                order: 7
            },
            {
                title: 'Why This Matters',
                label: '// IMPACT',
                description: 'After-sales confidence is critical for mass EV adoption. By creating a reliable service and spares ecosystem, Fixx EV directly accelerates clean, green, and sustainable mobility while generating scalable and recurring revenue opportunities.',
                type: 'Impact',
                imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=2000',
                order: 8
            },
            {
                title: 'Investment Opportunity',
                label: '// OPPORTUNITY',
                description: 'Fixx EV presents a high-impact opportunity at the intersection of EV adoption growth, asset-light franchising, and technology-enabled service networks.',
                type: 'Investment',
                items: [
                    'Strategic investor partnerships',
                    'Franchise network expansion',
                    'Largest EV service ecosystem in India'
                ],
                imageUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&q=80&w=2000',
                order: 9
            },
            {
                title: 'Join the Mission',
                label: '// COLLABORATION',
                description: 'We are now inviting strategic investors, partners, and franchisees to join us. If you are an investor, partner, or entrepreneur who believes in the future of clean mobility, you are most welcome to join this mission and grow with us.',
                type: 'Join',
                imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000',
                order: 10
            }
        ];

        await AboutSection.insertMany(defaultSections);
        res.json({ message: 'Default sections seeded successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
