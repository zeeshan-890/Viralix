const mongoose = require('mongoose');

// Dedicated, isolated connection for the Instagram Publishing Test module.
// Kept fully separate from the primary mongoose.connect() in config/database.js
// so this sandbox never shares state with the main application database.
let conn = null;

function getIgTestConnection() {
    if (conn) return conn;

    const uri = process.env.IG_TEST_MONGODB_URI;
    if (!uri) {
        console.error('❌ IG_TEST_MONGODB_URI is not set. Instagram Test module will fail until configured.');
        return null;
    }

    conn = mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: 10000,
    });

    conn.on('connected', () => {
        console.log(`📸 IG Test MongoDB Connected: ${conn.host}`);
    });
    conn.on('error', (err) => {
        console.error('❌ IG Test MongoDB connection error:', err.message);
    });

    return conn;
}

function getIgTestDbStatus() {
    if (!process.env.IG_TEST_MONGODB_URI) return 'not_configured';
    if (conn && conn.readyState === 1) return 'connected';
    return 'disconnected';
}

module.exports = { getIgTestConnection, getIgTestDbStatus };
