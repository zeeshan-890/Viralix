const PlatformSyncJob = require('../../models/PlatformSyncJob');
const platformSyncQueue = require('./platformSync.queue');
const { executePlatformSync } = require('../platformSync.service');
const { log, withTrace, serializeError } = require('../../utils/logger');
const { observeQueueJobDuration } = require('../../config/metrics');

const platformSyncWorkerConcurrency = Number(process.env.PLATFORM_SYNC_WORKER_CONCURRENCY || 3);

// Platform sync can be heavy and rate-limited externally, so keep it tunable via env.
platformSyncQueue.process(platformSyncWorkerConcurrency, async (job) => {
    const startedAt = Date.now();
    const { syncJobId, userId, platform, traceId } = job.data;
    const syncJob = await PlatformSyncJob.findOne({ jobId: syncJobId });
    if (!syncJob) throw new Error(`Sync job ${syncJobId} not found`);

    await PlatformSyncJob.updateOne(
        { _id: syncJob._id },
        {
            $set: { status: 'processing', startedAt: new Date(), progress: 10 },
            $push: { logs: { level: 'info', message: `Started ${platform} sync` } },
        }
    );

    try {
        const result = await executePlatformSync(userId, platform);
        await PlatformSyncJob.updateOne(
            { _id: syncJob._id },
            {
                $set: {
                    status: 'completed',
                    progress: 100,
                    result,
                    completedAt: new Date(),
                },
                $push: { logs: { level: 'info', message: `Completed sync (${result.synced} items)` } },
            }
        );
        observeQueueJobDuration('platform-sync', 'wait', 'completed', Math.max(startedAt - (job.timestamp || startedAt), 0));
        observeQueueJobDuration('platform-sync', 'total', 'completed', Date.now() - startedAt);
        log('info', 'platform sync worker completed', withTrace({ syncJobId, userId, platform, synced: result.synced }, traceId));
    } catch (error) {
        await PlatformSyncJob.updateOne(
            { _id: syncJob._id },
            {
                $set: {
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date(),
                },
                $push: { logs: { level: 'error', message: `Sync failed: ${error.message}` } },
            }
        );
        observeQueueJobDuration('platform-sync', 'wait', 'failed', Math.max(startedAt - (job.timestamp || startedAt), 0));
        observeQueueJobDuration('platform-sync', 'total', 'failed', Date.now() - startedAt);
        log('error', 'platform sync worker failed', withTrace({ syncJobId, userId, platform, error: serializeError(error) }, traceId));
        throw error;
    }
});

log('info', 'platform sync worker started', { concurrency: platformSyncWorkerConcurrency });

