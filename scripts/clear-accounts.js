const mongoose = require('mongoose');
const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
require('dotenv').config();

const clearAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Option 1: Clear ALL accounts (simplest for dev)
        const result = await SocialAccount.deleteMany({});
        console.log(`Deleted ${result.deletedCount} SocialAccount documents.`);

        // Option 2: Clear legacy accounts from Users
        const users = await User.find({});
        for (const user of users) {
            if (user.socialAccounts && user.socialAccounts.length > 0) {
                user.socialAccounts = [];
                if (user.settings) {
                    user.settings.facebookPages = [];
                    user.settings.facebookDefaultPageId = null;
                }
                await user.save();
                console.log(`Cleared legacy accounts for user ${user.email}`);
            }
        }

        console.log('Social accounts cleared successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing accounts:', error);
        process.exit(1);
    }
};

clearAccounts();
