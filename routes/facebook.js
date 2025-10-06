const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { buildAuthUrl, exchangeCodeForToken, exchangeForLongLivedToken, getMe, getPages, getPermissions, getAllPages, enrichPagesWithInstagram, getPageFeed, getPageInsights, createPagePost, createPagePhoto, createPageVideo, createPagePhotoUpload, createPageVideoUpload } = require('../services/facebook');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

const router = express.Router();

// Ensure consistent page object shape
function normalizePages(pages = []) {
    return (pages || []).map(p => ({
        id: p.id || p.pageId,
        name: p.name,
        category: p.category,
        accessToken: p.access_token || p.accessToken,
        instagramId: p.instagramId || p.instagram_business_account?.id || p.connected_instagram_account?.id || null,
    }));
}

function setStateCookie(res, value) {
    const prod = process.env.NODE_ENV === 'production';
    res.cookie('fb_oauth_state', value, {
        httpOnly: true,
        sameSite: prod ? 'none' : 'lax',
        secure: prod, // required for SameSite=None
        path: '/',
        maxAge: 10 * 60 * 1000,
    });
}

// New: return the FB OAuth dialog URL instead of redirecting (Option A)
router.get('/oauth/start-url', auth, async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    setStateCookie(res, state);
    const url = buildAuthUrl(state);
    console.log('[FB] oauth/start-url issued');
    res.json({ url });
});

// Legacy direct redirect endpoint (still works if authorized via header)
router.get('/oauth/start', auth, async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    setStateCookie(res, state);
    const url = buildAuthUrl(state);
    console.log('[FB] oauth/start redirect');
    return res.redirect(url);
});

router.get('/oauth/callback', auth, async (req, res) => {
    try {
        const { code, state, error, error_code, error_message } = req.query;
        if (error || error_code) {
            console.error('[FB] oauth/callback error:', { error, error_code, error_message });
            const origin = process.env.CLIENT_URL || 'http://localhost:3000';
            return res.status(400).send(`
            <html><body>
            <script>
                try {
                    window.opener && window.opener.postMessage(
                        { provider: 'facebook', status: 'error', error: ${JSON.stringify(error || 'oauth_error')}, code: ${JSON.stringify(error_code || null)}, message: ${JSON.stringify(error_message || 'Facebook Login failed')} },
                        '${origin}'
                    );
                } catch (e) { /* ignore */ }
                window.close();
            </script>
            Facebook connection failed: ${error_message || error || 'Unknown error'}
            </body></html>
        `);
        }
        const cookieState = req.cookies['fb_oauth_state'];
        if (!state || !cookieState || state !== cookieState) {
            return res.status(400).send('Invalid state');
        }
        res.clearCookie('fb_oauth_state');

        const short = await exchangeCodeForToken(code);
        const long = await exchangeForLongLivedToken(short.access_token);

        const me = await getMe(long.access_token);
        let pages = await getAllPages(long.access_token);
        pages = await enrichPagesWithInstagram(pages);
        const perms = await getPermissions(long.access_token);

        console.log('[FB] me:', { id: me.id, name: me.name });
        console.log('[FB] permissions (granted):', (perms || []).filter(p => p.status === 'granted').map(p => p.permission));
        console.log('[FB] pages count:', pages?.length || 0);
        if ((pages?.length || 0) > 0) {
            console.log('[FB] sample page:', { id: pages[0].id, name: pages[0].name, category: pages[0].category });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).send('Unauthorized');

        // Upsert into socialAccounts for platform 'facebook' (one record per FB user)
        const existingIdx = user.socialAccounts.findIndex(
            a => a.platform === 'facebook' && a.accountId === me.id
        );
        const record = {
            platform: 'facebook',
            accountId: me.id,
            accountName: me.name,
            accessToken: long.access_token,
            tokenExpires: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : undefined,
            connectedAt: new Date(),
            isActive: true,
        };
        if (existingIdx >= 0) user.socialAccounts[existingIdx] = record; else user.socialAccounts.push(record);
        // Persist normalized Pages under settings for now
        user.settings = user.settings || {};
        const normalized = normalizePages(pages);
        user.settings.facebookPages = normalized;
        if (!user.settings.facebookDefaultPageId && normalized[0]) {
            user.settings.facebookDefaultPageId = normalized[0].id;
        }
        // Ensure nested changes persist
        user.markModified('settings');
        await user.save();
        // Confirm saved
        const saved = await User.findById(req.user.id).lean();
        console.log('[FB] saved pages count:', saved?.settings?.facebookPages?.length || 0);

        const origin = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.send(`
      <html><body>
      <script>
        window.opener && window.opener.postMessage(
          { provider: 'facebook', status: 'success' },
          '${origin}'
        );
        window.close();
      </script>
      Connected. You can close this window.
      </body></html>
    `);
    } catch (err) {
        console.error('FB OAuth error:', err?.response?.data || err.message);
        return res.status(500).send('Facebook connection failed');
    }
});

router.get('/status', auth, async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const fb = user.socialAccounts?.find(a => a.platform === 'facebook');
    const pages = (user.settings?.facebookPages || []).map(p => ({ id: p.id || p.pageId, name: p.name, category: p.category }));
    console.log('[FB] status pages count:', pages.length, 'default:', user.settings?.facebookDefaultPageId || null);
    return res.json({
        connected: !!fb,
        account: fb ? { id: fb.accountId, name: fb.accountName } : null,
        pages,
        defaultPageId: user.settings?.facebookDefaultPageId || null,
    });
});

router.delete('/disconnect', auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    user.socialAccounts = (user.socialAccounts || []).filter(a => a.platform !== 'facebook');
    if (user.settings) user.settings.facebookPages = undefined;
    await user.save();
    return res.json({ ok: true });
});

// Refresh connected pages list
router.post('/refresh', auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const fb = (user.socialAccounts || []).find(a => a.platform === 'facebook');
    if (!fb) return res.status(400).json({ message: 'Facebook not connected' });
    try {
        let pages = await getAllPages(fb.accessToken);
        pages = await enrichPagesWithInstagram(pages);
        console.log('[FB] refresh pages count:', pages?.length || 0);
        user.settings = user.settings || {};
        user.settings.facebookPages = normalizePages(pages);
        user.markModified('settings');
        await user.save();
        return res.json({ ok: true, pages: user.settings.facebookPages });
    } catch (e) {
        console.error('FB refresh error:', e?.response?.data || e.message);
        return res.status(500).json({ message: 'Failed to refresh pages' });
    }
});

// Set default page for posting
router.post('/default-page', auth, async (req, res) => {
    const { pageId } = req.body || {};
    if (!pageId) return res.status(400).json({ message: 'pageId is required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const hasPage = (user.settings?.facebookPages || []).some(p => p.id === pageId);
    if (!hasPage) return res.status(400).json({ message: 'Unknown pageId' });
    user.settings = user.settings || {};
    user.settings.facebookDefaultPageId = pageId;
    user.markModified('settings');
    await user.save();
    return res.json({ ok: true, defaultPageId: pageId });
});

// Dev-only: quick diagnose endpoint to inspect permissions and raw pages
router.get('/diagnose', auth, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') return res.status(404).end();
        const user = await User.findById(req.user.id).lean();
        const fb = user?.socialAccounts?.find(a => a.platform === 'facebook');
        if (!fb?.accessToken) return res.status(400).json({ message: 'Not connected' });
        const me = await getMe(fb.accessToken);
        const perms = await getPermissions(fb.accessToken);
        const directPages = await getPages(fb.accessToken);
        const pages = await getAllPages(fb.accessToken);
        return res.json({
            me,
            granted: (perms || []).filter(p => p.status === 'granted').map(p => p.permission),
            declined: (perms || []).filter(p => p.status === 'declined').map(p => p.permission),
            pagesRawCount: pages?.length || 0,
            directPagesCount: directPages?.length || 0,
            samplePage: pages?.[0] || null,
        });
    } catch (e) {
        return res.status(500).json({ message: e?.response?.data || e.message });
    }
});

// Helper to get a user's stored page access token by pageId
async function resolvePageAccess(userId, pageId) {
    const user = await User.findById(userId).lean();
    const page = user?.settings?.facebookPages?.find(p => (p.id || p.pageId) === pageId);
    if (!page) return { token: null, error: 'Unknown pageId' };
    const token = page.accessToken || page.access_token;
    return { token, page };
}

// Get page feed
router.get('/pages/:pageId/feed', auth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
        const feed = await getPageFeed(pageId, token, limit);
        return res.json({ feed });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

// Get page insights
router.get('/pages/:pageId/insights', auth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const metrics = req.query.metrics || 'page_impressions,page_engaged_users,page_fans';
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const insights = await getPageInsights(pageId, token, metrics);
        return res.json({ insights });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

// Create a text/link post
router.post('/pages/:pageId/post', auth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { message, link } = req.body || {};
        if (!message && !link) return res.status(400).json({ message: 'message or link required' });
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const result = await createPagePost(pageId, token, message, link);
        return res.json({ ok: true, result });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

// Create a photo post by URL
router.post('/pages/:pageId/photo', auth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { url, caption } = req.body || {};
        if (!url) return res.status(400).json({ message: 'url is required' });
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const result = await createPagePhoto(pageId, token, url, caption);
        return res.json({ ok: true, result });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

// Upload photo (multipart)
router.post('/pages/:pageId/photo-upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { pageId } = req.params;
        const { caption } = req.body || {};
        if (!req.file) return res.status(400).json({ message: 'file is required' });
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const result = await createPagePhotoUpload(pageId, token, req.file.buffer, req.file.originalname, caption);
        return res.json({ ok: true, result });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

// Create a video post by file URL
router.post('/pages/:pageId/video', auth, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { fileUrl, description } = req.body || {};
        if (!fileUrl) return res.status(400).json({ message: 'fileUrl is required' });
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const result = await createPageVideo(pageId, token, fileUrl, description);
        return res.json({ ok: true, result });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

// Upload video (multipart)
router.post('/pages/:pageId/video-upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { pageId } = req.params;
        const { description } = req.body || {};
        if (!req.file) return res.status(400).json({ message: 'file is required' });
        const { token } = await resolvePageAccess(req.user.id, pageId);
        if (!token) return res.status(400).json({ message: 'Unknown pageId' });
        const result = await createPageVideoUpload(pageId, token, req.file.buffer, req.file.originalname, description);
        return res.json({ ok: true, result });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data || e.message });
    }
});

module.exports = router;
