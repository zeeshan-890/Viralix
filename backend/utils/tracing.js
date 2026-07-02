const { randomBytes } = require('crypto');
const api = require('@opentelemetry/api');
const { log } = require('./logger');

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'viralix-backend';
let sdkInitialized = false;

function getTracer() {
    return api.trace.getTracer(SERVICE_NAME);
}

function randomSpanId() {
    return randomBytes(8).toString('hex');
}

function normalizeTraceId(traceId) {
    if (!traceId) return null;
    const hex = String(traceId).replace(/-/g, '').toLowerCase();
    if (!/^[a-f0-9]+$/.test(hex)) return null;
    if (hex.length === 32) return hex;
    if (hex.length < 32) return hex.padStart(32, '0');
    return hex.slice(0, 32);
}

function parseTraceparent(header) {
    if (!header || typeof header !== 'string') return null;
    const match = header.trim().match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$/i);
    if (!match) return null;
    return { traceId: match[1].toLowerCase(), spanId: match[2].toLowerCase(), flags: match[3] };
}

function formatTraceparent(traceId, spanId = randomSpanId()) {
    const tid = normalizeTraceId(traceId) || randomBytes(16).toString('hex');
    const sid = String(spanId).replace(/-/g, '').toLowerCase().slice(0, 16).padEnd(16, '0');
    return `00-${tid}-${sid}-01`;
}

async function runWithSpan(name, attributes, fn, traceId) {
    const tracer = getTracer();
    const attrs = { ...attributes };
    if (traceId) attrs['viralix.trace_id'] = traceId;

    return tracer.startActiveSpan(name, { attributes: attrs }, async (span) => {
        try {
            return await fn(span);
        } catch (error) {
            span.recordException(error);
            span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
            throw error;
        } finally {
            span.end();
        }
    });
}

function withWorkerSpan(queueName, handler) {
    return async (job) => runWithSpan(
        `queue.process.${queueName}`,
        {
            'queue.name': queueName,
            'bull.job.id': String(job.id),
            'viralix.queue_job_id': String(job.data?.jobId || job.data?.syncJobId || job.data?.refreshJobId || ''),
        },
        () => handler(job),
        job.data?.traceId,
    );
}

function initTracing() {
    if (sdkInitialized || process.env.OTEL_ENABLED !== '1') return sdkInitialized;

    try {
        const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
        const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
        const { Resource } = require('@opentelemetry/resources');
        const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

        const provider = new NodeTracerProvider({
            resource: new Resource({
                [ATTR_SERVICE_NAME]: SERVICE_NAME,
            }),
        });

        const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
        if (endpoint) {
            provider.addSpanProcessor(
                new (require('@opentelemetry/sdk-trace-base').BatchSpanProcessor)(
                    new OTLPTraceExporter({ url: endpoint })
                )
            );
        }

        provider.register();
        sdkInitialized = true;
        log('info', 'OpenTelemetry SDK initialized', { service: SERVICE_NAME, endpoint: endpoint || null });
    } catch (error) {
        log('warn', 'OpenTelemetry SDK not loaded; using API noop tracer', { error: error.message });
    }

    return sdkInitialized;
}

module.exports = {
    getTracer,
    parseTraceparent,
    formatTraceparent,
    normalizeTraceId,
    runWithSpan,
    withWorkerSpan,
    initTracing,
};
