const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// @route   POST api/vehicles
// @desc    Add a new vehicle
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { userId, brand, model, year, plateNumber, vin, batteryCapacity, photoURL } = req.body;

        if (!userId || !brand || !model || !plateNumber) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // If it's the first vehicle, make it default
        const existingCount = await Vehicle.countDocuments({ userId });

        const vehicle = new Vehicle({
            userId,
            brand,
            model,
            year,
            plateNumber,
            vin,
            batteryCapacity,
            photoURL,
            isDefault: existingCount === 0
        });

        await vehicle.save();
        res.status(201).json(vehicle);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/vehicles/user/:userId
// @desc    Get all vehicles for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/vehicles/:id
// @desc    Update vehicle details
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/vehicles/:id
// @desc    Delete a vehicle
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        await vehicle.deleteOne();
        res.json({ message: 'Vehicle removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
