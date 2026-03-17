const express = require('express');
const router = express.Router();
const AccountService = require('../services/account.service');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

/**
 * @route   GET /api/platforms/connected
 * @desc    Get all connected social accounts for the current user
 * @access  Private
 */
router.get('/connected', async (req, res) => {
    try {
        const accounts = await AccountService.getAccounts(req.user.id);

        // Fetch user settings to get Facebook Pages
        const user = await User.findById(req.user.id);
        const fbPages = user?.settings?.facebookPages || [];

        // If we have Facebook Pages, we should expose THEM as the "accounts" to select,
        // and hide the main "Facebook User" account to prevent posting to Profile (which fails).
        let finalAccounts = accounts;

        if (fbPages.length > 0) {
            // Remove the generic "facebook" platform account (the User)
            finalAccounts = accounts.filter(a => a.platform !== 'facebook');

            // Add the Pages as "facebook" accounts
            fbPages.forEach(page => {
                finalAccounts.push({
                    _id: `page-${page.id}`, // Synthetic ID for frontend keys
                    platform: 'facebook',
                    accountId: page.id, // This is the Page ID!
                    accountName: page.name,
                    platformAccountId: page.id,
                    avatar: null, // Could fetch if needed
                    connectedAt: new Date(),
                    isActive: true
                });
            });
        }

        console.log('[platforms/connected] userId:', req.user.id);
        console.log('[platforms/connected] final count:', finalAccounts.length);

        res.json({
            success: true,
            count: finalAccounts.length,
            accounts: finalAccounts,
            // Helper groupings
            byPlatform: {
                facebook: finalAccounts.filter(a => a.platform === 'facebook'),
                instagram: finalAccounts.filter(a => a.platform === 'instagram'),
                tiktok: finalAccounts.filter(a => a.platform === 'tiktok'),
                youtube: finalAccounts.filter(a => a.platform === 'youtube'),
                twitter: finalAccounts.filter(a => a.platform === 'twitter'),
                linkedin: finalAccounts.filter(a => a.platform === 'linkedin')
            }
        });
    } catch (err) {
        console.error('Error fetching connected accounts:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
