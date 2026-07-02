const { checkTenantQuota } = require('../utils/tenantQuota');

function enforceTenantQuota(bucket) {
    return async (req, res, next) => {
        if (!req.user?.id) return next();
        const quota = await checkTenantQuota(req.user.id, bucket);
        if (!quota.allowed) {
            return res.status(429).json({
                message: 'Tenant quota exceeded',
                quota,
            });
        }
        return next();
    };
}

module.exports = { enforceTenantQuota };
