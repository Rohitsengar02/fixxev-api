const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get notifications by recipient
router.get('/:recipientType/:recipientId', async (req, res) => {
    try {
        const { recipientType, recipientId } = req.params;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = { recipientType, recipientId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.json({
            notifications,
            total,
            unreadCount,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
});

// Get unread count
router.get('/count/:recipientType/:recipientId', async (req, res) => {
    try {
        const { recipientType, recipientId } = req.params;
        const count = await Notification.countDocuments({
            recipientType,
            recipientId,
            isRead: false
        });
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get count', error: error.message });
    }
});

// Mark single notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark as read', error: error.message });
    }
});

// Mark all as read for recipient
router.put('/read-all/:recipientType/:recipientId', async (req, res) => {
    try {
        const { recipientType, recipientId } = req.params;
        await Notification.updateMany(
            { recipientType, recipientId, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete notification', error: error.message });
    }
});

// Create notification (internal/admin use)
router.post('/', async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();

        // Emit via socket
        const io = req.app.get('io');
        if (io) {
            const { recipientType, recipientId } = notification;
            if (recipientType === 'admin') {
                io.to('admin').emit('notification', notification);
            } else {
                io.to(`${recipientType}_${recipientId}`).emit('notification', notification);
            }
        }

        // Send FCM Push Notification
        const { sendPushNotification } = require('../utils/push_notifications');
        sendPushNotification(
            notification.recipientId,
            notification.title,
            notification.message,
            notification.data || {},
            notification.recipientType
        );

        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create notification', error: error.message });
    }
});

module.exports = router;
