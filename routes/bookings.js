const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/push_notifications');

// Create new booking
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            franchiseId,
            services,
            appointmentDate,
            timeSlot,
            totalAmount,
            userDetails,
            franchiseDetails,
            vehicleDetails,
            address,
            notes
        } = req.body;

        const booking = new Booking({
            userId,
            franchiseId,
            services,
            appointmentDate,
            timeSlot,
            totalAmount,
            userDetails,
            franchiseDetails,
            vehicleDetails,
            address,
            notes,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await booking.save();

        // Create notifications for user, franchise, and admin
        const notifications = [
            {
                recipientType: 'user',
                recipientId: userId,
                title: 'Booking Confirmed',
                message: `Your booking #${booking.bookingId} has been created successfully.`,
                type: 'booking_created',
                relatedBookingId: booking.bookingId,
                data: { bookingId: booking.bookingId, franchiseName: franchiseDetails?.name }
            },
            {
                recipientType: 'franchise',
                recipientId: franchiseId,
                title: 'New Booking Received',
                message: `New booking #${booking.bookingId} from ${userDetails?.name || 'Customer'}`,
                type: 'booking_created',
                relatedBookingId: booking.bookingId,
                data: { bookingId: booking.bookingId, userName: userDetails?.name }
            },
            {
                recipientType: 'admin',
                recipientId: 'admin',
                title: 'New Booking Created',
                message: `Booking #${booking.bookingId} created at ${franchiseDetails?.name || 'Franchise'}`,
                type: 'booking_created',
                relatedBookingId: booking.bookingId,
                data: { bookingId: booking.bookingId }
            }
        ];

        await Notification.insertMany(notifications);

        // Emit socket events for real-time notifications
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('notification', notifications[0]);
            io.to(`franchise_${franchiseId}`).emit('notification', notifications[1]);
            io.to('admin').emit('notification', notifications[2]);
        }

        // Send Push Notification to User
        sendPushNotification(
            userId,
            'Booking Confirmed',
            `Your booking #${booking.bookingId} has been created successfully.`,
            { bookingId: booking.bookingId, type: 'booking_created' },
            'user'
        );

        // Send Push Notification to Franchise
        sendPushNotification(
            franchiseId,
            'New Booking Received',
            `New booking #${booking.bookingId} from ${userDetails?.name || 'Customer'}`,
            { bookingId: booking.bookingId, type: 'booking_created' },
            'franchise'
        );

        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Failed to create booking', error: error.message });
    }
});

// Get all bookings (admin)
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = status ? { status } : {};

        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        res.json({ bookings, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
});

// Get bookings by user
router.get('/user/:userId', async (req, res) => {
    try {
        const { status } = req.query;
        const query = { userId: req.params.userId };
        if (status) query.status = status;

        const bookings = await Booking.find(query).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user bookings', error: error.message });
    }
});

// Get bookings by franchise
router.get('/franchise/:franchiseId', async (req, res) => {
    try {
        const { status, date } = req.query;
        const query = { franchiseId: req.params.franchiseId };
        if (status) query.status = status;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.appointmentDate = { $gte: startDate, $lt: endDate };
        }

        const bookings = await Booking.find(query).sort({ appointmentDate: 1, timeSlot: 1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch franchise bookings', error: error.message });
    }
});

// Get single booking
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findOne({
            $or: [{ _id: req.params.id }, { bookingId: req.params.id }]
        });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
    }
});

// Update booking status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findOneAndUpdate(
            { $or: [{ _id: req.params.id }, { bookingId: req.params.id }] },
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Create notification for status update
        const statusMessages = {
            'confirmed': 'Your booking has been confirmed!',
            'in-progress': 'Your service is now in progress.',
            'completed': 'Your service has been completed. Thank you!',
            'cancelled': 'Your booking has been cancelled.'
        };

        const notification = new Notification({
            recipientType: 'user',
            recipientId: booking.userId,
            title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: statusMessages[status] || `Booking status updated to ${status}`,
            type: `booking_${status.replace('-', '_')}`,
            relatedBookingId: booking.bookingId,
            data: { bookingId: booking.bookingId, status }
        });

        await notification.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${booking.userId}`).emit('notification', notification);
            io.to(`user_${booking.userId}`).emit('booking_updated', { bookingId: booking.bookingId, status });
        }

        // Send FCM Push Notification
        sendPushNotification(
            booking.userId,
            notification.title,
            notification.message,
            {
                bookingId: booking.bookingId,
                type: 'booking_update',
                status: booking.status
            },
            'user'
        );

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update booking', error: error.message });
    }
});

// Cancel booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { $or: [{ _id: req.params.id }, { bookingId: req.params.id }] },
            { status: 'cancelled', updatedAt: new Date() },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Notify franchise and admin
        const notifications = [
            {
                recipientType: 'franchise',
                recipientId: booking.franchiseId,
                title: 'Booking Cancelled',
                message: `Booking #${booking.bookingId} has been cancelled by customer.`,
                type: 'booking_cancelled',
                relatedBookingId: booking.bookingId
            },
            {
                recipientType: 'admin',
                recipientId: 'admin',
                title: 'Booking Cancelled',
                message: `Booking #${booking.bookingId} cancelled at ${booking.franchiseDetails?.name}`,
                type: 'booking_cancelled',
                relatedBookingId: booking.bookingId
            }
        ];

        await Notification.insertMany(notifications);

        const io = req.app.get('io');
        if (io) {
            io.to(`franchise_${booking.franchiseId}`).emit('notification', notifications[0]);
            io.to('admin').emit('notification', notifications[1]);
        }

        res.json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
    }
});

// Get available time slots for a date
router.get('/slots/:franchiseId/:date', async (req, res) => {
    try {
        const { franchiseId, date } = req.params;
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const existingBookings = await Booking.find({
            franchiseId,
            appointmentDate: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelled'] }
        }).select('timeSlot');

        const bookedSlots = existingBookings.map(b => b.timeSlot);

        // Default time slots
        const allSlots = [
            '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
            '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
            '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
            '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
        ];

        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json({ availableSlots, bookedSlots });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch slots', error: error.message });
    }
});

module.exports = router;
