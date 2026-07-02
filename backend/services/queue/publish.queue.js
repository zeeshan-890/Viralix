const Queue = require('bull');
const { getRedisClient } = require('../../config/redis');
const { incQueueJob, setQueueDepth } = require('../../config/metrics');

// Create the publishing queue
const publishQueue = new Queue('social-publish', {
    createClient: (type) => getRedisClient(type),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000 // 5s, 10s, 20s
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200      // Keep last 200 failed jobs for inspection
    }
});

// Queue events
publishQueue.on('error', (error) => {
    console.error('Bull Queue Error:', error);
});

publishQueue.on('active', (job) => {
    console.log(`Job ${job.id} started processing (User: ${job.data.userId})`);
    incQueueJob('social-publish', 'active');
});

publishQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed!`);
    incQueueJob('social-publish', 'completed');
});

publishQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
    incQueueJob('social-publish', 'failed');
});

if (process.env.METRICS_ENABLED !== '0') {
    const updateQueueDepth = async () => {
        try {
            const counts = await publishQueue.getJobCounts();
            Object.entries(counts).forEach(([state, value]) => {
                setQueueDepth('social-publish', state, value);
            });
        } catch (error) {
            console.error('[QueueMetrics] Failed to read queue depth:', error.message);
        }
    };

    const interval = setInterval(updateQueueDepth, 15000);
    interval.unref();
}

module.exports = publishQueue;
