const Post = require('../models/Post');
const PublishJob = require('../models/PublishJob');
const PublishDlqJob = require('../models/PublishDlqJob');
const PlatformSyncJob = require('../models/PlatformSyncJob');
const AnalyticsRefreshJob = require('../models/AnalyticsRefreshJob');
const AnalyticsOverviewSnapshot = require('../models/AnalyticsOverviewSnapshot');
const AnalyticsDailyRollup = require('../models/AnalyticsDailyRollup');
const DomainEvent = require('../models/DomainEvent');
const AuditLog = require('../models/AuditLog');
const PlatformContent = require('../models/PlatformContent');
const SocialAccount = require('../models/SocialAccount');
const WebhookEvent = require('../models/WebhookEvent');
const { log } = require('../utils/logger');

const INDEXED_MODELS = [
    Post,
    PublishJob,
    PublishDlqJob,
    PlatformSyncJob,
    AnalyticsRefreshJob,
    AnalyticsOverviewSnapshot,
    AnalyticsDailyRollup,
    DomainEvent,
    AuditLog,
    PlatformContent,
    SocialAccount,
    WebhookEvent,
];

async function ensureDatabaseIndexes() {
    const results = [];
    for (const model of INDEXED_MODELS) {
        const modelName = model.modelName;
        try {
            await model.createIndexes();
            results.push({ model: modelName, ok: true });
        } catch (error) {
            results.push({ model: modelName, ok: false, error: error.message });
            log('error', 'index ensure failed', { model: modelName, error: error.message });
        }
    }
    return results;
}

module.exports = {
    INDEXED_MODELS,
    ensureDatabaseIndexes,
};
