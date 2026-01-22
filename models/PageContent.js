const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
    pageName: { type: String, required: true, unique: true }, // 'home', 'about', etc.
    content: { type: Map, of: mongoose.Schema.Types.Mixed }, // Arbitrary JSON content
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PageContent', pageContentSchema);
