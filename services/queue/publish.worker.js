const publishQueue = require('./publish.queue');
const PublishJob = require('../../models/PublishJob');
const User = require('../../models/User');
const Post = require('../../models/Post');
// Note: PublisherFactory is required dynamically below in the processing loop

// Process jobs
publishQueue.process(async (job) => {
    console.log('[PublishWorker] Processing job:', job.id, 'Data:', JSON.stringify(job.data));

    const { jobId, userId, platforms, content, postId } = job.data;

    // 1. Fetch Job and User
    const publishJob = await PublishJob.findOne({ jobId });
    if (!publishJob) {
        console.error('[PublishWorker] Job not found in DB:', jobId);
        throw new Error(`Job ${jobId} not found in database`);
    }

    const user = await User.findById(userId);
    if (!user) {
        console.error('[PublishWorker] User not found:', userId);
        publishJob.status = 'failed';
        publishJob.error = 'User not found';
        publishJob.completedAt = new Date();
        await publishJob.save();
        throw new Error(`User ${userId} not found`);
    }

    console.log('[PublishWorker] Found job and user, starting publish for', platforms.length, 'platforms');

    publishJob.status = 'processing';
    publishJob.logs.push({ message: 'Starting publish job' });
    await publishJob.save();

    // Update Post status to processing
    if (postId) {
        await Post.updateOne({ _id: postId }, { $set: { isDraft: false, isScheduled: false } });
    }

    let successCount = 0;
    let failCount = 0;
    const totalPlatforms = platforms.length;

    // 2. Iterate over platforms
    for (let i = 0; i < totalPlatforms; i++) {
        const platform = platforms[i];

        // Find platform status index in job document
        const platformIndex = publishJob.platforms.findIndex(
            p => p.name === platform.name && p.accountId === platform.accountId
        );

        if (platformIndex === -1) continue;

        try {
            // Update platform status to processing
            publishJob.platforms[platformIndex].status = 'processing';
            await publishJob.save();

            // Sync 'processing' status to the actual Post document so UI sees it
            if (postId) {
                await Post.updateOne(
                    { _id: postId, 'platforms.accountId': platform.accountId, 'platforms.name': platform.name },
                    {
                        $set: {
                            'platforms.$.status': 'processing',
                            'platforms.$.errorMessage': null // Clear any previous error immediately
                        }
                    }
                );
            }

            job.progress(Math.round(((i + 0.5) / totalPlatforms) * 100));

            // Call Publisher Factory
            publishJob.logs.push({ message: `Publishing to ${platform.name}...` });
            await publishJob.save();

            const PublisherFactory = require('../publishers/publisher.factory');
            const publisher = PublisherFactory.getPublisher(user, platform.name);

            const result = await publisher.publish({
                accountId: platform.accountId,
                accountName: platform.accountName // might be needed by some adapters
            }, {
                content: content.body,
                media: content.media,
                title: content.title
            });

            // Update success
            publishJob.platforms[platformIndex].status = 'completed';
            publishJob.platforms[platformIndex].platformPostId = result.postId;
            publishJob.logs.push({ message: `Successfully published to ${platform.name}` });
            successCount++;

            // Update Post Platform Status (Published)
            if (postId) {
                await Post.updateOne(
                    { _id: postId, 'platforms.accountId': platform.accountId, 'platforms.name': platform.name },
                    {
                        $set: {
                            'platforms.$.status': 'published',
                            'platforms.$.publishedAt': new Date(),
                            'platforms.$.postId': result.postId,
                            'platforms.$.engagement.lastUpdated': new Date(),
                            'platforms.$.errorMessage': null
                        }
                    }
                );
            }

        } catch (error) {
            console.error(`Publish failed for ${platform.name}:`, error);

            // Update failure
            publishJob.platforms[platformIndex].status = 'failed';
            publishJob.platforms[platformIndex].error = error.message;
            publishJob.logs.push({ level: 'error', message: `Failed to publish to ${platform.name}: ${error.message}` });
            failCount++;

            // Update Post Platform Status (Failed)
            if (postId) {
                await Post.updateOne(
                    { _id: postId, 'platforms.accountId': platform.accountId, 'platforms.name': platform.name },
                    {
                        $set: {
                            'platforms.$.status': 'failed',
                            'platforms.$.errorMessage': error.message
                        }
                    }
                );
            }
        }

        // Update global progress
        job.progress(Math.round(((i + 1) / totalPlatforms) * 100));
        await publishJob.save();
    }

    // 3. Finalize Job
    publishJob.completedAt = new Date();
    if (failCount === 0) {
        publishJob.status = 'completed';
        publishJob.logs.push({ message: 'Job completed successfully' });
    } else if (successCount === 0) {
        publishJob.status = 'failed';
        publishJob.error = 'Failed to publish to all platforms';
        publishJob.logs.push({ level: 'error', message: 'Job failed completely' });
    } else {
        publishJob.status = 'partially_failed';
        publishJob.error = `${failCount} platform(s) failed`;
        publishJob.logs.push({ level: 'warn', message: 'Job completed with some errors' });
    }

    // Update Post Global Status
    if (postId) {
        let globalStatus = 'published';
        if (failCount === totalPlatforms) globalStatus = 'failed';
        else if (failCount > 0) globalStatus = 'partially_failed'; // Post model doesn't have this enum, defaults to isPublished logic?

        // Post has isPublished boolean.
        if (successCount > 0) {
            await Post.updateOne({ _id: postId }, { $set: { isPublished: true, isDraft: false, isScheduled: false } });
        }
    }

    await publishJob.save();
    return { success: successCount, failed: failCount };
});

console.log('👷 Publish Worker started');
