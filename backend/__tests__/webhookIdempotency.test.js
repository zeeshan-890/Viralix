jest.mock('../models/WebhookEvent', () => ({
    create: jest.fn(),
}));

jest.mock('../utils/cache', () => ({
    buildCacheKey: (...parts) => parts.join(':'),
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
}));

const WebhookEvent = require('../models/WebhookEvent');
const { cacheGet, cacheSet } = require('../utils/cache');
const { claimWebhookEvent } = require('../utils/webhookIdempotency');

describe('webhook idempotency', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cacheGet.mockResolvedValue(null);
        cacheSet.mockResolvedValue(true);
    });

    test('claims first webhook event', async () => {
        WebhookEvent.create.mockResolvedValue({});
        const claimed = await claimWebhookEvent('instagram', 'comment:123', { commentId: '123' });
        expect(claimed).toBe(true);
        expect(WebhookEvent.create).toHaveBeenCalled();
    });

    test('rejects duplicate from cache', async () => {
        cacheGet.mockResolvedValue({ claimed: true });
        const claimed = await claimWebhookEvent('instagram', 'comment:123');
        expect(claimed).toBe(false);
        expect(WebhookEvent.create).not.toHaveBeenCalled();
    });

    test('rejects duplicate from mongo unique index', async () => {
        const duplicateError = new Error('duplicate');
        duplicateError.code = 11000;
        WebhookEvent.create.mockRejectedValue(duplicateError);

        const claimed = await claimWebhookEvent('facebook', 'comment:456');
        expect(claimed).toBe(false);
        expect(cacheSet).toHaveBeenCalled();
    });
});
