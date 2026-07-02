const { buildDomainEventEnvelope } = require('../services/events/domainEventEnvelope');
const {
    getBrokers,
    isKafkaConfigured,
    isKafkaPublishEnabled,
    getDomainEventsTopic,
} = require('../config/kafka');

describe('kafka config', () => {
    beforeEach(() => {
        delete process.env.KAFKA_BROKERS;
        delete process.env.DOMAIN_EVENTS_KAFKA_PUBLISH;
        delete process.env.DOMAIN_EVENTS_BACKEND;
    });

    test('detects broker configuration', () => {
        expect(isKafkaConfigured()).toBe(false);
        process.env.KAFKA_BROKERS = 'localhost:9092,kafka:9092';
        expect(isKafkaConfigured()).toBe(true);
        expect(getBrokers()).toEqual(['localhost:9092', 'kafka:9092']);
    });

    test('enables kafka publish by default when brokers are configured', () => {
        process.env.KAFKA_BROKERS = 'localhost:9092';
        expect(isKafkaPublishEnabled()).toBe(true);
    });

    test('can disable kafka publish explicitly', () => {
        process.env.KAFKA_BROKERS = 'localhost:9092';
        process.env.DOMAIN_EVENTS_KAFKA_PUBLISH = '0';
        expect(isKafkaPublishEnabled()).toBe(false);
    });

    test('uses default domain events topic', () => {
        expect(getDomainEventsTopic()).toBe('viralix.domain-events');
    });
});

describe('domain event envelope', () => {
    test('builds versioned kafka payload', () => {
        const envelope = buildDomainEventEnvelope({
            eventId: 'evt-1',
            eventType: 'publish.completed',
            userId: 'user-1',
            traceId: 'trace-1',
            aggregateType: 'publish_job',
            aggregateId: 'job-1',
            payload: { ok: true },
            createdAt: new Date('2026-07-02T00:00:00.000Z'),
        });

        expect(envelope).toEqual(expect.objectContaining({
            eventId: 'evt-1',
            eventType: 'publish.completed',
            userId: 'user-1',
            source: 'viralix',
            version: 1,
        }));
    });
});
