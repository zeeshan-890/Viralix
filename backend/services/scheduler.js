const Post = require('../models/Post');
const PublishJob = require('../models/PublishJob');
const publishQueue = require('./queue/publish.queue'); // Import the queue
const { v4: uuidv4 } = require('uuid');
const { randomUUID } = require('crypto');
const { getRedisClient } = require('../config/redis');
const { acquireSchedulerLock, renewSchedulerLock, releaseSchedulerLock } = require('./schedulerLock');
const { log, serializeError } = require('../utils/logger');
const { incSchedulerLockEvent } = require('../config/metrics');

const SCHEDULER_LOCK_KEY = process.env.SCHEDULER_LOCK_KEY || 'viralix:scheduler:lock';
const SCHEDULER_LOCK_TTL_MS = Number(process.env.SCHEDULER_LOCK_TTL_MS || 55000);
const SCHEDULER_LOCK_HEARTBEAT_MS = Number(process.env.SCHEDULER_LOCK_HEARTBEAT_MS || 15000);

/**
 * Find due posts and enqueue them for publishing
 * @param {Date} now - Current timestamp
 */
async function scheduleDuePosts(now = new Date()) {
    log('info', 'scheduler scan started', { runAt: now.toISOString() });

    // Find posts that are:
    // 1. Scheduled (isScheduled: true)
    // 2. Due (scheduledDate <= now)
    // 3. Not yet published (we check platform statuses)
    //    Actually, usually we check if the post has *any* platform that is 'scheduled'

    // Note: The previous logic might have been simpler. Let's look for "isScheduled: true" and "scheduledDate <= now"
    // and where platforms need action.

    const duePosts = await Post.find({
        isScheduled: true,
        scheduledDate: { $lte: now },
        // Ensure we don't pick up posts that are already fully processed
        // A simple check is "isDraft: false" (which is implied by isScheduled)
        // We need to avoid reprocessing. 
        // Previously, the system might have updated the status to 'published' or similar.
        // Let's filter by: has at least one platform with status 'scheduled'
        'platforms.status': 'scheduled'
    });

    if (duePosts.length === 0) return 0;

    log('info', 'scheduler due posts found', { duePosts: duePosts.length });
    let count = 0;

    for (const post of duePosts) {
        try {
            const jobId = uuidv4();

            // 1. Create Job
            const job = new PublishJob({
                jobId,
                userId: post.user,
                postId: post._id, // Link to parent post
                platforms: post.platforms.filter(p => p.status === 'scheduled').map(p => ({
                    name: p.name,
                    accountId: p.accountId,
                    accountName: p.label || p.name,
                    status: 'pending'
                })),
                content: {
                    title: post.title,
                    body: post.content,
                    media: post.media,
                    tiktokSettings: post.tiktokSettings
                },
                status: 'queued'
            });
            await job.save();

            // 2. Add to Queue
            await publishQueue.add({
                jobId,
                userId: post.user,
                traceId: randomUUID(),
                postId: post._id, // Critical for status updates
                platforms: post.platforms,
                content: {
                    title: post.title,
                    body: post.content,
                    media: post.media,
                    tiktokSettings: post.tiktokSettings
                }
            });

            // 3. Update Post Status to prevent re-picking
            // Mark these platforms as 'processing' or 'queued'
            // We'll use 'processing' to indicate the system has picked it up
            post.platforms.forEach(p => {
                if (p.status === 'scheduled') {
                    p.status = 'processing';
                }
            });
            await post.save();
            count++;

        } catch (e) {
            log('error', 'scheduler enqueue failed', {
                postId: String(post._id),
                error: serializeError(e),
            });
        }
    }

    return count;
}

async function runScheduleWithLock(now = new Date(), deps = {}) {
    const redis = deps.redis || getRedisClient();
    const lockKey = deps.lockKey || SCHEDULER_LOCK_KEY;
    const lockTtlMs = deps.lockTtlMs || SCHEDULER_LOCK_TTL_MS;
    const heartbeatMs = deps.heartbeatMs || SCHEDULER_LOCK_HEARTBEAT_MS;
    const logger = deps.logger || console;

    let token;
    let heartbeat;
    try {
        token = await acquireSchedulerLock(redis, lockKey, lockTtlMs);
        if (!token) {
            incSchedulerLockEvent('miss');
            logger.log('[Scheduler] Skipping cycle; lock is held by another instance');
            return { acquired: false, enqueued: 0 };
        }
        incSchedulerLockEvent('acquire');

        heartbeat = setInterval(async () => {
            try {
                const renewed = await renewSchedulerLock(redis, lockKey, token, lockTtlMs);
                if (!renewed) {
                    incSchedulerLockEvent('renew_miss');
                    logger.warn('[Scheduler] Lock renew failed; another instance may take over');
                } else {
                    incSchedulerLockEvent('renew_ok');
                }
            } catch (error) {
                incSchedulerLockEvent('renew_error');
                logger.error('[Scheduler] Lock renew error:', error.message);
            }
        }, heartbeatMs);

        const enqueued = await scheduleDuePosts(now);
        return { acquired: true, enqueued };
    } catch (error) {
        incSchedulerLockEvent('error');
        logger.error('[Scheduler] Lock flow error:', error.message);
        return { acquired: false, enqueued: 0, error: error.message };
    } finally {
        if (heartbeat) clearInterval(heartbeat);
        if (token) {
            try {
                await releaseSchedulerLock(redis, lockKey, token);
                incSchedulerLockEvent('release');
            } catch (error) {
                incSchedulerLockEvent('release_error');
                logger.error('[Scheduler] Lock release error:', error.message);
            }
        }
    }
}

module.exports = {
    scheduleDuePosts,
    runScheduleWithLock,
};
