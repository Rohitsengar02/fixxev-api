const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: String, required: true }, // Keeping as string for 'Various' cases, or use Number
    stock: { type: String, required: true },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
    image: { type: String },
    features: [{ type: String }],
    subtitle: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
