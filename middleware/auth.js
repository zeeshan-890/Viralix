const { verify } = require('../services/jwt');

module.exports = (req, res, next) => {
    // Prefer token from HttpOnly cookie
    const cookieToken = req.cookies && req.cookies['token'];
    const headerToken = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
    const token = cookieToken || headerToken;

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = verify(token);
        // support both { id } or { user: { id } }
        req.user = decoded.user || { id: decoded.id };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};
