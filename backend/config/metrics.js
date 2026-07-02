const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationMs = new client.Histogram({
    name: 'viralix_http_request_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [25, 50, 100, 200, 400, 800, 1500, 3000],
    registers: [register],
});

const httpRequestsTotal = new client.Counter({
    name: 'viralix_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

const schedulerLockEventsTotal = new client.Counter({
    name: 'viralix_scheduler_lock_events_total',
    help: 'Scheduler distributed lock events',
    labelNames: ['event'],
    registers: [register],
});

const queueJobsTotal = new client.Counter({
    name: 'viralix_queue_jobs_total',
    help: 'Queue jobs outcome total',
    labelNames: ['queue', 'status'],
    registers: [register],
});

const queueDepthGauge = new client.Gauge({
    name: 'viralix_queue_depth',
    help: 'Current queue depth by state',
    labelNames: ['queue', 'state'],
    registers: [register],
});

const queueJobDurationMs = new client.Histogram({
    name: 'viralix_queue_job_duration_ms',
    help: 'Queue job end-to-end duration and wait times in ms',
    labelNames: ['queue', 'metric', 'status'],
    buckets: [100, 300, 500, 1000, 2000, 5000, 10000, 30000, 60000, 180000],
    registers: [register],
});

function observeHttp({ method, route, statusCode, durationMs }) {
    const labels = { method, route, status_code: String(statusCode) };
    httpRequestsTotal.inc(labels, 1);
    httpRequestDurationMs.observe(labels, durationMs);
}

function incSchedulerLockEvent(event) {
    schedulerLockEventsTotal.inc({ event }, 1);
}

function incQueueJob(queue, status) {
    queueJobsTotal.inc({ queue, status }, 1);
}

function setQueueDepth(queue, state, value) {
    queueDepthGauge.set({ queue, state }, value);
}

function observeQueueJobDuration(queue, metric, status, durationMs) {
    queueJobDurationMs.observe({ queue, metric, status }, durationMs);
}

module.exports = {
    register,
    observeHttp,
    incSchedulerLockEvent,
    incQueueJob,
    setQueueDepth,
    observeQueueJobDuration,
};

