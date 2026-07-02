function serializeError(error) {
    if (!error) return undefined;
    return {
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    };
}

function log(level, message, meta = {}) {
    const payload = {
        ts: new Date().toISOString(),
        level,
        message,
        ...meta,
    };
    const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    sink(JSON.stringify(payload));
}

function withTrace(meta = {}, traceId) {
    return traceId ? { ...meta, traceId } : meta;
}

module.exports = {
    log,
    withTrace,
    serializeError,
};

