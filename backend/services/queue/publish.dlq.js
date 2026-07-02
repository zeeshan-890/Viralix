const Queue = require('bull');
const { getRedisClient } = require('../../config/redis');
const { incQueueJob, setQueueDepth } = require('../../config/metrics');

const publishDlq = new Queue('social-publish-dlq', {
    createClient: (type) => getRedisClient(type),
    defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 500,
    },
});

publishDlq.on('completed', () => incQueueJob('social-publish-dlq', 'completed'));
publishDlq.on('failed', () => incQueueJob('social-publish-dlq', 'failed'));

if (process.env.METRICS_ENABLED !== '0') {
    const updateQueueDepth = async () => {
        try {
            const counts = await publishDlq.getJobCounts();
            Object.entries(counts).forEach(([state, value]) => {
                setQueueDepth('social-publish-dlq', state, value);
            });
        } catch (_) { /* ignore */ }
    };
    const interval = setInterval(updateQueueDepth, 15000);
    interval.unref();
}

module.exports = publishDlq;
