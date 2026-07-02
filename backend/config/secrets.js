/**
 * Centralized secret access layer.
 * Today reads from process.env; can be swapped to AWS/GCP/Vault providers later.
 */
function getSecret(name, options = {}) {
    const { required = false, fallback = undefined } = options;
    const value = process.env[name] ?? fallback;
    if (required && (value === undefined || value === null || value === '')) {
        throw new Error(`Missing required secret: ${name}`);
    }
    return value;
}

function getJwtSecret() {
    return getSecret('JWT_SECRET', { required: true });
}

function getEncryptionKey() {
    return getSecret('ENCRYPTION_KEY', { fallback: 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3' });
}

function validateSecrets() {
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️ WARNING: JWT_SECRET is not set.');
    }
    const encryptionKey = getEncryptionKey();
    if (!process.env.ENCRYPTION_KEY) {
        console.warn('⚠️ WARNING: using fallback encryption key. Set ENCRYPTION_KEY in .env!');
    } else if (encryptionKey.length !== 32) {
        console.warn('⚠️ WARNING: ENCRYPTION_KEY must be 32 characters long.');
    }
}

module.exports = {
    getSecret,
    getJwtSecret,
    getEncryptionKey,
    validateSecrets,
};
