const { v4: uuidv4 } = require('uuid');
const DomainEvent = require('../models/DomainEvent');
const { getRedisClient } = require('../config/redis');
const { isKafkaPublishEnabled } = require('../config/kafka');
const { buildDomainEventEnvelope } = require('./events/domainEventEnvelope');
const { publishDomainEventToKafka } = require('./events/kafkaPublisher');
const { log } = require('../utils/logger');

const DOMAIN_EVENTS_CHANNEL = process.env.DOMAIN_EVENTS_CHANNEL || 'viralix:domain-events';

function isRedisPublishEnabled() {
    if (process.env.DOMAIN_EVENTS_REDIS_PUBLISH === '1') return true;
    return (process.env.DOMAIN_EVENTS_BACKEND || '').toLowerCase() === 'both';
}

async function publishToRedis(envelope) {
    if (!isRedisPublishEnabled()) return { published: false, backend: 'redis' };

    try {
        await getRedisClient().publish(DOMAIN_EVENTS_CHANNEL, JSON.stringify(envelope));
        return { published: true, backend: 'redis' };
    } catch (error) {
        log('warn', 'domain event redis publish failed', {
            eventId: envelope.eventId,
            error: error.message,
        });
        throw error;
    }
}

async function publishDomainEvent(eventDoc) {
    const envelope = buildDomainEventEnvelope(eventDoc);
    const publishers = [];

    if (isKafkaPublishEnabled()) {
        publishers.push(publishDomainEventToKafka(envelope));
    }
    if (isRedisPublishEnabled()) {
        publishers.push(publishToRedis(envelope));
    }

    if (publishers.length === 0) {
        return { published: false, backends: [] };
    }

    const results = await Promise.allSettled(publishers);
    const backends = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0 && backends.length === 0) {
        const error = failures[0].reason;
        throw error instanceof Error ? error : new Error(String(error));
    }

    if (failures.length > 0) {
        log('warn', 'domain event partial publish failure', {
            eventId: envelope.eventId,
            failures: failures.map((result) => result.reason?.message || String(result.reason)),
            backends: backends.map((item) => item.backend),
        });
    }

    return {
        published: backends.some((item) => item.published),
        backends,
    };
}

async function emitDomainEvent({
    eventType,
    userId,
    traceId,
    aggregateType,
    aggregateId,
    payload = {},
}) {
    const eventId = uuidv4();
    const event = await DomainEvent.create({
        eventId,
        eventType,
        userId,
        traceId,
        aggregateType,
        aggregateId,
        payload,
        status: 'pending',
    });

    try {
        const publishResult = await publishDomainEvent(event);
        event.status = publishResult.published ? 'published' : 'pending';
        if (publishResult.published) {
            event.publishedAt = new Date();
        }
        await event.save();
    } catch (error) {
        event.status = 'failed';
        await event.save();
        log('warn', 'domain event emit failed', { eventId, error: error.message });
    }

    return event;
}

module.exports = {
    emitDomainEvent,
    publishDomainEvent,
    DOMAIN_EVENTS_CHANNEL,
    isRedisPublishEnabled,
};
