const mongoose = require('mongoose');

const TipSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Tip', TipSchema);
