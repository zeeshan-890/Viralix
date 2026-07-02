const { rejectWhenQueueBacklogged } = require('../utils/queueAdmission');

describe('queue admission guard', () => {
    test('allows when queue is under limits', async () => {
        const queue = {
            getJobCounts: async () => ({ waiting: 10, delayed: 2, active: 4 }),
        };
        const result = await rejectWhenQueueBacklogged(queue, { waitingLimit: 20, delayedLimit: 10 });
        expect(result.shouldReject).toBe(false);
        expect(result.counts.waiting).toBe(10);
    });

    test('rejects when waiting exceeds limit', async () => {
        const queue = {
            getJobCounts: async () => ({ waiting: 30, delayed: 1, active: 2 }),
        };
        const result = await rejectWhenQueueBacklogged(queue, { waitingLimit: 20, delayedLimit: 10 });
        expect(result.shouldReject).toBe(true);
    });

    test('rejects when delayed exceeds limit', async () => {
        const queue = {
            getJobCounts: async () => ({ waiting: 5, delayed: 11, active: 1 }),
        };
        const result = await rejectWhenQueueBacklogged(queue, { waitingLimit: 20, delayedLimit: 10 });
        expect(result.shouldReject).toBe(true);
    });
});

