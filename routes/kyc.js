const express = require('express');
const router = express.Router();
const Kyc = require('../models/Kyc');
const User = require('../models/User');

// @route   POST api/kyc
// @desc    Submit KYC documents
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { userId, documentType, documentId, documentImageURL } = req.body;

        if (!userId || !documentType || !documentId || !documentImageURL) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if there is already a pending or verified KYC for this type
        const existingKyc = await Kyc.findOne({ userId, documentType, status: { $in: ['Pending', 'Verified'] } });
        if (existingKyc) {
            return res.status(400).json({ message: `A ${documentType} is already ${existingKyc.status}` });
        }

        const kyc = new Kyc({
            userId,
            documentType,
            documentId,
            documentImageURL
        });

        await kyc.save();
        res.status(201).json(kyc);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/kyc/user/:userId
// @desc    Get KYC history and status for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const kycList = await Kyc.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
        res.json(kycList);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/kyc/:id/verify
// @desc    Verify/Reject KYC (Admin only normally, but simplified for now)
// @access  Public
router.put('/:id/verify', async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        if (!['Verified', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const kyc = await Kyc.findById(req.params.id);
        if (!kyc) {
            return res.status(404).json({ message: 'KYC record not found' });
        }

        kyc.status = status;
        if (status === 'Rejected') {
            kyc.rejectionReason = rejectionReason;
        } else {
            kyc.verifiedAt = Date.now();
        }

        await kyc.save();
        res.json(kyc);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/kyc
// @desc    Get all KYC records
// @access  Public (should be Admin)
router.get('/', async (req, res) => {
    try {
        const kycList = await Kyc.find().sort({ createdAt: -1 });
        res.json(kycList);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
