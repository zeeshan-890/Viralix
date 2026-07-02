const Queue = require('bull');
const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../../config/redis');
const { incQueueJob, setQueueDepth } = require('../../config/metrics');
const publishDlq = require('./publish.dlq');
const PublishDlqJob = require('../../models/PublishDlqJob');
const PublishJob = require('../../models/PublishJob');
const { log, serializeError } = require('../../utils/logger');

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

publishQueue.on('failed', async (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
    incQueueJob('social-publish', 'failed');

    const maxAttempts = job.opts?.attempts || 3;
    if (!job || job.attemptsMade < maxAttempts) return;

    try {
        const dlqJobId = uuidv4();
        await publishDlq.add({
            ...job.data,
            dlqJobId,
            originalQueueJobId: job.id,
            error: err.message,
            deadLetteredAt: new Date().toISOString(),
        });

        await PublishDlqJob.findOneAndUpdate(
            { publishJobId: job.data?.jobId },
            {
                dlqJobId,
                publishJobId: job.data?.jobId,
                userId: job.data?.userId,
                queueJobId: String(job.id),
                payload: job.data,
                error: err.message,
                status: 'dead_lettered',
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (job.data?.jobId) {
            await PublishJob.updateOne(
                { jobId: job.data.jobId },
                {
                    $set: { status: 'failed', error: `Moved to DLQ: ${err.message}` },
                    $push: { logs: { level: 'error', message: 'Job moved to dead-letter queue after retries exhausted' } },
                }
            );
        }

        incQueueJob('social-publish-dlq', 'dead_lettered');
        log('error', 'publish job moved to dlq', {
            publishJobId: job.data?.jobId,
            queueJobId: String(job.id),
            error: serializeError(err),
        });
    } catch (dlqError) {
        log('error', 'failed to move publish job to dlq', {
            publishJobId: job.data?.jobId,
            error: serializeError(dlqError),
        });
    }
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
