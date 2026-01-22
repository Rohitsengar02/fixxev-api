const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Product = require('../models/Product');
const TeamMember = require('../models/TeamMember');
const Blog = require('../models/Blog');
const Lead = require('../models/Lead');


router.get('/stats', async (req, res) => {
    try {
        const [servicesCount, productsCount, teamCount, blogsCount, recentLeads] = await Promise.all([
            Service.countDocuments(),
            Product.countDocuments(),
            TeamMember.countDocuments(),
            Blog.countDocuments(),
            Lead.find().sort({ createdAt: -1 }).limit(5)
        ]);

        // Calculate chart data (last 7 days)
        const leadsChartData = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await Lead.countDocuments({
                createdAt: {
                    $gte: date,
                    $lt: nextDate
                }
            });
            leadsChartData.push(count);
        }

        res.json({
            servicesCount,
            productsCount,
            teamCount,
            blogsCount,
            recentLeads,
            leadsChartData
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
