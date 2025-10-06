const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
app.use(morgan('combined'));

// Routes
// Per-route logger for analytics endpoints
app.use('/api/analytics', (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    console.log('[REQ] analytics', { method, originalUrl, origin: req.headers?.origin, hasCookie: !!req.headers?.cookie });
    res.on('finish', () => {
        console.log('[RES] analytics', { method, originalUrl, status: res.statusCode, ms: Date.now() - start });
    });
    next();
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/facebook', require('./routes/facebook'));
app.use('/api/upload', require('./routes/upload'));
try {
    app.use('/api/instagram', require('./routes/instagram'));
} catch (e) {
    console.warn('Instagram routes not mounted yet:', e.message);
}
app.use('/api/posts', require('./routes/posts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
// app.use('/api/social', require('./routes/social'));
// app.use('/api/analytics', require('./routes/analytics'));
// app.use('/api/engagement', require('./routes/engagement'));
// app.use('/api/admin', require('./routes/admin'));
// app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'AutoReach AI Backend is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: 'The requested endpoint does not exist'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

// Database connection
const connectDB = require('./config/database');
connectDB();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AutoReach AI Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

// Start lightweight scheduler using node-cron to publish due posts
try {
    const cron = require('node-cron');
    const { publishDueScheduledPosts } = require('./services/publisher');
    cron.schedule('* * * * *', async () => {
        try {
            const count = await publishDueScheduledPosts(new Date());
            if (count > 0) {
                console.log(`📣 Scheduler published ${count} due post(s)`);
            }
        } catch (e) {
            console.error('Scheduler error:', e.message);
        }
    });
    console.log('⏱️  Scheduler started: running every minute');
} catch (e) {
    console.warn('Scheduler not started:', e.message);
}

module.exports = app;
