const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Middleware to protect routes (optional for now as requested simple function)
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fixxev_secret');
        const admin = await Admin.findOne({ _id: decoded._id });
        if (!admin) throw new Error();
        req.admin = admin;
        next();
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Login
router.post('/login', async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        if (!admin || !(await admin.comparePassword(req.body.password))) {
            return res.status(401).send({ message: 'Invalid login credentials' });
        }
        const token = jwt.sign({ _id: admin._id.toString() }, process.env.JWT_SECRET || 'fixxev_secret');
        res.send({
            token,
            role: 'admin',
            name: admin.name || 'Admin',
            email: admin.email
        });
    } catch (e) {
        res.status(400).send({ message: e.message });
    }
});

// Get Profile
router.get('/profile', auth, async (req, res) => {
    res.send(req.admin);
});

// Update Profile (Name & Image)
router.patch('/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'profileImage'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.admin[update] = req.body[update]);
        await req.admin.save();
        res.send(req.admin);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
    try {
        const isMatch = await req.admin.comparePassword(req.body.oldPassword);
        if (!isMatch) {
            return res.status(400).send({ error: 'Current password does not match' });
        }
        req.admin.password = req.body.newPassword;
        await req.admin.save();
        res.send({ message: 'Password updated successfully' });
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;
