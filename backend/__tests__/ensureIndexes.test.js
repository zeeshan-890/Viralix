const { INDEXED_MODELS } = require('../config/ensureIndexes');

describe('ensure database indexes', () => {
    test('includes hot-path models', () => {
        const names = INDEXED_MODELS.map((model) => model.modelName);
        expect(names).toEqual(expect.arrayContaining([
            'Post',
            'PublishJob',
            'AuditLog',
            'PlatformSyncJob',
            'AnalyticsOverviewSnapshot',
        ]));
    });
});
