const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, default: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800' },
    excerpt: { type: String, required: true },
    content: { type: String }, // For full blog post later
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
