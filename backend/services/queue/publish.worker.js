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

    // 2. Iterate over platforms in PARALLEL
    let completedCount = 0;

    const publishPromises = platforms.map(async (platform) => {
        // Find platform status index in job document
        // We need to re-fetch or carefuly manage state, but since we modify subdocs by index/id, 
        // using the initial index might be risky if array mutates (it shouldn't here).
        // Safest is to find index inside the async function or pass it if stable.
        // The platforms array in job.data is static. The DB document `publishJob` is shared.
        // Mongoose concurrent saves to same doc can be race-condition prone for array items.
        // BETTER APPROACH: Use `findOneAndUpdate` for atomic field updates if possible, 
        // OR rely on the fact that we are updating different array elements. 

        // However, `publishJob.save()` saves the WHOLE document. Concurrent saves might overwrite each other's status updates.
        // To fix this parallel save execution, we should probably pull the job doc fresh or use atomic updates.
        // Given complexity, standard practice with Mongoose arrays is tricky. 
        // Let's use `PublishJob.updateOne` with array filters or direct index setting to match the platform.

        const platformIndex = publishJob.platforms.findIndex(
            p => p.name === platform.name && p.accountId === platform.accountId
        );

        if (platformIndex === -1) return { success: false, platform: platform.name };

        try {
            // Update platform status to processing (Atomic update to avoid race conditions on the main doc)
            await PublishJob.updateOne(
                { _id: publishJob._id },
                {
                    $set: {
                        [`platforms.${platformIndex}.status`]: 'processing'
                    },
                    $push: {
                        logs: { message: `Publishing to ${platform.name}...` }
                    }
                }
            );

            // Sync 'processing' status to the actual Post document so UI sees it
            if (postId) {
                await Post.updateOne(
                    { _id: postId, 'platforms.accountId': platform.accountId, 'platforms.name': platform.name },
                    {
                        $set: {
                            'platforms.$.status': 'processing',
                            'platforms.$.errorMessage': null
                        }
                    }
                );
            }

            const PublisherFactory = require('../publishers/publisher.factory');
            const publisher = PublisherFactory.getPublisher(user, platform.name);

            const result = await publisher.publish({
                accountId: platform.accountId,
                accountName: platform.accountName
            }, {
                content: content.body,
                media: content.media,
                title: content.title
            });

            // Update success (Atomic)
            await PublishJob.updateOne(
                { _id: publishJob._id },
                {
                    $set: {
                        [`platforms.${platformIndex}.status`]: 'completed',
                        [`platforms.${platformIndex}.platformPostId`]: result.postId
                    },
                    $push: {
                        logs: { message: `Successfully published to ${platform.name}` }
                    }
                }
            );

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

            completedCount++;
            job.progress(Math.round((completedCount / totalPlatforms) * 100));
            return { success: true, platform: platform.name };

        } catch (error) {
            console.error(`Publish failed for ${platform.name}:`, error);

            // Update failure (Atomic)
            await PublishJob.updateOne(
                { _id: publishJob._id },
                {
                    $set: {
                        [`platforms.${platformIndex}.status`]: 'failed',
                        [`platforms.${platformIndex}.error`]: error.message
                    },
                    $push: {
                        logs: { level: 'error', message: `Failed to publish to ${platform.name}: ${error.message}` }
                    }
                }
            );

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

            completedCount++;
            job.progress(Math.round((completedCount / totalPlatforms) * 100));
            return { success: false, platform: platform.name };
        }
    });

    const results = await Promise.allSettled(publishPromises);

    // Refresh the job document to get latest state before final save/logic
    const updatedJob = await PublishJob.findOne({ jobId });
    if (updatedJob) {
        // Re-calculate counts based on actual DB state or promise results
        // Promise results are reliable for this run.
        successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        failCount = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
        // Note: Promise.allSettled wrappers always return objects in catch so they are technically 'fulfilled' promises returning {success:false}
    } else {
        // Fallback if job missing (unlikely)
        successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        failCount = totalPlatforms - successCount;
    }

    // 3. Finalize Job
    // Need to re-fetch job to update main status to avoid version error? 
    // We can just update the status field atomically.
    // 3. Finalize Job
    const finalUpdate = {
        $set: { completedAt: new Date() },
        $push: { logs: {} }
    };

    if (failCount === 0) {
        finalUpdate.$set.status = 'completed';
        finalUpdate.$push.logs = { message: 'Job completed successfully' };
    } else if (successCount === 0) {
        finalUpdate.$set.status = 'failed';
        finalUpdate.$set.error = 'Failed to publish to all platforms';
        finalUpdate.$push.logs = { level: 'error', message: 'Job failed completely' };
    } else {
        finalUpdate.$set.status = 'partially_failed';
        finalUpdate.$set.error = `${failCount} platform(s) failed`;
        finalUpdate.$push.logs = { level: 'warn', message: 'Job completed with some errors' };
    }

    await PublishJob.updateOne({ _id: publishJob._id }, finalUpdate);

    // Update Post Global Status
    if (postId) {
        let globalStatus = 'published';
        if (failCount === totalPlatforms) globalStatus = 'failed';
        else if (failCount > 0) globalStatus = 'partially_failed';

        // Post has isPublished boolean.
        if (successCount > 0) {
            await Post.updateOne({ _id: postId }, { $set: { isPublished: true, isDraft: false, isScheduled: false } });
        }
    }

    // Do NOT call publishJob.save() here as it is stale and would overwrite atomic updates
    // await publishJob.save();
    return { success: successCount, failed: failCount };
});

console.log('👷 Publish Worker started');
