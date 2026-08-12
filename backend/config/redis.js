const Redis = require('ioredis');

// Parse REDIS_URL or use defaults
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const useTls = typeof redisUrl === 'string' && redisUrl.startsWith('rediss://');

const redisConfig = {
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,
    // Heroku Key-Value Store uses rediss:// with a self-signed cert chain
    ...(useTls
        ? {
            tls: { rejectUnauthorized: false },
            // Prefer IPv4 — Heroku Redis DNS can fail on IPv6-first lookups
            family: 4,
        }
        : {}),
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};

let client;
let subscriber;
let defaultClient;
let bclient;

function createConnection(label) {
    const conn = new Redis(redisUrl, redisConfig);
    conn.on('error', (err) => console.error(`Redis ${label} Error:`, err.message || err));
    conn.on('connect', () => console.log(`Redis ${label} Connected`));
    return conn;
}

function getRedisClient(type) {
    switch (type) {
        case 'client':
            if (!client) client = createConnection('Client');
            return client;
        case 'subscriber':
            if (!subscriber) subscriber = createConnection('Subscriber');
            return subscriber;
        case 'bclient':
            // Bull blocking client must be a dedicated connection
            if (!bclient) bclient = createConnection('BClient');
            return bclient;
        default:
            if (!defaultClient) defaultClient = createConnection('Default');
            return defaultClient;
    }
}

module.exports = {
    getRedisClient,
    redisUrl,
    async pingRedis() {
        if (!process.env.REDIS_URL) return 'not_configured';
        try {
            const redis = getRedisClient('client');
            const pong = await Promise.race([
                redis.ping(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('redis ping timeout')), 2500)),
            ]);
            return pong === 'PONG' ? 'connected' : 'degraded';
        } catch {
            return 'disconnected';
        }
    },
};
