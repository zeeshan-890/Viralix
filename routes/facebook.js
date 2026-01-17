const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const AccountService = require('../services/account.service');
const { buildAuthUrl, exchangeCodeForToken, exchangeForLongLivedToken, getMe, getPages, getPermissions, getAllPages, enrichPagesWithInstagram, getPageFeed, getPageInsights, createPagePost, createPagePhoto, createPageVideo, createPagePhotoUpload, createPageVideoUpload, subscribePageToWebhooks } = require('../services/facebook');
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

// Stateless signed OAuth state (avoids in-memory storage & multi-dyno issues)
// Format (before base64url): userId.timestamp.nonce.signature
// signature = HMAC_SHA256(userId.timestamp.nonce, FB_STATE_SECRET || JWT_SECRET)
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const STATE_SECRET = process.env.FB_STATE_SECRET || process.env.JWT_SECRET || 'change_me_state_secret';
function signState(userId) {
    const ts = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const payload = `${userId}.${ts}.${nonce}`;
    const sig = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex');
    return Buffer.from(`${payload}.${sig}`).toString('base64url');
}
function verifyState(state) {
    try {
        const raw = Buffer.from(state, 'base64url').toString('utf8');
        const parts = raw.split('.');
        if (parts.length !== 4) return null;
        const [userId, tsStr, nonce, sig] = parts;
        const payload = `${userId}.${tsStr}.${nonce}`;
        const expected = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex');
        if (sig !== expected) return null;
        const ts = parseInt(tsStr, 10);
        if (!ts || (Date.now() - ts) > STATE_TTL_MS) return null; // expired
        return userId;
    } catch (_) {
        return null;
    }
}

// New: return the FB OAuth dialog URL instead of redirecting (Option A)
router.get('/oauth/start-url', auth, async (req, res) => {
    const state = signState(req.user.id);
    const url = buildAuthUrl(state);
    console.log('[FB] oauth/start-url issued', { userId: req.user.id });
    res.json({ url });
});

// Legacy direct redirect endpoint (still works if authorized via header)
router.get('/oauth/start', auth, async (req, res) => {
    const state = signState(req.user.id);
    const url = buildAuthUrl(state);
    console.log('[FB] oauth/start redirect', { userId: req.user.id });
    return res.redirect(url);
});

// Callback cannot rely on Authorization header (popup navigation), so it is PUBLIC and uses state lookup.
router.get('/oauth/callback', async (req, res) => {
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
        if (!state) return res.status(400).send('Missing state');
        const userId = verifyState(state);
        if (!userId) return res.status(400).send('Invalid or expired state');

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

        const user = await User.findById(userId);
        if (!user) return res.status(401).send('Unauthorized');

        // Store Facebook account in SocialAccount collection (like other platforms)
        await AccountService.connectAccount(userId, {
            platform: 'facebook',
            accountId: me.id,
            name: me.name,
            accessToken: long.access_token,
            refreshToken: null, // FB doesn't use refresh tokens
            expires: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : undefined,
            metadata: {
                permissions: (perms || []).filter(p => p.status === 'granted').map(p => p.permission)
            }
        });

        // Auto-subscribe pages to webhooks (Fire and forget or parallel await)
        if (pages?.length) {
            console.log(`[FB] Subscribing ${pages.length} pages to webhooks...`);
            Promise.all(pages.map(p => {
                const token = p.access_token || p.accessToken;
                if (token) return subscribePageToWebhooks(p.id, token);
            })).then(() => console.log('[FB] Page subscriptions complete'))
                .catch(e => console.error('[FB] Page subscription error:', e.message));
        }

        // Persist normalized Pages under user.settings for now (pages have their own tokens)
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
        const saved = await User.findById(userId).lean();
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
    try {
        const accounts = await AccountService.getAccounts(req.user.id);
        const fb = accounts.find(a => a.platform === 'facebook');
        const user = await User.findById(req.user.id).select('settings').lean();
        const pages = (user?.settings?.facebookPages || []).map(p => ({ id: p.id || p.pageId, name: p.name, category: p.category }));
        console.log('[FB] status pages count:', pages.length, 'default:', user?.settings?.facebookDefaultPageId || null);
        return res.json({
            connected: !!fb,
            account: fb ? { id: fb.platformAccountId, name: fb.accountName } : null,
            pages,
            defaultPageId: user?.settings?.facebookDefaultPageId || null,
        });
    } catch (err) {
        console.error('[FB] status error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/disconnect', auth, async (req, res) => {
    try {
        // Find and disconnect from SocialAccount collection
        const accounts = await AccountService.getAccounts(req.user.id);
        const fb = accounts.find(a => a.platform === 'facebook');
        if (fb && fb._id) {
            await AccountService.disconnectAccount(req.user.id, fb._id);
        }
        // Also clear pages from user settings
        const user = await User.findById(req.user.id);
        if (user && user.settings) {
            user.settings.facebookPages = undefined;
            user.settings.facebookDefaultPageId = undefined;
            user.markModified('settings');
            await user.save();
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('[FB] disconnect error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Refresh connected pages list
router.post('/refresh', auth, async (req, res) => {
    try {
        const fb = await AccountService.getAccount(req.user.id, 'facebook', null);
        // Fallback: find any facebook account
        let accessToken = fb?.accessToken;
        if (!accessToken) {
            const accounts = await AccountService.getAccountsWithTokens(req.user.id);
            const fbAcc = accounts.find(a => a.platform === 'facebook');
            accessToken = fbAcc?.accessToken;
        }
        if (!accessToken) return res.status(400).json({ message: 'Facebook not connected' });

        let pages = await getAllPages(accessToken);
        pages = await enrichPagesWithInstagram(pages);
        console.log('[FB] refresh pages count:', pages?.length || 0);

        // Auto-subscribe pages on refresh too
        if (pages?.length) {
            Promise.all(pages.map(p => {
                const token = p.access_token || p.accessToken;
                if (token) return subscribePageToWebhooks(p.id, token);
            })).catch(e => console.error('[FB] Refresh subscription error:', e.message));
        }

        const user = await User.findById(req.user.id);
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
