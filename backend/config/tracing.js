const { initTracing } = require('../utils/tracing');

function bootstrapTracing() {
    return initTracing();
}

module.exports = { bootstrapTracing };
