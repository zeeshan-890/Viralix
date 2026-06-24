const express = require('express');
const auth = require('../middleware/auth');
const AccountService = require('../services/account.service');
const SocialAccount = require('../models/SocialAccount');
const InstagramPublishLog = require('../models/InstagramPublishLog');
const { mountInstagramPublishRoutes } = require('../services/instagramPublishRoutes');

const router = express.Router();

async function loadAccountWithToken(userId, accountId) {
    const account = await SocialAccount.findOne({
        _id: accountId,
        userId,
        platform: 'instagram',
        isActive: true
    }).select('+accessToken');
    if (!account) throw new Error('Instagram account not found');
    const { decrypt } = require('../utils/encryption');
    return {
        account: { id: account._id },
        token: decrypt(account.accessToken),
        igUserId: account.platformAccountId
    };
}

async function touchAccount(accountId) {
    await SocialAccount.findByIdAndUpdate(accountId, { lastUsed: new Date() });
}

// GET /api/instagram-publish/accounts
router.get('/accounts', auth, async (req, res) => {
    try {
        const accounts = await AccountService.getAccounts(req.user.id);
        const igAccounts = accounts.filter((a) => a.platform === 'instagram');
        res.json({
            accounts: igAccounts.map((a) => ({
                id: a._id,
                igUserId: a.platformAccountId,
                username: a.metadata?.username || a.accountName,
                accountType: a.metadata?.accountType,
                profilePictureUrl: a.metadata?.profilePicture || a.avatarUrl,
                connectedAt: a.connectedAt,
                tokenExpires: a.tokenExpires
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/instagram-publish/accounts/:id
router.delete('/accounts/:id', auth, async (req, res) => {
    try {
        const result = await AccountService.disconnectAccount(req.user.id, req.params.id);
        if (!result) return res.status(404).json({ message: 'Account not found' });
        res.json({ message: 'Instagram account disconnected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const publishRouter = express.Router();
publishRouter.use(auth);
mountInstagramPublishRoutes(publishRouter, {
    PublishLog: InstagramPublishLog,
    loadAccountWithToken,
    touchAccount,
    logPrefix: '[instagramPublish]'
});
router.use(publishRouter);

module.exports = router;
