require('dotenv').config();
const axios = require('axios');

const BASE_URL = (process.env.LOAD_TEST_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const REQUESTS = Number(process.env.LOAD_TEST_REQUESTS || 50);
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 10);

async function runBatch(paths) {
    const started = Date.now();
    let success = 0;
    let failed = 0;
    const latencies = [];

    const tasks = [];
    for (let i = 0; i < REQUESTS; i++) {
        const path = paths[i % paths.length];
        tasks.push((async () => {
            const t0 = Date.now();
            try {
                const res = await axios.get(`${BASE_URL}${path}`, { timeout: 10000, validateStatus: () => true });
                latencies.push(Date.now() - t0);
                if (res.status >= 200 && res.status < 500) success++;
                else failed++;
            } catch {
                failed++;
            }
        })());
        if (tasks.length >= CONCURRENCY) {
            await Promise.all(tasks.splice(0, tasks.length));
        }
    }
    if (tasks.length) await Promise.all(tasks);

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    return {
        durationMs: Date.now() - started,
        success,
        failed,
        p95Ms: p95,
        avgMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
    };
}

async function main() {
    const health = await runBatch(['/api/health']);
    const metrics = await runBatch(['/api/metrics']);

    const report = {
        baseUrl: BASE_URL,
        requests: REQUESTS,
        concurrency: CONCURRENCY,
        health,
        metrics,
        ok: health.failed === 0,
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
