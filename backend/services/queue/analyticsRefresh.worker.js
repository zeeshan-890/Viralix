const AnalyticsRefreshJob = require('../../models/AnalyticsRefreshJob');
const analyticsRefreshQueue = require('./analyticsRefresh.queue');
const { refreshAnalyticsForUser } = require('../analytics/refreshAnalytics');
const { log, withTrace, serializeError } = require('../../utils/logger');

const analyticsRefreshWorkerConcurrency = Number(process.env.ANALYTICS_REFRESH_WORKER_CONCURRENCY || 2);

// Keep analytics refresh parallelism bounded to avoid starving publish/sync workers.
analyticsRefreshQueue.process(analyticsRefreshWorkerConcurrency, async (job) => {
    const { refreshJobId, userId, traceId } = job.data;
    const refreshJob = await AnalyticsRefreshJob.findOne({ jobId: refreshJobId });
    if (!refreshJob) throw new Error(`Refresh job ${refreshJobId} not found`);

    await AnalyticsRefreshJob.updateOne(
        { _id: refreshJob._id },
        {
            $set: { status: 'processing', startedAt: new Date(), progress: 10 },
            $push: { logs: { level: 'info', message: 'Started analytics refresh' } },
        }
    );

    try {
        const result = await refreshAnalyticsForUser(userId);
        await AnalyticsRefreshJob.updateOne(
            { _id: refreshJob._id },
            {
                $set: {
                    status: 'completed',
                    progress: 100,
                    result,
                    completedAt: new Date(),
                },
                $push: { logs: { level: 'info', message: `Completed refresh; updated ${result.updated} posts` } },
            }
        );
        log('info', 'analytics refresh worker completed', withTrace({ refreshJobId, userId, updated: result.updated }, traceId));
    } catch (error) {
        await AnalyticsRefreshJob.updateOne(
            { _id: refreshJob._id },
            {
                $set: {
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date(),
                },
                $push: { logs: { level: 'error', message: `Refresh failed: ${error.message}` } },
            }
        );
        log('error', 'analytics refresh worker failed', withTrace({ refreshJobId, userId, error: serializeError(error) }, traceId));
        throw error;
    }
});

log('info', 'analytics refresh worker started', { concurrency: analyticsRefreshWorkerConcurrency });

