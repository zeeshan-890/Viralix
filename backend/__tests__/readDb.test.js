const { getReadConnection } = require('../config/database');
const { applyReadPreference } = require('../utils/readDb');

describe('read db helpers', () => {
    test('applyReadPreference passes through when unset', () => {
        const original = process.env.MONGODB_READ_PREFERENCE;
        delete process.env.MONGODB_READ_PREFERENCE;
        const query = { find: jest.fn().mockReturnThis() };
        const result = applyReadPreference(query);
        expect(result).toBe(query);
        if (original) process.env.MONGODB_READ_PREFERENCE = original;
    });

    test('applyReadPreference uses mongoose read helper when set', () => {
        process.env.MONGODB_READ_PREFERENCE = 'secondaryPreferred';
        const query = { read: jest.fn().mockReturnThis() };
        applyReadPreference(query);
        expect(query.read).toHaveBeenCalledWith('secondaryPreferred');
        delete process.env.MONGODB_READ_PREFERENCE;
    });

    test('getReadConnection falls back to primary connection', () => {
        const conn = getReadConnection();
        expect(conn).toBeTruthy();
    });
});
