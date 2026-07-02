const {
    parseTraceparent,
    formatTraceparent,
    normalizeTraceId,
    withWorkerSpan,
    runWithSpan,
} = require('../utils/tracing');

describe('tracing helpers', () => {
    test('parses and formats W3C traceparent', () => {
        const traceId = 'a'.repeat(32);
        const spanId = 'b'.repeat(16);
        const header = `00-${traceId}-${spanId}-01`;

        expect(parseTraceparent(header)).toEqual({
            traceId,
            spanId,
            flags: '01',
        });
        expect(formatTraceparent(traceId, spanId)).toBe(header);
    });

    test('normalizes trace ids to 32 hex chars', () => {
        expect(normalizeTraceId('abc')).toBe('00000000000000000000000000000abc');
        expect(normalizeTraceId('a'.repeat(32))).toBe('a'.repeat(32));
    });

    test('withWorkerSpan delegates to handler', async () => {
        const handler = jest.fn(async () => 'ok');
        const wrapped = withWorkerSpan('publish', handler);
        const job = { id: 42, data: { traceId: 'c'.repeat(32), jobId: 'job-1' } };

        await expect(wrapped(job)).resolves.toBe('ok');
        expect(handler).toHaveBeenCalledWith(job);
    });

    test('runWithSpan propagates errors', async () => {
        await expect(
            runWithSpan('test.span', {}, async () => {
                throw new Error('boom');
            }, 'd'.repeat(32)),
        ).rejects.toThrow('boom');
    });
});
