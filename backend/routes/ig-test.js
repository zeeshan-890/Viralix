const express = require('express');
const auth = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const igTest = require('../services/igTest');
const IgTestAccount = require('../models/igtest/IgTestAccount');
const IgTestPublishLog = require('../models/igtest/IgTestPublishLog');
const { mountInstagramPublishRoutes } = require('../services/instagramPublishRoutes');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const RETURN_PATH = '/dashboard/ig-test';

function redirectBack(res, params) {
    const qs = new URLSearchParams(params).toString();
    return res.redirect(`${CLIENT_URL}${RETURN_PATH}?${qs}`);
}

router.get('/connect', auth, async (req, res) => {
    try {
        const state = igTest.signState(req.user.id);
        res.json({ authUrl: igTest.buildAuthUrl(state) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;
    if (error) return redirectBack(res, { error: error_description || error });
    if (!code || !state) return redirectBack(res, { error: 'missing_code_or_state' });

    try {
        const userId = igTest.verifyState(state);
        const { shortLivedToken, igUserId: oauthUserId } = await igTest.exchangeCodeForToken(code);
        const { accessToken, expiresAt } = await igTest.getLongLivedToken(shortLivedToken);
        const profile = await igTest.getProfile(oauthUserId, accessToken);
        const igUserId = String(profile.user_id || oauthUserId);

        await IgTestAccount.findOneAndUpdate(
            { userId, igUserId },
            {
                userId, igUserId,
                username: profile.username || String(igUserId),
                accountType: profile.account_type,
                profilePictureUrl: profile.profile_picture_url,
                accessToken: encrypt(accessToken),
                tokenExpires: expiresAt,
                connectedAt: new Date(),
                lastUsed: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return redirectBack(res, { success: 'instagram_connected', username: profile.username || igUserId });
    } catch (err) {
        console.error('[igTest] callback error:', err.response?.data || err.message);
        const msg = err.response?.data?.error_message || err.response?.data?.error?.message || err.message;
        return redirectBack(res, { error: msg });
    }
});

router.get('/accounts', auth, async (req, res) => {
    try {
        const accounts = await IgTestAccount.find({ userId: req.user.id }).sort({ connectedAt: -1 });
        res.json({
            accounts: accounts.map((a) => ({
                id: a._id,
                igUserId: a.igUserId,
                username: a.username,
                accountType: a.accountType,
                profilePictureUrl: a.profilePictureUrl,
                connectedAt: a.connectedAt,
                tokenExpires: a.tokenExpires
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/accounts/:id', auth, async (req, res) => {
    try {
        await IgTestAccount.deleteOne({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Instagram test account disconnected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function loadAccountWithToken(userId, accountId) {
    const account = await IgTestAccount.findOne({ _id: accountId, userId }).select('+accessToken');
    if (!account) throw new Error('Account not found');
    return {
        account: { id: account._id },
        token: decrypt(account.accessToken),
        igUserId: account.igUserId
    };
}

async function touchAccount(accountId) {
    await IgTestAccount.findByIdAndUpdate(accountId, { lastUsed: new Date() });
}

const publishRouter = express.Router();
publishRouter.use(auth);
mountInstagramPublishRoutes(publishRouter, {
    PublishLog: IgTestPublishLog,
    loadAccountWithToken,
    touchAccount,
    logPrefix: '[igTest]'
});
router.use(publishRouter);

module.exports = router;
