require('dotenv').config();
const axios = require('axios');

const BASE_URL = (process.env.LOAD_TEST_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN = process.env.LOAD_TEST_AUTH_TOKEN;
const REQUESTS = Number(process.env.LOAD_TEST_REQUESTS || 30);
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 6);

async function main() {
    if (!TOKEN) {
        console.error('LOAD_TEST_AUTH_TOKEN is required for authenticated read load test');
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${TOKEN}` };
    const paths = ['/api/analytics/overview', '/api/platforms/connected'];
    const latencies = [];
    let success = 0;
    let failed = 0;
    const started = Date.now();
    const tasks = [];

    for (let i = 0; i < REQUESTS; i++) {
        const path = paths[i % paths.length];
        tasks.push((async () => {
            const t0 = Date.now();
            try {
                const res = await axios.get(`${BASE_URL}${path}`, { headers, timeout: 15000, validateStatus: () => true });
                latencies.push(Date.now() - t0);
                if (res.status >= 200 && res.status < 400) success++;
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
    const report = {
        baseUrl: BASE_URL,
        requests: REQUESTS,
        concurrency: CONCURRENCY,
        success,
        failed,
        durationMs: Date.now() - started,
        p95Ms: latencies[Math.floor(latencies.length * 0.95)] || 0,
        avgMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
        ok: failed === 0,
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
