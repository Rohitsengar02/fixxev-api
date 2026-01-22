const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST api/users/sync
// @desc    Sync user data after Google Sign-In (Create or Update)
// @access  Public (should ideally use Firebase/JWT verify middleware)
router.post('/sync', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL, phoneNumber } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ message: 'UID and Email are required' });
        }

        let user = await User.findOne({ uid });

        if (user) {
            // Update existing user
            user.displayName = displayName || user.displayName;
            user.photoURL = photoURL || user.photoURL;
            user.phoneNumber = phoneNumber || user.phoneNumber;
            user.updatedAt = Date.now();
            await user.save();
            return res.status(200).json({ message: 'User updated', user });
        } else {
            // Create new user
            user = new User({
                uid,
                email,
                displayName,
                photoURL,
                phoneNumber
            });
            await user.save();
            return res.status(201).json({ message: 'User created', user });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/users
// @desc    Get all users
// @access  Public (should be Admin)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Address Management Routes

// Get all addresses for user
router.get('/addresses', async (req, res) => {
    try {
        const { uid } = req.query;
        console.log('GET /addresses - UID from query:', uid);

        if (!uid) {
            return res.status(400).json({ message: 'UID required' });
        }

        const user = await User.findOne({ uid });
        console.log('User found:', user ? 'YES' : 'NO', '- UID:', uid);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.addresses || []);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new address
router.post('/addresses', async (req, res) => {
    try {
        const { uid, label, line1, line2, city, state, pincode, isDefault } = req.body;

        if (!uid) {
            return res.status(400).json({ message: 'UID required' });
        }

        if (!line1 || !city || !state || !pincode) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If this is set as default, unset all other defaults
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        const newAddress = {
            label: label || 'Home',
            line1,
            line2: line2 || '',
            city,
            state,
            pincode,
            isDefault: isDefault || false
        };

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json(user.addresses[user.addresses.length - 1]);
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update address
router.put('/addresses/:id', async (req, res) => {
    try {
        const { uid, label, line1, line2, city, state, pincode, isDefault } = req.body;
        const addressId = req.params.id;

        if (!uid) {
            return res.status(400).json({ message: 'UID required' });
        }

        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If this is set as default, unset all other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                if (addr._id.toString() !== addressId) {
                    addr.isDefault = false;
                }
            });
        }

        address.label = label || address.label;
        address.line1 = line1 || address.line1;
        address.line2 = line2 !== undefined ? line2 : address.line2;
        address.city = city || address.city;
        address.state = state || address.state;
        address.pincode = pincode || address.pincode;
        address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

        await user.save();

        res.json(address);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete address
router.delete('/addresses/:id', async (req, res) => {
    try {
        const { uid } = req.query;
        const addressId = req.params.id;

        if (!uid) {
            return res.status(400).json({ message: 'UID required' });
        }

        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.addresses.pull({ _id: addressId });
        await user.save();

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/users/:uid
// @desc    Get user by UID
// @access  Public
// NOTE: This route must be LAST to avoid catching specific routes like /addresses
router.get('/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/users/dashboard/:uid
// @desc    Get user dashboard data
router.get('/dashboard/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const Booking = require('../models/Booking');
        const Franchise = require('../models/Franchise');
        const Service = require('../models/Service');
        const Vehicle = require('../models/Vehicle');
        const Settings = require('../models/Settings');
        const Offer = require('../models/Offer');
        const Tip = require('../models/Tip');

        // 1. User Vehicles
        const vehicles = await Vehicle.find({ userId: uid });
        const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0] || null;

        // 2. Ongoing Bookings (pending, confirmed, in-progress)
        const ongoingBookings = await Booking.find({
            userId: uid,
            status: { $in: ['pending', 'confirmed', 'in-progress'] }
        }).sort({ appointmentDate: 1 }).limit(2);

        // 3. Nearby Franchises (Just take 3 active ones for now)
        const nearbyCenters = await Franchise.find({ status: 'Active' }).limit(3);

        // 4. All Services
        const allServices = await Service.find({ status: 'Active' });

        // 5. App Settings
        const settings = await Settings.findOne() || {};

        // 6. Active Offers (limit 5)
        const offers = await Offer.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(5);

        // 7. Expert Tips (limit 5)
        const expertTips = await Tip.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(5);

        res.json({
            user: {
                displayName: user.displayName,
                photoURL: user.photoURL,
                addresses: user.addresses,
                defaultAddress: user.addresses.find(a => a.isDefault) || user.addresses[0] || null
            },
            vehicles,
            defaultVehicle,
            ongoingBookings,
            nearbyCenters,
            allServices,
            settings,
            offers,
            expertTips
        });
    } catch (err) {
        console.error('User Dashboard Error:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
