const admin = require('firebase-admin');
const User = require('../models/User');
const Franchise = require('../models/Franchise');

const sendPushNotification = async (recipientId, title, body, data = {}, recipientType = null) => {
    try {
        if (admin.apps.length === 0) {
            console.log('Firebase Admin not initialized. Skipping notification for:', recipientId);
            return false;
        }

        let token = null;
        let recipientEmail = '';

        if (recipientType === 'user' || !recipientType) {
            const user = await User.findOne({ uid: recipientId });
            if (user && user.fcmToken) {
                token = user.fcmToken;
                recipientEmail = user.email;
            }
        }

        if (!token && (recipientType === 'franchise' || !recipientType)) {
            // Try by _id or some other identifier? 
            // In bookings, franchiseId is usually the MongoDB _id.
            const franchise = await Franchise.findOne({
                $or: [{ _id: recipientId }, { email: recipientId }]
            });
            if (franchise && franchise.fcmToken) {
                token = franchise.fcmToken;
                recipientEmail = franchise.email;
            }
        }

        if (!token) {
            console.log(`No FCM token found for recipient ${recipientId}`);
            return false;
        }

        const message = {
            notification: {
                title,
                body,
            },
            token: token,
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        };

        const response = await admin.messaging().send(message);
        console.log(`Successfully sent message: ${response} to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

module.exports = { sendPushNotification };
