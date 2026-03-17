const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    auth,
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, avatar } = req.body;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (avatar) updateFields.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
    try {
        const { settings } = req.body;

        // Use dot-notation so we merge into existing settings instead of overwriting
        // (protects watermark, timezone, and other nested settings from being clobbered)
        const update = {};
        for (const [key, value] of Object.entries(settings || {})) {
            update[`settings.${key}`] = value;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: update },
            { new: true }
        ).select('-password -socialAccounts.accessToken -socialAccounts.refreshToken');

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/social-accounts
// @desc    Add social media account
// @access  Private
router.post('/social-accounts', [
    auth,
    body('platform', 'Platform is required').isIn(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube']),
    body('accountId', 'Account ID is required').not().isEmpty(),
    body('accountName', 'Account name is required').not().isEmpty(),
    body('accessToken', 'Access token is required').not().isEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { platform, accountId, accountName, accessToken, refreshToken, tokenExpires } = req.body;

        const user = await User.findById(req.user.id);

        // Check if account already exists
        const existingAccount = user.socialAccounts.find(
            acc => acc.platform === platform && acc.accountId === accountId
        );

        if (existingAccount) {
            return res.status(400).json({ message: 'Account already connected' });
        }

        user.socialAccounts.push({
            platform,
            accountId,
            accountName,
            accessToken,
            refreshToken,
            tokenExpires: tokenExpires ? new Date(tokenExpires) : null
        });

        await user.save();

        res.json({
            message: 'Social account added successfully',
            socialAccounts: user.socialAccounts.map(a => ({
                _id: a._id,
                platform: a.platform,
                accountId: a.accountId,
                accountName: a.accountName,
                tokenExpires: a.tokenExpires,
                connected: a.connected
            }))
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/users/social-accounts/:accountId
// @desc    Remove social media account
// @access  Private
router.delete('/social-accounts/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        user.socialAccounts = user.socialAccounts.filter(
            acc => acc._id.toString() !== req.params.accountId
        );

        await user.save();

        res.json({ message: 'Social account removed successfully', socialAccounts: user.socialAccounts });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/users/social-accounts
// @desc    Get user's social media accounts
// @access  Private
router.get('/social-accounts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('socialAccounts.platform socialAccounts.accountId socialAccounts.accountName socialAccounts.tokenExpires socialAccounts.connected socialAccounts._id');
        res.json(user.socialAccounts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/users/subscription
// @desc    Update user subscription
// @access  Private
router.put('/subscription', auth, async (req, res) => {
    try {
        // Only admins can change subscription plans
        const currentUser = await User.findById(req.user.id).select('role');
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update subscriptions' });
        }

        const { plan, status, endDate } = req.body;

        const updateFields = {};
        if (plan) updateFields['subscription.plan'] = plan;
        if (status) updateFields['subscription.status'] = status;
        if (endDate) updateFields['subscription.endDate'] = new Date(endDate);

        // Set limits based on plan
        if (plan) {
            const limits = {
                free: { postsLimit: 10, accountsLimit: 3 },
                basic: { postsLimit: 50, accountsLimit: 5 },
                pro: { postsLimit: 200, accountsLimit: 10 },
                enterprise: { postsLimit: -1, accountsLimit: -1 }
            };

            if (limits[plan]) {
                updateFields['subscription.postsLimit'] = limits[plan].postsLimit;
                updateFields['subscription.accountsLimit'] = limits[plan].accountsLimit;
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all related data
// @access  Private
router.delete('/account', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Import all models that have user-related data
        const SocialAccount = require('../models/SocialAccount');
        const Post = require('../models/Post');
        const PlatformContent = require('../models/PlatformContent');
        const AutoReplyRule = require('../models/AutoReplyRule');
        const PublishJob = require('../models/PublishJob');
        const KeywordAlert = require('../models/KeywordAlert');
        const HashtagSet = require('../models/HashtagSet');
        const Conversation = require('../models/Conversation');
        const Message = require('../models/Message');
        const Competitor = require('../models/Competitor');
        const Comment = require('../models/Comment');
        const BioPage = require('../models/BioPage');
        const ShortLink = require('../models/ShortLink');

        console.log(`[Account Deletion] Starting deletion for user: ${userId}`);

        // First, find all conversations to delete their messages
        const conversations = await Conversation.find({ userId }).select('_id');
        const conversationIds = conversations.map(c => c._id);

        // Delete all related data in parallel
        // Note: Post uses 'user' field; all other models use 'userId'
        const deletionResults = await Promise.allSettled([
            SocialAccount.deleteMany({ userId }),
            Post.deleteMany({ user: userId }),
            PlatformContent.deleteMany({ userId }),
            AutoReplyRule.deleteMany({ userId }),
            PublishJob.deleteMany({ userId }),
            KeywordAlert.deleteMany({ userId }),
            HashtagSet.deleteMany({ userId }),
            Message.deleteMany({ conversationId: { $in: conversationIds } }),
            Conversation.deleteMany({ userId }),
            Competitor.deleteMany({ userId }),
            Comment.deleteMany({ userId }),
            BioPage.deleteMany({ userId }),
            ShortLink.deleteMany({ userId })
        ]);

        // Log deletion results
        const collections = [
            'SocialAccount', 'Post', 'PlatformContent', 'AutoReplyRule', 'PublishJob',
            'KeywordAlert', 'HashtagSet', 'Message', 'Conversation',
            'Competitor', 'Comment', 'BioPage', 'ShortLink'
        ];
        deletionResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`[Account Deletion] Deleted ${result.value.deletedCount} ${collections[index]} records`);
            } else {
                console.error(`[Account Deletion] Failed to delete ${collections[index]}:`, result.reason);
            }
        });

        // Finally, delete the user
        await User.findByIdAndDelete(userId);
        console.log(`[Account Deletion] User ${userId} deleted successfully`);

        res.json({
            success: true,
            message: 'Account and all related data deleted successfully'
        });
    } catch (error) {
        console.error('[Account Deletion] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
});

module.exports = router;
