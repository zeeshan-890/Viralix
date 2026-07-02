const PROCESS_TYPE = process.env.PROCESS_TYPE || 'all';

function shouldRunApi() {
    return PROCESS_TYPE === 'all' || PROCESS_TYPE === 'api';
}

function shouldRunWorkers() {
    return PROCESS_TYPE === 'all' || PROCESS_TYPE === 'worker';
}

function startQueueWorkers() {
    if (!process.env.REDIS_URL) {
        console.warn('⚠️ REDIS_URL not set — background workers skipped');
        return;
    }

    require('../services/queue/publish.worker');
    require('../services/queue/analyticsRefresh.worker');
    require('../services/queue/platformSync.worker');
    console.log('👷 Background workers started');
}

function startScheduler() {
    try {
        const cron = require('node-cron');
        const { runScheduleWithLock } = require('../services/scheduler');
        const { log, serializeError } = require('../utils/logger');

        cron.schedule('* * * * *', async () => {
            try {
                const result = await runScheduleWithLock(new Date());
                if (result.acquired && result.enqueued > 0) {
                    log('info', 'scheduler enqueued due posts', { enqueued: result.enqueued });
                }
            } catch (e) {
                log('error', 'scheduler cycle failed', { error: serializeError(e) });
            }
        });
        console.log('⏱️  Scheduler started: running every minute');
    } catch (e) {
        console.warn('Scheduler not started:', e.message);
    }
}

function startBackgroundServices() {
    if (!shouldRunWorkers()) return;
    try {
        startQueueWorkers();
        startScheduler();
    } catch (error) {
        console.error('⚠️ Failed to start background services:', error.message);
    }
}

module.exports = {
    PROCESS_TYPE,
    shouldRunApi,
    shouldRunWorkers,
    startBackgroundServices,
};
