const { todayDateKey } = require('../services/analytics/dailyRollup');

describe('daily rollup helpers', () => {
    test('builds UTC date key', () => {
        const key = todayDateKey(new Date('2026-07-02T15:30:00.000Z'));
        expect(key).toBe('2026-07-02');
    });
});
