const { getRedisClient } = require('../config/redis');
const { buildCacheKey } = require('./cache');

const DEFAULTS = {
    failureThreshold: Number(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5),
    resetTimeoutMs: Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 60000),
};

function circuitKey(name) {
    return buildCacheKey('circuit', name);
}

async function getCircuitState(name) {
    try {
        const raw = await getRedisClient().get(circuitKey(name));
        return raw ? JSON.parse(raw) : { failures: 0, openUntil: 0 };
    } catch {
        return { failures: 0, openUntil: 0, degraded: true };
    }
}

async function saveCircuitState(name, state) {
    try {
        await getRedisClient().set(
            circuitKey(name),
            JSON.stringify(state),
            'EX',
            Math.ceil((DEFAULTS.resetTimeoutMs * 3) / 1000)
        );
    } catch {
        // ignore
    }
}

async function runWithCircuitBreaker(name, fn, options = {}) {
    const failureThreshold = options.failureThreshold ?? DEFAULTS.failureThreshold;
    const resetTimeoutMs = options.resetTimeoutMs ?? DEFAULTS.resetTimeoutMs;
    const now = Date.now();
    const state = await getCircuitState(name);

    if (state.openUntil && state.openUntil > now) {
        const error = new Error(`Circuit open for ${name}`);
        error.code = 'CIRCUIT_OPEN';
        error.retryAfterMs = state.openUntil - now;
        throw error;
    }

    try {
        const result = await fn();
        await saveCircuitState(name, { failures: 0, openUntil: 0 });
        return result;
    } catch (error) {
        const failures = (state.failures || 0) + 1;
        const nextState = {
            failures,
            openUntil: failures >= failureThreshold ? now + resetTimeoutMs : 0,
        };
        await saveCircuitState(name, nextState);
        throw error;
    }
}

module.exports = {
    runWithCircuitBreaker,
    getCircuitState,
};
