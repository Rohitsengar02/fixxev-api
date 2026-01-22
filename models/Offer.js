const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String },
    discount: { type: String },
    image: { type: String },
    expiryDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
