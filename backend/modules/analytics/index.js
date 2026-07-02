/**
 * Analytics module boundary.
 * Groups refresh queue, materialized views, rollups, and trends for future extraction.
 */
const analyticsRefreshQueue = require('../../services/queue/analyticsRefresh.queue');
const AnalyticsRefreshJob = require('../../models/AnalyticsRefreshJob');
const AnalyticsOverviewSnapshot = require('../../models/AnalyticsOverviewSnapshot');
const AnalyticsDailyRollup = require('../../models/AnalyticsDailyRollup');
const overviewStore = require('../../services/analytics/overviewStore');
const trendsAdapter = require('../../services/analytics/trendsAdapter');
const rollupExport = require('../../services/analytics/rollupExport');

module.exports = {
    name: 'analytics',
    analyticsRefreshQueue,
    AnalyticsRefreshJob,
    AnalyticsOverviewSnapshot,
    AnalyticsDailyRollup,
    overviewStore,
    trendsAdapter,
    rollupExport,
    workerEntry: '../../services/queue/analyticsRefresh.worker',
    routesEntry: '../../routes/analytics',
};
