function parseIdempotencyKey(req) {
    const raw = req?.headers?.['idempotency-key'];
    if (!raw || typeof raw !== 'string') return null;
    const key = raw.trim();
    return key ? key.slice(0, 128) : null;
}

module.exports = { parseIdempotencyKey };

