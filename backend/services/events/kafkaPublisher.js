const {
    publishKafkaMessage,
    getDomainEventsTopic,
    isKafkaPublishEnabled,
} = require('../../config/kafka');
const { log } = require('../../utils/logger');

async function publishDomainEventToKafka(envelope) {
    if (!isKafkaPublishEnabled()) return { published: false, backend: 'kafka' };

    const topic = getDomainEventsTopic();
    await publishKafkaMessage({
        topic,
        key: envelope.userId || envelope.eventId,
        value: envelope,
        headers: {
            'event-type': envelope.eventType,
            'trace-id': envelope.traceId || '',
            'event-id': envelope.eventId,
        },
    });

    log('info', 'domain event published to kafka', {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        topic,
    });

    return { published: true, backend: 'kafka', topic };
}

module.exports = {
    publishDomainEventToKafka,
};
