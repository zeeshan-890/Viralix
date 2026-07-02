jest.mock('../models/User', () => ({
    findById: jest.fn(),
}));

const User = require('../models/User');

function mockUserRole(role) {
    User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(role ? { role } : null),
        }),
    });
}

describe('requireRole middleware', () => {
    test('allows users with required role', async () => {
        mockUserRole('admin');
        const requireRole = require('../middleware/requireRole');
        const middleware = requireRole('admin');
        const req = { user: { id: 'user-1' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await middleware(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user.role).toBe('admin');
    });

    test('blocks users without required role', async () => {
        mockUserRole('viewer');
        const requireRole = require('../middleware/requireRole');
        const middleware = requireRole('admin');
        const req = { user: { id: 'user-1' } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await middleware(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
