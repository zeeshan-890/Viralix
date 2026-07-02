jest.mock('../models/DomainEvent', () => ({
    create: jest.fn(),
}));

jest.mock('../config/redis', () => ({
    getRedisClient: () => ({
        publish: jest.fn(async () => 1),
    }),
}));

const DomainEvent = require('../models/DomainEvent');
const { emitDomainEvent } = require('../services/domainEvents.service');

describe('domain events service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.DOMAIN_EVENTS_REDIS_PUBLISH;
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

    test('persists domain event', async () => {
        const event = await emitDomainEvent({
            eventType: 'publish.completed',
            userId: 'user-1',
            aggregateType: 'publish_job',
            aggregateId: 'job-1',
            payload: { ok: true },
        });
        expect(DomainEvent.create).toHaveBeenCalled();
        expect(event.eventId).toBe('evt-1');
    });
});
