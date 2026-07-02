const Queue = require('bull');
const { getRedisClient } = require('../../config/redis');
const { incQueueJob, setQueueDepth } = require('../../config/metrics');

const platformSyncQueue = new Queue('platform-sync', {
    createClient: (type) => getRedisClient(type),
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 7000 },
        removeOnComplete: 200,
        removeOnFail: 200,
    },
});

platformSyncQueue.on('active', () => incQueueJob('platform-sync', 'active'));
platformSyncQueue.on('completed', () => incQueueJob('platform-sync', 'completed'));
platformSyncQueue.on('failed', () => incQueueJob('platform-sync', 'failed'));

if (process.env.METRICS_ENABLED !== '0') {
    const updateQueueDepth = async () => {
        try {
            const counts = await platformSyncQueue.getJobCounts();
            Object.entries(counts).forEach(([state, value]) => setQueueDepth('platform-sync', state, value));
        } catch (_) { /* ignore */ }
    };
    const interval = setInterval(updateQueueDepth, 15000);
    interval.unref();
}

module.exports = platformSyncQueue;

