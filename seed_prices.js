const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

const updatePrices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const services = await Service.find();
        for (const service of services) {
            let price = 0;
            const title = service.title.toLowerCase();

            if (title.includes('battery')) price = 1200;
            else if (title.includes('charging') || title.includes('charger')) price = 850;
            else if (title.includes('brake')) price = 450;
            else if (title.includes('tire') || title.includes('tyre')) price = 1500;
            else if (title.includes('motor')) price = 2500;
            else if (title.includes('controller')) price = 1800;
            else price = 500; // Default price

            service.price = price;
            await service.save();
            console.log(`Updated ${service.title} with price ₹${price}`);
        }

        console.log('All services updated successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error updating prices:', err);
        process.exit(1);
    }
};

updatePrices();
