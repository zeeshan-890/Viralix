const Redis = require('ioredis');

// Parse REDIS_URL or use defaults
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const useTls = typeof redisUrl === 'string' && redisUrl.startsWith('rediss://');

const redisConfig = {
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,
    // Heroku Key-Value Store uses rediss:// with a self-signed cert chain
    ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

let client;
let subscriber;
let defaultClient;

function getRedisClient(type) {
    switch (type) {
        case 'client':
            if (!client) {
                client = new Redis(redisUrl, redisConfig);
                client.on('error', (err) => console.error('Redis Client Error:', err));
                client.on('connect', () => console.log('Redis Client Connected'));
            }
            return client;
        case 'subscriber':
            if (!subscriber) {
                subscriber = new Redis(redisUrl, redisConfig);
                subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
            }
            return subscriber;
        default:
            if (!defaultClient) {
                defaultClient = new Redis(redisUrl, redisConfig);
                defaultClient.on('error', (err) => console.error('Redis Default Error:', err));
            }
            return defaultClient;
    }
}

module.exports = {
    getRedisClient,
    redisUrl,
    async pingRedis() {
        if (!process.env.REDIS_URL) return 'not_configured';
        try {
            const pong = await Promise.race([
                getRedisClient().ping(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('redis ping timeout')), 2000)),
            ]);
            return pong === 'PONG' ? 'connected' : 'degraded';
        } catch {
            return 'disconnected';
        }
    },
};
