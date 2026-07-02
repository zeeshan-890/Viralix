const {
    acquireSchedulerLock,
    renewSchedulerLock,
    releaseSchedulerLock,
} = require('../services/schedulerLock');

describe('scheduler distributed lock', () => {
    test('acquires lock once and prevents second acquisition', async () => {
        const redis = {
            value: null,
            async set(key, token, mode1, ttl, mode2) {
                if (!this.value) {
                    this.value = token;
                    return 'OK';
                }
                return null;
            },
            async eval() { return 0; },
        };

        const token1 = await acquireSchedulerLock(redis, 'test:lock', 5000);
        const token2 = await acquireSchedulerLock(redis, 'test:lock', 5000);
        expect(token1).toBeTruthy();
        expect(token2).toBeNull();
    });

    test('renews and releases only for owner token', async () => {
        const redis = {
            value: 'owner-token',
            async set() { return null; },
            async eval(script, keysCount, key, token, ttlMs) {
                if (script.includes('pexpire')) return token === this.value ? 1 : 0;
                if (script.includes('del')) {
                    if (token === this.value) {
                        this.value = null;
                        return 1;
                    }
                    return 0;
                }
                return 0;
            },
        };

        const renewedOwner = await renewSchedulerLock(redis, 'test:lock', 'owner-token', 5000);
        const renewedOther = await renewSchedulerLock(redis, 'test:lock', 'other-token', 5000);
        const releasedOther = await releaseSchedulerLock(redis, 'test:lock', 'other-token');
        const releasedOwner = await releaseSchedulerLock(redis, 'test:lock', 'owner-token');

        expect(renewedOwner).toBe(true);
        expect(renewedOther).toBe(false);
        expect(releasedOther).toBe(false);
        expect(releasedOwner).toBe(true);
    });
});

