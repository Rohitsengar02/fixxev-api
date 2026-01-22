const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DocumentSchema = new mongoose.Schema({
    name: { type: String },
    url: { type: String },
    type: { type: String }
}, { _id: false });

const FranchiseSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Business Name
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Sign-In
    googleId: { type: String }, // For Google Sign-In
    mobile: { type: String },
    address: { type: String },
    latitude: { type: Number, default: 0.0 },
    longitude: { type: Number, default: 0.0 },
    city: { type: String },
    pincode: { type: String },
    gstNumber: { type: String },
    yearsInBusiness: { type: String },
    category: { type: String },
    location: { type: String, default: '' },
    technicianCount: { type: Number, default: 0 },
    techCount: { type: Number, default: 0 }, // For root level updates from WorkshopStep
    workshopDetails: {
        workshopType: String,
        maxVehiclesPerDay: String,
        technicianCount: String,
        facilities: {
            pickupDrop: { type: Boolean, default: false },
            evCharging: { type: Boolean, default: false },
            spareParts: { type: Boolean, default: false },
            softwareDiagnostics: { type: Boolean, default: false }
        }
    },
    rating: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Active', 'Pending', 'Suspended', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    documents: [DocumentSchema],
    serviceWaitTime: { type: String },
    partsAvailability: { type: String },
    isCertified: { type: Boolean, default: false },
    agreedToTerms: { type: Boolean, default: false },
    agreedAt: { type: Date },
    applicationSubmittedAt: { type: Date },
    joinedDate: { type: Date, default: Date.now },
    profileImage: { type: String, default: '' },
    galleryImages: [{ type: String }],
    description: { type: String, default: '' },
    businessHours: [{
        day: String,
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false }
    }],
    additionalFeatures: [{
        name: String,
        value: { type: Boolean, default: false }
    }],
    technicians: [{
        name: String,
        specialization: String,
        experience: String,
        image: String,
        rating: { type: Number, default: 4.5 }
    }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    serviceRequests: [{
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        isCustom: { type: Boolean, default: false },
        customData: {
            name: String,
            category: String,
            description: String,
            price: Number,
            image: String
        },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        requestedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true, collection: 'franchisers' });

// Hash password before saving
FranchiseSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

FranchiseSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Franchise', FranchiseSchema);
