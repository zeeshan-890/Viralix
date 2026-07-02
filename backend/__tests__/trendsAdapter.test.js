const {
    mapRollupTimelineToPerformance,
    periodToDays,
    shouldUseRollupForPerformance,
} = require('../services/analytics/trendsAdapter');

describe('trends adapter helpers', () => {
    test('maps rollup timeline to performance shape', () => {
        const timeline = [{
            date: '2026-07-01',
            metrics: { totalViews: 100, totalEngagement: 20, publishedPosts: 3 },
            platformBreakdown: {
                instagram: {
                    published: 2,
                    engagement: { views: 60, likes: 5, comments: 2, shares: 1 },
                },
            },
        }];

        expect(mapRollupTimelineToPerformance(timeline)).toEqual([{
            date: '2026-07-01',
            views: 100,
            engagement: 20,
            posts: 3,
        }]);

        expect(mapRollupTimelineToPerformance(timeline, 'instagram')).toEqual([{
            date: '2026-07-01',
            views: 60,
            engagement: 8,
            posts: 2,
        }]);
    });

    test('period helpers', () => {
        expect(periodToDays('90d')).toBe(90);
        expect(periodToDays('1y')).toBe(365);
        expect(shouldUseRollupForPerformance('90d')).toBe(true);
        expect(shouldUseRollupForPerformance('30d')).toBe(false);
    });
});
