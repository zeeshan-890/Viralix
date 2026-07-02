function buildDomainEventEnvelope(eventDoc) {
    return {
        eventId: eventDoc.eventId,
        eventType: eventDoc.eventType,
        userId: String(eventDoc.userId || ''),
        traceId: eventDoc.traceId || null,
        aggregateType: eventDoc.aggregateType,
        aggregateId: eventDoc.aggregateId,
        payload: eventDoc.payload || {},
        createdAt: eventDoc.createdAt,
        source: 'viralix',
        version: 1,
    };
}

module.exports = {
    buildDomainEventEnvelope,
};
