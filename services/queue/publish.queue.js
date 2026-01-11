const Queue = require('bull');
const { getRedisClient } = require('../../config/redis');

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
});

publishQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed!`);
});

publishQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = publishQueue;
