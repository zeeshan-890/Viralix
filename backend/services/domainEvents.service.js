const { v4: uuidv4 } = require('uuid');
const DomainEvent = require('../models/DomainEvent');
const { getRedisClient } = require('../config/redis');
const { log } = require('../utils/logger');

const DOMAIN_EVENTS_CHANNEL = process.env.DOMAIN_EVENTS_CHANNEL || 'viralix:domain-events';

async function publishToRedisStream(eventDoc) {
    if (process.env.DOMAIN_EVENTS_REDIS_PUBLISH !== '1') return;
    try {
        await getRedisClient().publish(DOMAIN_EVENTS_CHANNEL, JSON.stringify({
            eventId: eventDoc.eventId,
            eventType: eventDoc.eventType,
            userId: String(eventDoc.userId || ''),
            traceId: eventDoc.traceId || null,
            aggregateType: eventDoc.aggregateType,
            aggregateId: eventDoc.aggregateId,
            payload: eventDoc.payload,
            createdAt: eventDoc.createdAt,
        }));
    } catch (error) {
        log('warn', 'domain event redis publish failed', {
            eventId: eventDoc.eventId,
            error: error.message,
        });
    }
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
        await publishToRedisStream(event);
        event.status = 'published';
        event.publishedAt = new Date();
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
    DOMAIN_EVENTS_CHANNEL,
};
