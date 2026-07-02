const { cacheHeaders } = require('../middleware/cacheHeaders');

describe('cache headers middleware', () => {
    test('sets cache-control for GET requests', () => {
        const middleware = cacheHeaders({ maxAge: 120, sMaxAge: 300 });
        const req = { method: 'GET' };
        const res = { set: jest.fn() };
        const next = jest.fn();

        middleware(req, res, next);
        expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=120, s-maxage=300');
        expect(res.set).toHaveBeenCalledWith('Vary', 'Authorization');
        expect(next).toHaveBeenCalled();
    });

    test('skips non-GET requests', () => {
        const middleware = cacheHeaders({ maxAge: 60 });
        const req = { method: 'POST' };
        const res = { set: jest.fn() };
        const next = jest.fn();

        middleware(req, res, next);
        expect(res.set).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
});
