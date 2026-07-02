/**
 * Modular monolith registry — single import surface for domain module boundaries.
 */
module.exports = {
    publishing: require('./publishing'),
    analytics: require('./analytics'),
    platformSync: require('./platformSync'),
};
