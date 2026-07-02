const axios = require('axios');
const AnalyticsDailyRollup = require('../../models/AnalyticsDailyRollup');
const { todayDateKey } = require('./dailyRollup');
const { log } = require('../../utils/logger');

function resolveSinceDateKey(days = 1) {
    const safeDays = Math.max(parseInt(days, 10) || 1, 1);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - safeDays);
    return todayDateKey(start);
}

async function exportRollups({ sinceDateKey, userId, limit = 5000 } = {}) {
    const filter = {};
    if (sinceDateKey) filter.dateKey = { $gte: sinceDateKey };
    if (userId) filter.userId = userId;

    const rollups = await AnalyticsDailyRollup.find(filter)
        .sort({ dateKey: 1 })
        .limit(Math.min(Math.max(parseInt(limit, 10) || 5000, 1), 50000))
        .lean();

    const payload = {
        exportedAt: new Date().toISOString(),
        count: rollups.length,
        sinceDateKey: sinceDateKey || null,
        rollups,
    };

    const url = process.env.ANALYTICS_ROLLUP_EXPORT_URL;
    if (url) {
        await axios.post(url, payload, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.ANALYTICS_ROLLUP_EXPORT_TOKEN
                    ? { Authorization: `Bearer ${process.env.ANALYTICS_ROLLUP_EXPORT_TOKEN}` }
                    : {}),
            },
        });
        payload.destination = 'http';
        log('info', 'analytics rollups exported', { count: rollups.length, destination: url });
    } else {
        payload.destination = 'local';
    }

    return payload;
}

module.exports = {
    exportRollups,
    resolveSinceDateKey,
};
