const jwt = require('jsonwebtoken');

// Simple 7-day JWT handling
const EXPIRES_IN = '7d';

function sign(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

function verify(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { sign, verify, EXPIRES_IN };
