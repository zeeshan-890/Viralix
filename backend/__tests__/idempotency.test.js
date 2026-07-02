const { parseIdempotencyKey } = require('../utils/httpIdempotency');

describe('idempotency key parser', () => {
    test('returns null for missing header', () => {
        expect(parseIdempotencyKey({ headers: {} })).toBeNull();
    });

    test('trims and returns non-empty key', () => {
        expect(parseIdempotencyKey({ headers: { 'idempotency-key': '  abc-123  ' } })).toBe('abc-123');
    });

    test('caps key length to 128 chars', () => {
        const raw = 'x'.repeat(200);
        const parsed = parseIdempotencyKey({ headers: { 'idempotency-key': raw } });
        expect(parsed).toHaveLength(128);
    });
});

