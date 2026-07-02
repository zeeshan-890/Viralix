const { randomUUID } = require('crypto');

function traceMiddleware(req, res, next) {
    const incoming = req.headers['x-trace-id'];
    const traceId = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : randomUUID();
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    next();
}

module.exports = { traceMiddleware };

