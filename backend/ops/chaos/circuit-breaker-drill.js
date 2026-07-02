require('dotenv').config();
const { runWithCircuitBreaker, getCircuitState } = require('../../utils/circuitBreaker');

const PLATFORM = process.env.CHAOS_PLATFORM || 'instagram';
const FAILURES = Number(process.env.CHAOS_FAILURE_COUNT || 6);

async function main() {
    let opened = false;
    for (let i = 0; i < FAILURES; i++) {
        try {
            await runWithCircuitBreaker(`publish:${PLATFORM}`, async () => {
                throw new Error(`Simulated ${PLATFORM} outage #${i + 1}`);
            }, {
                failureThreshold: Number(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5),
                resetTimeoutMs: Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 60000),
            });
        } catch (error) {
            if (error.code === 'CIRCUIT_OPEN') {
                opened = true;
                break;
            }
        }
    }

    const state = await getCircuitState(`publish:${PLATFORM}`);
    const report = {
        platform: PLATFORM,
        simulatedFailures: FAILURES,
        circuitOpened: opened,
        state,
        ok: opened,
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
