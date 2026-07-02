/**
 * Platform sync module boundary.
 * Groups sync queue, job model, and service for future extraction.
 */
const platformSyncQueue = require('../../services/queue/platformSync.queue');
const PlatformSyncJob = require('../../models/PlatformSyncJob');
const platformSyncService = require('../../services/platformSync.service');

module.exports = {
    name: 'platformSync',
    platformSyncQueue,
    PlatformSyncJob,
    platformSyncService,
    workerEntry: '../../services/queue/platformSync.worker',
    routesEntry: '../../routes/platform-sync',
};
