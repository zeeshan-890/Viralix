/**
 * Publishing module boundary.
 * Keeps queue/worker/DLQ surfaces together for future service extraction.
 */
const publishQueue = require('../../services/queue/publish.queue');
const publishDlq = require('../../services/queue/publish.dlq');
const PublishJob = require('../../models/PublishJob');
const PublishDlqJob = require('../../models/PublishDlqJob');

module.exports = {
    name: 'publishing',
    publishQueue,
    publishDlq,
    PublishJob,
    PublishDlqJob,
    workerEntry: '../../services/queue/publish.worker',
    processEntry: '../../worker-process.js',
};
