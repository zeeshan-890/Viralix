require('dotenv').config();

const connectDB = require('../config/database');
const { exportRollups, resolveSinceDateKey } = require('../services/analytics/rollupExport');

async function main() {
    const daysArg = process.argv.find((arg) => arg.startsWith('--days='));
    const days = daysArg ? daysArg.split('=')[1] : (process.env.ANALYTICS_ROLLUP_EXPORT_DAYS || 1);
    const sinceDateKey = resolveSinceDateKey(days);

    await connectDB();
    const result = await exportRollups({ sinceDateKey });

    console.log(JSON.stringify({
        ok: true,
        count: result.count,
        sinceDateKey,
        destination: result.destination,
    }));
    process.exit(0);
}

main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exit(1);
});
