const Post = require('../models/Post');
const PublishJob = require('../models/PublishJob');
const publishQueue = require('./queue/publish.queue'); // Import the queue
const { v4: uuidv4 } = require('uuid');

/**
 * Find due posts and enqueue them for publishing
 * @param {Date} now - Current timestamp
 */
async function scheduleDuePosts(now = new Date()) {
    console.log(`[Scheduler] Checking for posts due before ${now.toISOString()}...`);

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

    console.log(`[Scheduler] Found ${duePosts.length} due post(s). Enqueueing...`);
    let count = 0;

    for (const post of duePosts) {
        try {
            const jobId = uuidv4();

            // 1. Create Job
            const job = new PublishJob({
                jobId,
                userId: post.user,
                platforms: post.platforms.filter(p => p.status === 'scheduled').map(p => ({
                    name: p.name,
                    accountId: p.accountId,
                    accountName: p.label || p.name,
                    status: 'pending'
                })),
                content: {
                    title: post.title,
                    body: post.content,
                    media: post.media
                },
                status: 'queued'
            });
            await job.save();

            // 2. Add to Queue
            await publishQueue.add({
                jobId,
                userId: post.user,
                platforms: post.platforms,
                content: {
                    title: post.title,
                    body: post.content,
                    media: post.media
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
            console.error(`[Scheduler] Failed to enqueue post ${post._id}:`, e);
        }
    }

    return count;
}

module.exports = { scheduleDuePosts };
