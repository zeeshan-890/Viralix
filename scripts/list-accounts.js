const mongoose = require('mongoose');
const SocialAccount = require('../models/SocialAccount');
require('dotenv').config();

const listAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const accounts = await SocialAccount.find({ platform: 'instagram' });
        console.log(`Found ${accounts.length} Instagram accounts:`);

        accounts.forEach(acc => {
            console.log({
                _id: acc._id,
                userId: acc.userId,
                platformAccountId: acc.platformAccountId,
                accountName: acc.accountName,
                metadata: acc.metadata
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('Error listing accounts:', error);
        process.exit(1);
    }
};

listAccounts();
