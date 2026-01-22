const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Fixxev' },
    companyName: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    gstNumber: { type: String },
    maintenanceMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    socialLinks: {
        facebook: { type: String },
        twitter: { type: String },
        instagram: { type: String },
        linkedin: { type: String }
    },
    theme: {
        primaryColor: { type: String, default: '#437BDC' },   // Electric Blue
        secondaryColor: { type: String, default: '#2BC155' }, // Fresh Green
        accentColor: { type: String, default: '#4E8AFF' },    // Vibrant Blue
        backgroundColor: { type: String, default: '#FFFFFF' },
        cardColor: { type: String, default: '#F7F9FC' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
