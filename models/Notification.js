const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientType: {
        type: String,
        enum: ['user', 'franchise', 'admin'],
        required: true
    },
    recipientId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'booking_created',
            'booking_confirmed',
            'booking_in_progress',
            'booking_completed',
            'booking_cancelled',
            'booking_updated',
            'payment_received',
            'system_alert'
        ],
        required: true
    },
    relatedBookingId: {
        type: String,
        ref: 'Booking'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
