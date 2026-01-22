const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    franchiseId: {
        type: String,
        required: true
    },
    services: [{
        serviceId: String,
        serviceName: String,
        price: Number,
        duration: String,
        serviceImage: String
    }],
    appointmentDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    userDetails: {
        name: String,
        phone: String,
        email: String,
        image: String
    },
    franchiseDetails: {
        name: String,
        address: String,
        phone: String
    },
    vehicleDetails: {
        make: String,
        model: String,
        year: String,
        registrationNumber: String
    },
    address: {
        label: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    notes: String
}, {
    timestamps: true
});

// Auto-generate booking ID
// Using async function without next() to avoid "next is not a function" error
bookingSchema.pre('save', async function () {
    if (!this.bookingId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        // Use this.model() or this.constructor to get the model
        const count = await this.constructor.countDocuments();
        this.bookingId = `BK${year}${month}${(count + 1).toString().padStart(5, '0')}`;
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
