const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Draft', 'Inactive'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
