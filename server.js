// Sync version: 1.0.2
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Make io available to routes
app.set('io', io);

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join rooms based on user type
    socket.on('join', (data) => {
        const { type, id } = data;
        if (type === 'user') {
            socket.join(`user_${id}`);
            console.log(`User ${id} joined room user_${id}`);
        } else if (type === 'franchise') {
            socket.join(`franchise_${id}`);
            console.log(`Franchise ${id} joined room franchise_${id}`);
        } else if (type === 'admin') {
            socket.join('admin');
            console.log('Admin joined admin room');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
const servicesRouter = require('./routes/services');
const teamRouter = require('./routes/team');
const productsRouter = require('./routes/products');

app.use('/api/services', servicesRouter);
app.use('/api/team', teamRouter);
app.use('/api/products', productsRouter);
app.use('/api/blog', require('./routes/blog'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/media', require('./routes/media'));
app.use('/api/page-content', require('./routes/pageContent'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/about-sections', require('./routes/aboutSections'));
app.use('/api/franchise-types', require('./routes/franchiseTypes'));
app.use('/api/ckd-features', require('./routes/ckdFeatures'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/franchises', require('./routes/franchises'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/expert-tips', require('./routes/tips'));
app.use('/api/analytics', require('./routes/analytics'));

// Seed Default Admin
const Admin = require('./models/Admin');
const seedAdmin = async () => {
    try {
        let admin = await Admin.findOne({ email: 'admin@fixxev.com' });
        if (!admin) {
            admin = new Admin({
                name: 'Admin',
                email: 'admin@fixxev.com',
                password: 'admin123'
            });
            await admin.save();
            console.log('Default Admin seeded with new password');
        } else {
            admin.password = 'admin123';
            admin.markModified('password');
            await admin.save();
            console.log('Default Admin password updated to admin123 and hashed');
        }
    } catch (e) {
        console.log('Error seeding admin:', e);
    }
};
seedAdmin();

app.get('/', (req, res) => {
    res.send('Fixxev Backend API');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.IO enabled for real-time notifications');
});
