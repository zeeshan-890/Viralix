const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');

class AccountService {

    /**
     * Get all connected accounts for a user
     * Merges accounts from SocialAccount collection AND legacy User.socialAccounts
     */
    static async getAccounts(userId) {
        // Get accounts from new SocialAccount collection
        const socialAccounts = await SocialAccount.find({ userId, isActive: true });

        // Also get legacy Facebook accounts from User.socialAccounts
        const user = await User.findById(userId).select('socialAccounts');
        const legacyAccounts = [];

        if (user && user.socialAccounts && user.socialAccounts.length > 0) {
            for (const acc of user.socialAccounts) {
                // Check if this account already exists in the SocialAccount collection
                const alreadyMigrated = socialAccounts.some(
                    sa => sa.platform === acc.platform && sa.platformAccountId === acc.accountId
                );

                if (!alreadyMigrated && acc.isActive !== false) {
                    // Transform legacy format to match SocialAccount shape
                    legacyAccounts.push({
                        _id: acc._id,
                        userId: userId,
                        platform: acc.platform,
                        platformAccountId: acc.accountId,
                        accountName: acc.accountName,
                        isActive: acc.isActive !== false,
                        connectedAt: acc.connectedAt,
                        tokenExpires: acc.tokenExpires,
                        metadata: acc.metadata || {}
                    });
                }
            }
        }

        // Merge and return all accounts
        return [...socialAccounts, ...legacyAccounts];
    }

    /**
     * Get all connected accounts with decrypted tokens (internal use only)
     * @param {string} userId
     */
    static async getAccountsWithTokens(userId) {
        const accounts = await SocialAccount.find({ userId, isActive: true })
            .select('+accessToken +refreshToken');

        return accounts.map(account => {
            if (account.accessToken) account.accessToken = decrypt(account.accessToken);
            if (account.refreshToken) account.refreshToken = decrypt(account.refreshToken);
            return account;
        });
    }

    /**
     * Get a specific account with decrypted tokens
     */
    static async getAccount(userId, platform, accountId) {
        const account = await SocialAccount.findOne({
            userId,
            platform,
            platformAccountId: accountId
        }).select('+accessToken +refreshToken');

        if (!account) return null;

        // Decrypt tokens if found
        if (account.accessToken) account.accessToken = decrypt(account.accessToken);
        if (account.refreshToken) account.refreshToken = decrypt(account.refreshToken);

        return account;
    }

    /**
     * Get account by platform ID (for webhooks where userId is unknown)
     */
    static async getAccountByPlatformId(platform, platformAccountId) {
        const account = await SocialAccount.findOne({
            platform,
            platformAccountId,
            isActive: true
        }).select('+accessToken +refreshToken');

        if (!account) return null;

        if (account.accessToken) account.accessToken = decrypt(account.accessToken);
        if (account.refreshToken) account.refreshToken = decrypt(account.refreshToken);

        return account;
    }

    /**
     * Connect or update an account with encrypted tokens
     */
    static async connectAccount(userId, data) {
        const { platform, accountId, name, accessToken, refreshToken, expires, metadata } = data;

        const filter = { userId, platform, platformAccountId: accountId };
        const update = {
            accountName: name,
            accessToken: encrypt(accessToken), // Encrypt
            isActive: true,
            lastUsed: new Date(),
            connectedAt: new Date(),
            metadata
        };

        if (refreshToken) update.refreshToken = encrypt(refreshToken); // Encrypt
        if (expires) update.tokenExpires = expires;

        const account = await SocialAccount.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        });

        // Return the saved account (tokens are encrypted in DB)
        // If caller needs decrypted, they should use getAccount or use the input they provided
        return account;
    }

    /**
     * Update account metadata (e.g., follower count)
     */
    static async updateAccountMetadata(userId, accountId, updates) {
        const updateObj = {};
        if (updates.followerCount !== undefined) {
            updateObj.followerCount = updates.followerCount;
        }
        if (updates.avatarUrl !== undefined) {
            updateObj.avatarUrl = updates.avatarUrl;
        }
        if (Object.keys(updateObj).length === 0) return null;

        return await SocialAccount.findOneAndUpdate(
            { userId, _id: accountId },
            { $set: updateObj },
            { new: true }
        );
    }

    /**
     * Disconnect an account (soft delete)
     */
    static async disconnectAccount(userId, accountId) {
        return await SocialAccount.findOneAndUpdate(
            { userId, _id: accountId },
            { isActive: false },
            { new: true }
        );
    }

    /**
     * Migrate a user's embedded accounts to the new collection
     * @param {string} userId 
     */
    static async migrateUserAccounts(userId) {
        const user = await User.findById(userId);
        if (!user || !user.socialAccounts) return;

        let migrated = 0;
        for (const oldAcc of user.socialAccounts) {
            try {
                // Check if already exists to avoid duplicates
                const exists = await SocialAccount.findOne({
                    userId,
                    platform: oldAcc.platform,
                    platformAccountId: oldAcc.accountId
                });

                if (!exists) {
                    await SocialAccount.create({
                        userId,
                        platform: oldAcc.platform,
                        platformAccountId: oldAcc.accountId,
                        accountName: oldAcc.accountName,
                        accessToken: encrypt(oldAcc.accessToken), // Encrypt
                        refreshToken: oldAcc.refreshToken ? encrypt(oldAcc.refreshToken) : undefined, // Encrypt
                        tokenExpires: oldAcc.tokenExpires,
                        isActive: oldAcc.isActive,
                        connectedAt: oldAcc.connectedAt
                    });
                    migrated++;
                }
            } catch (e) {
                console.error(`Failed to migrate account ${oldAcc.accountId}:`, e.message);
            }
        }
        console.log(`Migrated ${migrated} accounts for user ${userId}`);
        return migrated;
    }
}

module.exports = AccountService;
