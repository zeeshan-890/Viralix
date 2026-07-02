const { getJwtSecret } = require('../config/secrets');
const jwt = require('jsonwebtoken');

const EXPIRES_IN = '7d';

function sign(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: EXPIRES_IN });
}

function verify(token) {
    return jwt.verify(token, getJwtSecret());
}

module.exports = { sign, verify, EXPIRES_IN };
