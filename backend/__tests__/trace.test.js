const { traceMiddleware } = require('../middleware/trace');
const { buildPublishQueuePayload } = require('../utils/publishPayload');

describe('trace middleware', () => {
    test('uses inbound x-trace-id and mirrors header', () => {
        const req = { headers: { 'x-trace-id': 'trace-123' } };
        const res = { setHeader: jest.fn() };
        const next = jest.fn();
        traceMiddleware(req, res, next);
        expect(req.traceId).toBe('trace-123');
        expect(res.setHeader).toHaveBeenCalledWith('x-trace-id', 'trace-123');
        expect(next).toHaveBeenCalled();
    });

    test('generates trace id when missing', () => {
        const req = { headers: {} };
        const res = { setHeader: jest.fn() };
        const next = jest.fn();
        traceMiddleware(req, res, next);
        expect(typeof req.traceId).toBe('string');
        expect(req.traceId.length).toBeGreaterThan(8);
        expect(res.setHeader).toHaveBeenCalledWith('x-trace-id', req.traceId);
        expect(next).toHaveBeenCalled();
    });
});

describe('publish queue payload', () => {
    test('includes trace id for queue propagation', () => {
        const post = {
            _id: 'post-1',
            platforms: [{ name: 'instagram', accountId: 'ig-1' }],
            title: 'Title',
            content: 'Body',
            media: [],
            tiktokSettings: {},
        };
        const payload = buildPublishQueuePayload({
            jobId: 'job-1',
            userId: 'user-1',
            traceId: 'trace-xyz',
            post,
        });
        expect(payload.traceId).toBe('trace-xyz');
        expect(payload.postId).toBe('post-1');
        expect(payload.content.title).toBe('Title');
    });
});

