/**
 * Cache-Control middleware for CDN/browser caching of safe GET responses.
 */
function cacheHeaders({ maxAge = 60, sMaxAge, staleWhileRevalidate = 0, privateCache = false } = {}) {
    const edgeTtl = sMaxAge ?? maxAge;
    const visibility = privateCache ? 'private' : 'public';
    const value = [
        visibility,
        `max-age=${maxAge}`,
        `s-maxage=${edgeTtl}`,
        staleWhileRevalidate > 0 ? `stale-while-revalidate=${staleWhileRevalidate}` : null,
    ].filter(Boolean).join(', ');

    return (req, res, next) => {
        if (req.method !== 'GET') return next();
        res.set('Cache-Control', value);
        res.set('Vary', 'Authorization');
        next();
    };
}

module.exports = { cacheHeaders };
