jest.mock('../models/AnalyticsDailyRollup', () => ({
    find: jest.fn(),
}));

jest.mock('axios', () => ({
    post: jest.fn(async () => ({ status: 200 })),
}));

const AnalyticsDailyRollup = require('../models/AnalyticsDailyRollup');
const axios = require('axios');
const { exportRollups, resolveSinceDateKey } = require('../services/analytics/rollupExport');

describe('rollup export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.ANALYTICS_ROLLUP_EXPORT_URL;
        delete process.env.ANALYTICS_ROLLUP_EXPORT_TOKEN;

        const chain = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn(async () => ([
                { userId: 'u1', dateKey: '2026-07-01', metrics: { totalViews: 10 } },
            ])),
        };
        AnalyticsDailyRollup.find.mockReturnValue(chain);
    });

    test('resolveSinceDateKey returns UTC date key', () => {
        expect(resolveSinceDateKey(1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('exports rollups locally when no destination URL', async () => {
        const result = await exportRollups({ sinceDateKey: '2026-07-01' });
        expect(result.count).toBe(1);
        expect(result.destination).toBe('local');
        expect(axios.post).not.toHaveBeenCalled();
    });

    test('posts rollups when export URL configured', async () => {
        process.env.ANALYTICS_ROLLUP_EXPORT_URL = 'https://analytics.example/export';
        process.env.ANALYTICS_ROLLUP_EXPORT_TOKEN = 'secret';

        const result = await exportRollups({ sinceDateKey: '2026-07-01' });
        expect(result.destination).toBe('http');
        expect(axios.post).toHaveBeenCalledWith(
            'https://analytics.example/export',
            expect.objectContaining({ count: 1 }),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
            }),
        );
    });
});
