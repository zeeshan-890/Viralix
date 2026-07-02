const {
    register,
    observeHttp,
    incSchedulerLockEvent,
    incQueueJob,
    setQueueDepth,
    observeQueueJobDuration,
} = require('../config/metrics');

describe('metrics registry', () => {
    test('exposes key metric names and content', async () => {
        observeHttp({ method: 'GET', route: '/api/health', statusCode: 200, durationMs: 42 });
        incSchedulerLockEvent('acquire');
        incQueueJob('social-publish', 'completed');
        setQueueDepth('social-publish', 'waiting', 3);
        observeQueueJobDuration('social-publish', 'total', 'completed', 500);

        const content = await register.metrics();
        expect(content).toContain('viralix_http_request_duration_ms');
        expect(content).toContain('viralix_http_requests_total');
        expect(content).toContain('viralix_scheduler_lock_events_total');
        expect(content).toContain('viralix_queue_jobs_total');
        expect(content).toContain('viralix_queue_depth');
        expect(content).toContain('viralix_queue_job_duration_ms');
    });
});

