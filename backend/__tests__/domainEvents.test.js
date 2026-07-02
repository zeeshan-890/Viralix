jest.mock('../models/DomainEvent', () => ({
    create: jest.fn(),
}));

jest.mock('../config/redis', () => ({
    getRedisClient: () => ({
        publish: jest.fn(async () => 1),
    }),
}));

jest.mock('../services/events/kafkaPublisher', () => ({
    publishDomainEventToKafka: jest.fn(async () => ({ published: true, backend: 'kafka', topic: 'viralix.domain-events' })),
}));

const DomainEvent = require('../models/DomainEvent');
const { publishDomainEventToKafka } = require('../services/events/kafkaPublisher');
const { emitDomainEvent } = require('../services/domainEvents.service');

describe('domain events service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.DOMAIN_EVENTS_REDIS_PUBLISH;
        delete process.env.DOMAIN_EVENTS_BACKEND;
        delete process.env.KAFKA_BROKERS;
        delete process.env.DOMAIN_EVENTS_KAFKA_PUBLISH;

        DomainEvent.create.mockResolvedValue({
            eventId: 'evt-1',
            eventType: 'publish.completed',
            userId: 'user-1',
            aggregateType: 'publish_job',
            aggregateId: 'job-1',
            payload: {},
            save: jest.fn(async function save() { return this; }),
        });
    });

    test('persists domain event without bus when kafka is not configured', async () => {
        const event = await emitDomainEvent({
            eventType: 'publish.completed',
            userId: 'user-1',
            aggregateType: 'publish_job',
            aggregateId: 'job-1',
            payload: { ok: true },
        });
        expect(DomainEvent.create).toHaveBeenCalled();
        expect(event.eventId).toBe('evt-1');
        expect(publishDomainEventToKafka).not.toHaveBeenCalled();
    });

    test('publishes domain event to kafka when enabled', async () => {
        process.env.KAFKA_BROKERS = 'localhost:9092';
        process.env.DOMAIN_EVENTS_KAFKA_PUBLISH = '1';

        await emitDomainEvent({
            eventType: 'publish.completed',
            userId: 'user-1',
            aggregateType: 'publish_job',
            aggregateId: 'job-1',
            payload: { ok: true },
        });

        expect(publishDomainEventToKafka).toHaveBeenCalledWith(expect.objectContaining({
            eventId: 'evt-1',
            eventType: 'publish.completed',
            userId: 'user-1',
        }));
    });
});
