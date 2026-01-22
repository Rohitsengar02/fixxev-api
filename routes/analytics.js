const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Franchise = require('../models/Franchise');
const Service = require('../models/Service');

router.get('/admin-stats', async (req, res) => {
    try {
        const [
            totalBookings,
            totalUsers,
            totalFranchises,
            totalServices,
            allBookings,
            activeUsersLast7Days,
            franchises
        ] = await Promise.all([
            Booking.countDocuments(),
            User.countDocuments(),
            Franchise.countDocuments(),
            Service.countDocuments(),
            Booking.find(),
            User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
            Franchise.find().select('name rating revenue')
        ]);

        // 1. Revenue Calculations
        const totalRevenue = allBookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // 2. Booking Status Distribution
        const bookingStats = {
            pending: allBookings.filter(b => b.status === 'pending').length,
            confirmed: allBookings.filter(b => b.status === 'confirmed').length,
            inProgress: allBookings.filter(b => b.status === 'in-progress').length,
            completed: allBookings.filter(b => b.status === 'completed').length,
            cancelled: allBookings.filter(b => b.status === 'cancelled').length
        };

        // 3. Revenue Trends (Last 7 Days)
        const revenueTrends = [];
        const bookingsTrends = [];
        const labels = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            const dayBookings = allBookings.filter(b => {
                const bDate = new Date(b.appointmentDate);
                return bDate >= date && bDate < nextDate;
            });

            const dayRevenue = dayBookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

            revenueTrends.push(dayRevenue);
            bookingsTrends.push(dayBookings.length);
        }

        // 4. Top Franchises (by booking count for now, or revenue if stored)
        const franchisePerformance = franchises.map(f => {
            const fBookings = allBookings.filter(b => b.franchiseId == f._id.toString());
            const fRevenue = fBookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            return {
                name: f.name,
                bookings: fBookings.length,
                revenue: fRevenue,
                rating: f.rating || 0
            };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // 5. Popular Services
        const serviceMap = {};
        allBookings.forEach(b => {
            (b.services || []).forEach(s => {
                serviceMap[s.serviceName] = (serviceMap[s.serviceName] || 0) + 1;
            });
        });
        const popularServices = Object.entries(serviceMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 6. User Growth
        const userGrowth = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await User.countDocuments({ createdAt: { $gte: date, $lt: nextDate } });
            userGrowth.push(count);
        }

        // 7. Vehicle Distribution
        const vehicleMap = {};
        allBookings.forEach(b => {
            if (b.vehicleDetails && b.vehicleDetails.model) {
                const model = b.vehicleDetails.model;
                vehicleMap[model] = (vehicleMap[model] || 0) + 1;
            }
        });
        const vehicleDistribution = Object.entries(vehicleMap)
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            overview: {
                totalRevenue,
                totalBookings,
                totalUsers,
                totalFranchises,
                totalServices,
                newUsers7d: activeUsersLast7Days
            },
            bookingStats,
            trends: {
                labels,
                revenue: revenueTrends,
                bookings: bookingsTrends,
                userGrowth
            },
            performance: {
                franchises: franchisePerformance,
                services: popularServices,
                vehicles: vehicleDistribution
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
