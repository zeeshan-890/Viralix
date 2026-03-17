const express = require('express');
const auth = require('../middleware/auth');
const BioPage = require('../models/BioPage');
const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  PUBLIC ACCESS (No Auth)
// ─────────────────────────────────────────────────────────────

// GET /api/bio-pages/public/:slug — fetch page content for public view
router.get('/public/:slug', async (req, res) => {
    try {
        const page = await BioPage.findOne({ slug: req.params.slug.toLowerCase(), isPublished: true })
            .select('-userId -createdAt -updatedAt') // hide internal fields
            .lean();

        if (!page) return res.status(404).json({ message: 'Page not found' });

        // Async increment view count (fire & forget)
        try {
            await BioPage.updateOne({ _id: page._id }, { $inc: { 'stats.views': 1 } });
        } catch (_) { }

        res.json(page);
    } catch (e) {
        console.error('[BioPage] Public fetch error:', e.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/bio-pages/click/:id/:buttonId — track button click
router.post('/click/:id/:buttonId', async (req, res) => {
    try {
        await BioPage.updateOne(
            { _id: req.params.id, 'buttons._id': req.params.buttonId },
            { $inc: { 'buttons.$.clicks': 1 } }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Tracking failed' });
    }
});

// ─────────────────────────────────────────────────────────────
//  MANAGEMENT (Auth Required)
// ─────────────────────────────────────────────────────────────

// GET /api/bio-pages — list user's pages
router.get('/', auth, async (req, res) => {
    try {
        const pages = await BioPage.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ pages });
    } catch (e) {
        res.status(500).json({ message: 'List failed' });
    }
});

// POST /api/bio-pages — create new page
router.post('/', auth, async (req, res) => {
    try {
        const { slug } = req.body;
        if (!slug) return res.status(400).json({ message: 'Slug is required' });

        // Check if slug taken globally
        const existing = await BioPage.findOne({ slug: slug.toLowerCase() });
        if (existing) return res.status(409).json({ message: 'Slug already taken' });

        const page = new BioPage({
            userId: req.user.id,
            slug: slug.toLowerCase(),
            profile: { title: 'New Page' },
            buttons: [],
            theme: { id: 'simple-light', background: '#ffffff', textColor: '#000000', buttonColor: '#f3f4f6', buttonTextColor: '#000000' }
        });

        await page.save();
        res.status(201).json({ page });
    } catch (e) {
        console.error('[BioPage] Create error:', e.message);
        res.status(500).json({ message: 'Create failed' });
    }
});

// GET /api/bio-pages/:id — get single page details for editing
router.get('/:id', auth, async (req, res) => {
    try {
        const page = await BioPage.findOne({ _id: req.params.id, userId: req.user.id });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json({ page });
    } catch (e) {
        res.status(500).json({ message: 'Fetch failed' });
    }
});

// PATCH /api/bio-pages/:id — update page
router.patch('/:id', auth, async (req, res) => {
    try {
        const { profile, theme, buttons, socials, isPublished, slug } = req.body;
        const update = {};

        if (profile) update.profile = profile;
        if (theme) update.theme = theme;
        if (buttons) update.buttons = buttons;
        if (socials) update.socials = socials;
        if (typeof isPublished === 'boolean') update.isPublished = isPublished;

        // If changing slug, check uniqueness
        if (slug) {
            const existing = await BioPage.findOne({ slug: slug.toLowerCase(), _id: { $ne: req.params.id } });
            if (existing) return res.status(409).json({ message: 'Slug already taken' });
            update.slug = slug.toLowerCase();
        }

        const page = await BioPage.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: update },
            { new: true }
        );

        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json({ page });

    } catch (e) {
        console.error('[BioPage] Update error:', e.message);
        res.status(500).json({ message: 'Update failed' });
    }
});

// DELETE /api/bio-pages/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const page = await BioPage.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

module.exports = router;
