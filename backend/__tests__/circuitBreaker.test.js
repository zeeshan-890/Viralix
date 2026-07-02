jest.mock('../config/redis', () => ({
    getRedisClient: () => ({
        get: jest.fn(async () => null),
        set: jest.fn(async () => 'OK'),
    }),
}));

const { runWithCircuitBreaker, getCircuitState } = require('../utils/circuitBreaker');

describe('circuit breaker', () => {
    test('executes function when circuit is closed', async () => {
        const result = await runWithCircuitBreaker('instagram', async () => 'ok', {
            failureThreshold: 2,
            resetTimeoutMs: 1000,
        });
        expect(result).toBe('ok');
    });

    test('tracks circuit state helper', async () => {
        const state = await getCircuitState('tiktok');
        expect(state).toHaveProperty('failures');
    });
});
