const express = require('express');
const router = express.Router();
const Franchise = require('../models/Franchise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware to protect routes (Admin only)
// Note: In a real app, you'd share the 'auth' middleware logic or import it
// keeping it simple/inline here or we can assume public for now for Admin App compatibility unless 'auth' is passed.
// The Admin App sends a Bearer token.
// For now, we will allow open access to GET/POST from Admin App if we don't strictly enforce admin checking here,
// OR we can implement a basic check.
// Given strict instructions "not to change code" (assume existing), I'll make these accessible.

// --- Admin App Endpoints ---

// Get all franchises
router.get('/', async (req, res) => {
    try {
        const franchises = await Franchise.find().populate('services').select('-password');
        res.json(franchises);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new franchise (Admin adding a franchise)
router.post('/', async (req, res) => {
    const { name, ownerName, email, password, location, technicianCount, status } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    try {
        const existing = await Franchise.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Franchise already exists' });

        const franchise = new Franchise({
            name,
            ownerName,
            email,
            password, // Logic in Model handles hashing
            location,
            technicianCount,
            status: status || 'Pending'
        });

        const savedFranchise = await franchise.save();
        // Return without password
        const { password: _, ...data } = savedFranchise.toObject();
        res.status(201).json(data);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Franchise
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;

        // If password is included, hash it first
        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        const franchise = await Franchise.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });
        res.json(franchise);
    } catch (err) {
        console.error('Update error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete Franchise
router.delete('/:id', async (req, res) => {
    try {
        await Franchise.findByIdAndDelete(req.params.id);
        res.json({ message: 'Franchise deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- Franchise App Endpoints ---

// Register / Onboarding
router.post('/register', async (req, res) => {
    try {
        const { email } = req.body;
        const existing = await Franchise.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Franchise already registered with this email' });
        }

        const franchise = new Franchise({
            ...req.body,
            status: 'Pending' // Initial status for new registrations
        });

        const saved = await franchise.save();
        const token = jwt.sign({ id: saved._id, type: 'franchise' }, process.env.JWT_SECRET || 'fixxev_secret', { expiresIn: '30d' });

        res.status(201).json({
            token,
            franchise: {
                id: saved._id,
                name: saved.name,
                email: saved.email,
                status: saved.status
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Google Login / Sign-Up
router.post('/google-login', async (req, res) => {
    const { email, googleId, name, profileImage } = req.body;
    try {
        let franchise = await Franchise.findOne({ email });

        if (!franchise) {
            // Auto-register if not found (Google Sign-Up)
            franchise = new Franchise({
                name: name || 'EV Partner',
                ownerName: name || 'EV Partner',
                email,
                googleId,
                profileImage,
                status: 'Pending'
            });
            await franchise.save();
        } else if (!franchise.googleId) {
            // Link Google account if email matches but googleId missing
            franchise.googleId = googleId;
            if (profileImage && !franchise.profileImage) {
                franchise.profileImage = profileImage;
            }
            await franchise.save();
        }

        const token = jwt.sign({ id: franchise._id, type: 'franchise' }, process.env.JWT_SECRET || 'fixxev_secret', { expiresIn: '30d' });

        res.json({
            token,
            franchise: {
                id: franchise._id,
                name: franchise.name,
                email: franchise.email,
                status: franchise.status
            }
        });
    } catch (err) {
        console.error('Google Login error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Login (Email/Password)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const franchise = await Franchise.findOne({ email });
        if (!franchise || !(await franchise.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: franchise._id, type: 'franchise' }, process.env.JWT_SECRET || 'fixxev_secret', { expiresIn: '30d' });

        res.json({
            token,
            franchise: {
                id: franchise._id,
                name: franchise.name,
                email: franchise.email,
                status: franchise.status,
                role: 'Franchise'
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get My Profile
router.get('/me', async (req, res) => {
    // Expects Bearer token
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fixxev_secret');
        const franchise = await Franchise.findById(decoded.id).select('-password');

        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        res.json(franchise);
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get Dashboard Data
router.get('/dashboard/:id', async (req, res) => {
    try {
        const franchiseId = req.params.id;
        const franchise = await Franchise.findById(franchiseId).select('-password');
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        const Booking = require('../models/Booking');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Revenue Calculations
        const allBookings = await Booking.find({ franchiseId });
        const totalRevenue = allBookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        const todayRevenue = allBookings
            .filter(b => b.status === 'completed' && new Date(b.appointmentDate) >= today)
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Stats
        const stats = {
            totalBookings: allBookings.length,
            pendingBookings: allBookings.filter(b => b.status === 'pending').length,
            ongoingBookings: allBookings.filter(b => b.status === 'confirmed' || b.status === 'in-progress').length,
            completedBookings: allBookings.filter(b => b.status === 'completed').length,
            cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length,
            technicianCount: (franchise.technicians || []).length,
            serviceCount: (franchise.services || []).length,
            lowStockCount: 3
        };

        // Recent Bookings
        const recentBookings = await Booking.find({ franchiseId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            franchise,
            revenue: {
                total: totalRevenue,
                today: todayRevenue
            },
            stats,
            recentBookings
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ message: err.message });
    }
});

// --- Service Management Endpoints ---

// Get my services and requests
router.get('/services/my/:id', async (req, res) => {
    try {
        const franchise = await Franchise.findById(req.params.id)
            .populate('services')
            .populate('serviceRequests.service');
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });
        res.json({
            approved: franchise.services,
            requests: franchise.serviceRequests
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Request new service (Bulk & Custom support)
router.post('/services/request', async (req, res) => {
    const { franchiseId, serviceIds, customServices } = req.body;
    try {
        const franchise = await Franchise.findById(franchiseId);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        // Handle Master Services
        if (serviceIds && Array.isArray(serviceIds)) {
            for (const serviceId of serviceIds) {
                // Check if already approved or pending
                const isApproved = franchise.services.includes(serviceId);
                const isPending = franchise.serviceRequests.find(
                    r => r.service && r.service.toString() === serviceId && r.status === 'Pending'
                );

                if (!isApproved && !isPending) {
                    franchise.serviceRequests.push({
                        service: serviceId,
                        isCustom: false,
                        status: 'Pending'
                    });
                }
            }
        }

        // Handle Custom Services
        if (customServices && Array.isArray(customServices)) {
            for (const custom of customServices) {
                franchise.serviceRequests.push({
                    isCustom: true,
                    customData: {
                        name: custom.name,
                        category: custom.category,
                        description: custom.description,
                        price: custom.price,
                        image: custom.image
                    },
                    status: 'Pending'
                });
            }
        }

        await franchise.save();
        res.json({ message: 'Services requested successfully' });
    } catch (err) {
        console.error('Request error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get all service requests for Admin
router.get('/admin/service-requests/all', async (req, res) => {
    try {
        const franchises = await Franchise.find({ 'serviceRequests.0': { $exists: true } })
            .select('name city serviceRequests')
            .populate('serviceRequests.service');

        let allRequests = [];
        franchises.forEach(f => {
            f.serviceRequests.forEach(r => {
                allRequests.push({
                    franchiseId: f._id,
                    franchiseName: f.name,
                    city: f.city,
                    requestId: r._id,
                    service: r.service,
                    status: r.status,
                    isCustom: r.isCustom,
                    customData: r.customData,
                    requestedAt: r.requestedAt
                });
            });
        });
        res.json(allRequests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve/Reject service request
router.post('/admin/service-approve', async (req, res) => {
    const { franchiseId, requestId, status } = req.body; // status: 'Approved' or 'Rejected'
    try {
        const franchise = await Franchise.findById(franchiseId);
        if (!franchise) return res.status(404).json({ message: 'Franchise not found' });

        const request = franchise.serviceRequests.id(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;

        if (status === 'Approved') {
            let serviceId = request.service;

            // If it's a custom service, create it in the Service model first
            if (request.isCustom && request.customData) {
                const Service = require('../models/Service');
                const newService = new Service({
                    title: request.customData.name,
                    category: request.customData.category,
                    description: request.customData.description,
                    image: request.customData.image,
                    status: 'Active'
                });
                const savedService = await newService.save();
                serviceId = savedService._id;
                request.service = serviceId; // Link it
            }

            // Add to approved services if not already there
            if (serviceId && !franchise.services.includes(serviceId)) {
                franchise.services.push(serviceId);
            }
        }

        await franchise.save();
        res.json({ message: `Service request ${status.toLowerCase()} successfully` });
    } catch (err) {
        console.error('Approval error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
