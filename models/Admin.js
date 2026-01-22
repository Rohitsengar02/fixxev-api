const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    name: { type: String, default: 'Admin' },
    email: { type: String, required: true, unique: true, default: 'admin@fixxev.com' },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' }
}, { timestamps: true });

// Hash password before saving
AdminSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

AdminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
