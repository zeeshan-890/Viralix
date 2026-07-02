jest.mock('../config/kafka', () => ({
    isKafkaConfigured: jest.fn(() => true),
    getKafkaClient: jest.fn(),
    getDomainEventsTopic: jest.fn(() => 'viralix.domain-events'),
}));

const { isKafkaConfigured, getKafkaClient } = require('../config/kafka');
const { handleDomainEventMessage } = require('../services/events/kafkaDomainEventsConsumer');

describe('kafka domain events consumer', () => {
    test('handles consumed envelope', async () => {
        await expect(handleDomainEventMessage({
            eventId: 'evt-1',
            eventType: 'publish.completed',
            userId: 'user-1',
            traceId: 'trace-1',
        })).resolves.toBeUndefined();
        expect(isKafkaConfigured).not.toHaveBeenCalled();
        expect(getKafkaClient).not.toHaveBeenCalled();
    });
});
