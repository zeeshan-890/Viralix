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

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { settings } },
            { new: true }
        ).select('-password');

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

        res.json({ message: 'Social account added successfully', socialAccounts: user.socialAccounts });
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
        const user = await User.findById(req.user.id).select('socialAccounts');
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

module.exports = router;
