const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    type: {
        type: String,
        enum: ['Contact', 'Franchise', 'Quote', 'Dealership'],
        default: 'Contact'
    },
    subject: { type: String },
    message: { type: String },
    status: {
        type: String,
        enum: ['NEW', 'PENDING', 'CONTACTED', 'CLOSED'],
        default: 'NEW'
    },
    // For specialized forms
    details: { type: Map, of: String },
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);
