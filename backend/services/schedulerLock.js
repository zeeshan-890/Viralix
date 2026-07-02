const { randomUUID } = require('crypto');

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

const RENEW_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("pexpire", KEYS[1], ARGV[2])
else
  return 0
end
`;

async function acquireSchedulerLock(redis, key, ttlMs) {
    const token = randomUUID();
    const acquired = await redis.set(key, token, 'PX', ttlMs, 'NX');
    if (acquired !== 'OK') return null;
    return token;
}

async function renewSchedulerLock(redis, key, token, ttlMs) {
    const result = await redis.eval(RENEW_LOCK_SCRIPT, 1, key, token, String(ttlMs));
    return result === 1;
}

async function releaseSchedulerLock(redis, key, token) {
    const result = await redis.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
    return result === 1;
}

module.exports = {
    acquireSchedulerLock,
    renewSchedulerLock,
    releaseSchedulerLock,
};

