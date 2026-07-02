require('dotenv').config();
const connectDB = require('../config/database');
const { ensureDatabaseIndexes } = require('../config/ensureIndexes');

async function main() {
    await connectDB();
    const results = await ensureDatabaseIndexes();
    const failed = results.filter((r) => !r.ok);
    console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
    process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
