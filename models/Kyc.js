const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    documentType: {
        type: String,
        required: true,
        enum: ['Adhaar Card', 'PAN Card', 'Driving License', 'Voter ID']
    },
    documentId: {
        type: String,
        required: true
    },
    documentImageURL: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    rejectionReason: String,
    submittedAt: {
        type: Date,
        default: Date.now
    },
    verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Kyc', kycSchema);
