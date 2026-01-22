const admin = require('firebase-admin');
const User = require('../models/User');

const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        if (admin.apps.length === 0) {
            console.log('Firebase Admin not initialized. Skipping notification for user:', userId);
            return false;
        }

        const user = await User.findOne({ uid: userId });

        if (!user || !user.fcmToken) {
            console.log(`No FCM token found for user ${userId}`);
            return false;
        }

        const message = {
            notification: {
                title,
                body,
            },
            token: user.fcmToken,
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        };

        const response = await admin.messaging().send(message);
        console.log(`Successfully sent message: ${response} to user ${user.email}`);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

module.exports = { sendPushNotification };
