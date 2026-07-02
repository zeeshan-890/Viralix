const { Kafka, logLevel } = require('kafkajs');
const { log } = require('../utils/logger');

let kafkaClient;
let producer;
let producerConnectPromise;

function getBrokers() {
    return (process.env.KAFKA_BROKERS || '')
        .split(',')
        .map((broker) => broker.trim())
        .filter(Boolean);
}

function isKafkaConfigured() {
    return getBrokers().length > 0;
}

function isKafkaPublishEnabled() {
    if (!isKafkaConfigured()) return false;
    if (process.env.DOMAIN_EVENTS_KAFKA_PUBLISH === '0') return false;
    if (process.env.DOMAIN_EVENTS_KAFKA_PUBLISH === '1') return true;

    const backend = (process.env.DOMAIN_EVENTS_BACKEND || 'kafka').toLowerCase();
    return backend === 'kafka' || backend === 'both';
}

function buildKafkaConfig() {
    const config = {
        clientId: process.env.KAFKA_CLIENT_ID || 'viralix-backend',
        brokers: getBrokers(),
        logLevel: logLevel.WARN,
    };

    if (process.env.KAFKA_SSL === '1') {
        config.ssl = true;
    }

    if (process.env.KAFKA_SASL_MECHANISM) {
        config.sasl = {
            mechanism: process.env.KAFKA_SASL_MECHANISM,
            username: process.env.KAFKA_SASL_USERNAME || '',
            password: process.env.KAFKA_SASL_PASSWORD || '',
        };
    }

    return config;
}

function getKafkaClient() {
    if (!isKafkaConfigured()) return null;
    if (!kafkaClient) {
        kafkaClient = new Kafka(buildKafkaConfig());
    }
    return kafkaClient;
}

async function getProducer() {
    if (!isKafkaConfigured()) return null;
    if (producer) return producer;

    if (!producerConnectPromise) {
        producerConnectPromise = (async () => {
            const client = getKafkaClient();
            const nextProducer = client.producer({
                allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION !== '0',
            });
            await nextProducer.connect();
            producer = nextProducer;
            log('info', 'kafka producer connected', { brokers: getBrokers() });
            return nextProducer;
        })().catch((error) => {
            producerConnectPromise = null;
            throw error;
        });
    }

    return producerConnectPromise;
}

function getDomainEventsTopic() {
    return process.env.KAFKA_DOMAIN_EVENTS_TOPIC || 'viralix.domain-events';
}

async function publishKafkaMessage({ topic, key, value, headers = {} }) {
    const activeProducer = await getProducer();
    if (!activeProducer) {
        throw new Error('Kafka producer is not configured');
    }

    return activeProducer.send({
        topic,
        messages: [{
            key: key ? String(key) : undefined,
            value: JSON.stringify(value),
            headers: Object.fromEntries(
                Object.entries(headers)
                    .filter(([, headerValue]) => headerValue != null && headerValue !== '')
                    .map(([headerKey, headerValue]) => [headerKey, String(headerValue)]),
            ),
        }],
    });
}

async function pingKafka() {
    if (!isKafkaConfigured()) return 'not_configured';

    try {
        const admin = getKafkaClient().admin();
        await admin.connect();
        await admin.listTopics();
        await admin.disconnect();
        return 'connected';
    } catch {
        return 'disconnected';
    }
}

async function disconnectKafka() {
    if (producer) {
        await producer.disconnect();
        producer = null;
        producerConnectPromise = null;
    }
}

module.exports = {
    getBrokers,
    isKafkaConfigured,
    isKafkaPublishEnabled,
    getKafkaClient,
    getProducer,
    getDomainEventsTopic,
    publishKafkaMessage,
    pingKafka,
    disconnectKafka,
};
