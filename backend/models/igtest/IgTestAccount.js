const mongoose = require('mongoose');
const { getIgTestConnection } = require('../../config/igTestDb');

const IgTestAccountSchema = new mongoose.Schema({
    // Owner (user id from the primary app's JWT). Stored as string to avoid
    // cross-connection ref coupling with the main database.
    userId: {
        type: String,
        required: true,
        index: true
    },
    igUserId: {
        type: String,
        required: true
    },
    username: String,
    accountType: String,
    profilePictureUrl: String,
    // AES-256-CBC encrypted long-lived Instagram User access token.
    accessToken: {
        type: String,
        required: true,
        select: false
    },
    tokenExpires: Date,
    connectedAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: Date
}, {
    timestamps: true
});

// One record per (user, ig account) within the isolated test database.
IgTestAccountSchema.index({ userId: 1, igUserId: 1 }, { unique: true });

const connection = getIgTestConnection();

module.exports = connection
    ? connection.model('IgTestAccount', IgTestAccountSchema)
    : mongoose.model('IgTestAccount', IgTestAccountSchema);
