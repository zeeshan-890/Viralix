const { randomUUID } = require('crypto');
const { parseTraceparent, formatTraceparent, normalizeTraceId } = require('../utils/tracing');

function traceMiddleware(req, res, next) {
    const parsed = parseTraceparent(req.headers.traceparent);
    const incoming = req.headers['x-trace-id'];
    let traceId;

    if (parsed?.traceId) {
        traceId = parsed.traceId;
    } else if (typeof incoming === 'string' && incoming.trim()) {
        traceId = normalizeTraceId(incoming.trim()) || incoming.trim();
    } else {
        traceId = randomUUID().replace(/-/g, '');
    }

    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    res.setHeader('traceparent', formatTraceparent(traceId));
    next();
}

module.exports = { traceMiddleware };

