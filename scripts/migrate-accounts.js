const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path
const AccountService = require('../services/account.service'); // Adjust path
const connectDB = require('../config/database'); // Adjust path

// Load env for DB connection
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Starting Social Account Migration...');

    await connectDB();

    const users = await User.find({ 'socialAccounts.0': { $exists: true } });
    console.log(`Found ${users.length} users with social accounts.`);

    let totalMigrated = 0;

    for (const user of users) {
        console.log(`Migrating user: ${user.email} (${user._id})`);
        const count = await AccountService.migrateUserAccounts(user._id);
        totalMigrated += count;
    }

    console.log(`✅ Migration Complete! Total accounts migrated: ${totalMigrated}`);
    process.exit(0);
}

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
