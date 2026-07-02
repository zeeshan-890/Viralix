const Queue = require('bull');
const { getRedisClient } = require('../../config/redis');
const { incQueueJob, setQueueDepth } = require('../../config/metrics');

const analyticsRefreshQueue = new Queue('analytics-refresh', {
    createClient: (type) => getRedisClient(type),
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: 200,
        removeOnFail: 200,
    },
});

analyticsRefreshQueue.on('active', () => incQueueJob('analytics-refresh', 'active'));
analyticsRefreshQueue.on('completed', () => incQueueJob('analytics-refresh', 'completed'));
analyticsRefreshQueue.on('failed', () => incQueueJob('analytics-refresh', 'failed'));

if (process.env.METRICS_ENABLED !== '0') {
    const updateQueueDepth = async () => {
        try {
            const counts = await analyticsRefreshQueue.getJobCounts();
            Object.entries(counts).forEach(([state, value]) => setQueueDepth('analytics-refresh', state, value));
        } catch (_) { /* ignore */ }
    };
    const interval = setInterval(updateQueueDepth, 15000);
    interval.unref();
}

module.exports = analyticsRefreshQueue;

