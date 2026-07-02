const { getReadConnection } = require('../config/database');

/**
 * Apply Mongo read preference when configured.
 * Uses dedicated read connection when MONGODB_READ_URI is set.
 */
function applyReadPreference(query) {
    const readPreference = process.env.MONGODB_READ_PREFERENCE;
    if (readPreference && query && typeof query.read === 'function') {
        return query.read(readPreference);
    }
    return query;
}

function getModelForReads(Model) {
    const readConn = getReadConnection();
    if (!Model?.schema || readConn.models[Model.modelName]) {
        return readConn.models[Model.modelName] || Model;
    }
    return readConn.model(Model.modelName, Model.schema);
}

module.exports = {
    applyReadPreference,
    getModelForReads,
};
