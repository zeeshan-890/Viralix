const express = require('express');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { enforceTenantQuota } = require('../middleware/tenantQuota');
const { suggestCaption, suggestHashtags, rewriteText } = require('../services/ai');

const router = express.Router();

router.use(aiLimiter);
router.use(auth);
router.use(enforceTenantQuota('ai_minutely'));

router.post('/caption', async (req, res) => {
    try {
        const { topic, tone, platform } = req.body || {};
        if (!topic) return res.status(400).json({ message: 'topic is required' });
        const text = await suggestCaption({ topic, tone, platform });
        res.json({ text });
    } catch (e) {
        console.error('AI caption error:', e.message);
        res.status(500).json({ message: 'AI error' });
    }
});

router.post('/hashtags', async (req, res) => {
    try {
        const { topic, platform, count } = req.body || {};
        if (!topic) return res.status(400).json({ message: 'topic is required' });
        const list = await suggestHashtags({ topic, platform, count });
        res.json({ hashtags: list });
    } catch (e) {
        console.error('AI hashtags error:', e.message);
        res.status(500).json({ message: 'AI error' });
    }
});

router.post('/rewrite', async (req, res) => {
    try {
        const { text, tone, platform } = req.body || {};
        if (!text) return res.status(400).json({ message: 'text is required' });
        const out = await rewriteText({ text, tone, platform });
        res.json({ text: out });
    } catch (e) {
        console.error('AI rewrite error:', e.message);
        res.status(500).json({ message: 'AI error' });
    }
});

module.exports = router;
