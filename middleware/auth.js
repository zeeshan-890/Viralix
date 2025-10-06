const { verify } = require('../services/jwt');

module.exports = (req, res, next) => {
    // LocalStorage mode: token expected via Authorization Bearer header
    const headerToken = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
    const cookieToken = req.cookies && req.cookies['token']; // legacy fallback
    const token = headerToken || cookieToken;

    if (!token) {
        // Debug auth failure context
        console.warn('[AUTH] Missing token', {
            path: req.originalUrl,
            method: req.method,
            hasCookie: !!req.headers?.cookie,
            hasAuthHeader: !!req.header('Authorization') || !!req.header('x-auth-token'),
            origin: req.headers?.origin,
            referer: req.headers?.referer,
        });
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = verify(token);
        // support both { id } or { user: { id } }
        req.user = decoded.user || { id: decoded.id };
        // Debug successful auth
        if (process.env.LOG_AUTH === '1') {
            console.log('[AUTH] Verified', { path: req.originalUrl, method: req.method, userId: req.user?.id });
        }
        next();
    } catch (error) {
        console.warn('[AUTH] Invalid token', { path: req.originalUrl, method: req.method, message: error?.message });
        return res.status(401).json({ message: 'Token is not valid' });
    }
};
