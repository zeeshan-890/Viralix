const express = require('express');
const router = express.Router();
const AccountService = require('../services/account.service');
const { verifyToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @route   GET /api/platforms/connected
 * @desc    Get all connected social accounts for the current user
 * @access  Private
 */
router.get('/connected', async (req, res) => {
    try {
        const accounts = await AccountService.getAccounts(req.user.id);

        // Transform for frontend if needed, or return as is.
        // Frontend expects: { facebook: [...], instagram: [...], youtube: [...], tiktok: [...] } 
        // OR a flat list. The previous implementation (PlatformSelector) seemed to expect a list of objects.
        // Let's standardise the response.

        // Group by platform for easier consumption, or return flat list
        // Returning flat list is often more flexible for "all accounts" views

        res.json({
            success: true,
            count: accounts.length,
            accounts: accounts,
            // Helper groupings
            byPlatform: {
                facebook: accounts.filter(a => a.platform === 'facebook'),
                instagram: accounts.filter(a => a.platform === 'instagram'),
                tiktok: accounts.filter(a => a.platform === 'tiktok'),
                youtube: accounts.filter(a => a.platform === 'youtube'),
                twitter: accounts.filter(a => a.platform === 'twitter'),
                linkedin: accounts.filter(a => a.platform === 'linkedin')
            }
        });
    } catch (err) {
        console.error('Error fetching connected accounts:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
