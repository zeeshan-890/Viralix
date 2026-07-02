const {
    getKafkaClient,
    getDomainEventsTopic,
    isKafkaConfigured,
} = require('../../config/kafka');
const { log } = require('../../utils/logger');

let consumerInstance;
let consumerRunPromise;

async function handleDomainEventMessage(envelope) {
    log('info', 'kafka domain event consumed', {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        userId: envelope.userId,
        traceId: envelope.traceId || null,
    });
}

async function startKafkaDomainEventsConsumer() {
    if (!isKafkaConfigured()) {
        log('warn', 'kafka domain events consumer skipped; KAFKA_BROKERS not configured');
        return null;
    }

    if (process.env.KAFKA_DOMAIN_EVENTS_CONSUMER !== '1') {
        return null;
    }

    if (consumerInstance) return consumerInstance;

    const kafka = getKafkaClient();
    const topic = getDomainEventsTopic();
    const groupId = process.env.KAFKA_DOMAIN_EVENTS_GROUP_ID || 'viralix-domain-events';

    consumerInstance = kafka.consumer({ groupId });
    await consumerInstance.connect();
    await consumerInstance.subscribe({ topic, fromBeginning: false });

    consumerRunPromise = consumerInstance.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;
            const envelope = JSON.parse(message.value.toString());
            await handleDomainEventMessage(envelope);
        },
    });

    log('info', 'kafka domain events consumer started', { topic, groupId });
    return consumerInstance;
}

async function stopKafkaDomainEventsConsumer() {
    if (!consumerInstance) return;
    await consumerInstance.disconnect();
    consumerInstance = null;
    consumerRunPromise = null;
}

module.exports = {
    startKafkaDomainEventsConsumer,
    stopKafkaDomainEventsConsumer,
    handleDomainEventMessage,
};
