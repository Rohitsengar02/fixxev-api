const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    url: { type: String, required: true },
    public_id: { type: String },
    fileName: { type: String },
    fileType: { type: String }, // image, video, etc
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);
