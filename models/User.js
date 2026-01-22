const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: String,
    photoURL: String,
    phoneNumber: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profileSetupCompleted: {
        type: Boolean,
        default: false
    },
    fcmToken: {
        type: String,
        default: null
    },
    addresses: [{
        label: {
            type: String,
            default: 'Home'
        },
        line1: {
            type: String,
            required: true
        },
        line2: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
