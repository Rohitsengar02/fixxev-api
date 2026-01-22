const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    category: { type: String, default: 'Our Core Team' }, // New Field
    image: { type: String, default: 'https://randomuser.me/api/portraits/men/1.jpg' },
    bio: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamMember', memberSchema);
