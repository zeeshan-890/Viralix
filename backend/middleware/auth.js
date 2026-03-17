const { verify } = require('../services/jwt');

module.exports = (req, res, next) => {
    // LocalStorage mode ONLY: token expected via Authorization Bearer header
    const token = (req.header('Authorization')?.replace('Bearer ', '')) || req.header('x-auth-token');

    if (!token) {
        console.warn('[AUTH] Missing token', {
            path: req.originalUrl,
            method: req.method,
            hasAuthHeader: !!req.header('Authorization') || !!req.header('x-auth-token'),
            origin: req.headers?.origin,
            referer: req.headers?.referer,
        });
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = verify(token);
        req.user = decoded.user || { id: decoded.id }; // support both payload shapes
        if (process.env.LOG_AUTH === '1') {
            console.log('[AUTH] Verified', { path: req.originalUrl, method: req.method, userId: req.user?.id });
        }
        return next();
    } catch (error) {
        console.warn('[AUTH] Invalid token', { path: req.originalUrl, method: req.method, message: error?.message });
        return res.status(401).json({ message: 'Token is not valid' });
    }
};
