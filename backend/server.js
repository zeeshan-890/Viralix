const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// const rateLimit = require('express-rate-limit'); // Moved to middleware
const { URL } = require('url');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Heroku / reverse proxy support so req.ip & rate limiting work correctly and
// express-rate-limit does not throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
// Trust only the first proxy hop (Heroku router) which preserves client IP in X-Forwarded-For.
app.set('trust proxy', 1);

// Security middleware with enhanced configuration
app.use(helmet({
    contentSecurityPolicy: false, // Disable default CSP for OAuth redirects
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' }
}));

// Rate Limiting
const { limiter, authLimiter } = require('./middleware/rateLimiter');
app.use(limiter);
app.use('/api/auth', authLimiter);

// ---------------------------------------------------------------------------
// CORS configuration (supports multiple origins & trailing-slash normalization)
// For production with a different frontend domain (e.g., www.viralix.dev) and
// backend domain (e.g., *.herokuapp.com), we must allow credentials and echo
// the exact Origin. SameSite=None cookies are required for cross-site.
// ---------------------------------------------------------------------------
const CLIENT_URL = process.env.CLIENT_URL || 'https://www.viralix.dev';
let ALLOWED = [
    'https://viralix.dev',
    'https://www.viralix.dev',
    'https://client-autoreach-ai-gs1k.vercel.app',
    CLIENT_URL
].filter(Boolean).map(o => o.replace(/\/$/, ''));

if (process.env.CORS_ALLOWED_ORIGINS) {
    process.env.CORS_ALLOWED_ORIGINS.split(',').forEach(o => {
        const cleaned = o.trim().replace(/\/$/, '');
        if (cleaned && !ALLOWED.includes(cleaned)) ALLOWED.push(cleaned);
    });
}

// In production, optionally also allow local development origins for testing
if (process.env.ALLOW_LOCAL_DEV !== '0') {
    ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach(dev => {
        if (!ALLOWED.includes(dev)) ALLOWED.push(dev);
    });
}

console.log('🌐 CORS Allowed Origins:', ALLOWED);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true); // Non-browser / same-origin
        const normalized = origin.replace(/\/$/, '');

        // Check static allowed origins
        if (ALLOWED.includes(normalized)) return cb(null, true);

        // Allow Vercel preview deployments for this project
        if (normalized.match(/^https:\/\/client-autoreach-ai.*\.vercel\.app$/)) {
            return cb(null, true);
        }

        console.warn('[CORS] Blocked origin', origin);
        return cb(new Error('CORS: Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept', 'Origin']
}));

// Manual OPTIONS fallback (some hosts need explicit 204)
app.options('*', (req, res) => {
    const origin = req.headers.origin && req.headers.origin.replace(/\/$/, '');
    if (origin && (ALLOWED.includes(origin) || origin.match(/^https:\/\/client-autoreach-ai.*\.vercel\.app$/))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-auth-token,Accept,Origin');
    }
    return res.sendStatus(204);
});

// Helper to expose cookie option logic (used by auth routes via require cache)
const isProd = process.env.NODE_ENV === 'production';
let clientHost = 'localhost';
try { clientHost = new URL(CLIENT_URL).hostname; } catch (_) { }
// If backend host differs from client host, we must use SameSite=None
function computeCookieOptions() {
    // Heroku dynamic host; derive from request later if needed
    const sameSite = isProd && process.env.ENFORCE_SAMESITE_STRICT !== '1'
        ? 'none' // safer for cross-site
        : (isProd ? 'strict' : 'lax');
    return {
        httpOnly: true,
        secure: isProd, // must be true for SameSite=None
        sameSite,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
}
// Make available to routes (require('./server').cookieOptions()) if desired
app.set('cookieOptions', computeCookieOptions);

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
    app.use('/api/instagram-oauth', require('./routes/instagram-oauth'));
    app.use('/api/instagram-insights', require('./routes/instagram-insights'));
    app.use('/api/instagram-auto-reply', require('./routes/instagram-auto-reply'));
    app.use('/api/facebook-auto-reply', require('./routes/facebook-auto-reply'));
} catch (e) {
    console.warn('Instagram routes not mounted yet:', e.message);
}
try {
    app.use('/api/tiktok-oauth', require('./routes/tiktok-oauth'));
    console.log('🎵 TikTok OAuth routes mounted');
} catch (e) {
    console.warn('TikTok routes not mounted yet:', e.message);
}
try {
    app.use('/api/youtube-oauth', require('./routes/youtube-oauth'));
    console.log('📺 YouTube OAuth routes mounted');
} catch (e) {
    console.warn('YouTube routes not mounted yet:', e.message);
}

app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));

// New Feature Routes
try {
    app.use('/api/analytics', require('./routes/best-times'));
    console.log('📊 Best Time to Post routes mounted');
} catch (e) {
    console.warn('Best-times routes not mounted:', e.message);
}
try {
    app.use('/api/comments', require('./routes/comments'));
    console.log('💬 Comment Sentiment routes mounted');
} catch (e) {
    console.warn('Comment routes not mounted:', e.message);
}
try {
    app.use('/api/links', require('./routes/links'));
    console.log('🔗 Link Shortener routes mounted');
} catch (e) {
    console.warn('Link routes not mounted:', e.message);
}
try {
    app.use('/api/keyword-alerts', require('./routes/keyword-alerts'));
    console.log('🔔 Keyword Alerts routes mounted');
} catch (e) {
    console.warn('Keyword alerts routes not mounted:', e.message);
}
try {
    app.use('/api/team', require('./routes/team'));
    console.log('👥 Team Collaboration routes mounted');
} catch (e) {
    console.warn('Team routes not mounted:', e.message);
}
try {
    app.use('/api/watermark', require('./routes/watermark'));
    console.log('🎨 Watermark routes mounted');
} catch (e) {
    console.warn('Watermark routes not mounted:', e.message);
}
try {
    app.use('/api/bulk-upload', require('./routes/bulk-upload'));
    console.log('📋 Bulk Upload routes mounted');
} catch (e) {
    console.warn('Bulk upload routes not mounted:', e.message);
}
try {
    app.use('/api/inbox', require('./routes/inbox'));
    console.log('📥 Unified Inbox routes mounted');
} catch (e) {
    console.warn('Inbox routes not mounted:', e.message);
}
try {
    app.use('/api/competitors', require('./routes/competitors'));
    console.log('🏆 Competitor Analysis routes mounted');
} catch (e) {
    console.warn('Competitor routes not mounted:', e.message);
}
try {
    app.use('/api/hashtag-research', require('./routes/hashtag-research'));
    console.log('#️⃣  Hashtag Research routes mounted');
} catch (e) {
    console.warn('Hashtag research routes not mounted:', e.message);
}

try {
    app.use('/api/ai-calendar', require('./routes/ai-calendar'));
    console.log('📅 AI Calendar routes mounted');
} catch (e) {
    console.warn('AI Calendar routes not mounted:', e.message);
}

try {
    app.use('/api/bio-pages', require('./routes/bio-pages'));
    console.log('🔗 Bio Pages routes mounted');
} catch (e) {
    console.warn('Bio pages routes not mounted:', e.message);
}

try {
    app.use('/api/platform-sync', require('./routes/platform-sync'));
    console.log('🔄 Platform sync routes mounted');
} catch (e) {
    console.warn('Platform sync routes not mounted:', e.message);
}

try {
    app.use('/api/facebook', require('./routes/facebook-insights'));
    console.log('📘 Facebook Insights routes mounted');
} catch (e) {
    console.warn('Facebook Insights routes not mounted:', e.message);
}
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

// CORS debug endpoint (DO NOT expose in production unless needed)
app.get('/api/cors/debug', (req, res) => {
    res.json({
        requested_origin: req.headers.origin || null,
        allowed_origins: ALLOWED,
        client_url_env: CLIENT_URL,
        note: 'To add production domain set CORS_ALLOWED_ORIGINS env (comma separated) or CLIENT_URL. Restart server after changes.'
    });
});

// Public short link redirect handler (Feature 4: Link Shortener)
const ShortLink = require('./models/ShortLink');
app.get('/l/:slug', async (req, res) => {
    try {
        const link = await ShortLink.findOneAndUpdate(
            { slug: req.params.slug, isActive: true },
            {
                $inc: { clicks: 1 },
                $push: {
                    clickLog: {
                        $each: [{
                            timestamp: new Date(),
                            referrer: req.get('referrer') || null,
                            userAgent: req.get('user-agent') || null,
                            ip: req.ip
                        }],
                        $slice: -1000 // Keep last 1000 clicks to avoid unbounded growth
                    }
                }
            },
            { new: true }
        );
        if (!link) return res.status(404).json({ message: 'Link not found or inactive' });
        return res.redirect(301, link.originalUrl);
    } catch (error) {
        console.error('[ShortLink] Redirect error:', error.message);
        return res.status(500).json({ message: 'Server error' });
    }
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

// Start server with optional Socket.io
const http = require('http');
const server = http.createServer(app);

try {
    const { Server } = require('socket.io');
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        // Authenticate and join user room
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`[Socket.io] ${socket.id} joined room user:${userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    // Store io on app for routes/inbox.js to use
    app.set('io', io);
    console.log('🔌 Socket.io initialized for real-time inbox');
} catch (e) {
    console.warn('Socket.io not available (install with: npm i socket.io):', e.message);
}

server.listen(PORT, () => {
    console.log(`🚀 AutoReach AI Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

try {
    // Start background workers
    require('./services/queue/publish.worker');
    console.log('👷 Background workers started');
} catch (error) {
    console.error('⚠️ Failed to start background workers:', error.message);
    console.error('⚠️ Worker startup error stack:', error.stack);
}

// Start lightweight scheduler using node-cron to publish due posts
try {
    const cron = require('node-cron');
    const { scheduleDuePosts } = require('./services/scheduler');
    cron.schedule('* * * * *', async () => {
        try {
            const count = await scheduleDuePosts(new Date());
            if (count > 0) {
                console.log(`📣 Scheduler enqueued ${count} due post(s)`);
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
