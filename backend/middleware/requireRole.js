const User = require('../models/User');

/**
 * Role guard for protected routes.
 * Loads role from DB because JWT currently carries only user id.
 */
function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const user = await User.findById(req.user.id).select('role').lean();
            if (!user || !allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
            req.user.role = user.role;
            return next();
        } catch {
            return res.status(500).json({ message: 'Authorization check failed' });
        }
    };
}

module.exports = requireRole;
