const Post = require('../models/Post');
const User = require('../models/User');
const axios = require('axios');
const {
    createPagePost,
    createPagePhoto,
    createPageVideo,
} = require('./facebook');
const {
    createMediaContainer,
    getContainerStatus,
    publishContainer,
    createDirectOAuthMediaContainer,
    getDirectOAuthContainerStatus,
    publishDirectOAuthContainer,
} = require('./instagram');
const tiktokService = require('./tiktok');

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'; // Used for direct Instagram Login tokens (Instagram API with Instagram Login)
const INSTAGRAM_BASIC_DISPLAY_URL = 'https://graph.instagram.com';

// Helper: Validate Instagram token (direct Instagram Login / no FB page linkage)
// Strategy:
// 1. Call /me?fields=id,username on graph.instagram.com (works for Instagram API with Instagram Login tokens)
// 2. If that fails with parse/invalid -> throw permanent reconnect error
// 3. If unsupported endpoint -> treat token as opaque but proceed (some transitional versions return unsupported for extra fields)
async function validateInstagramToken(accountId, token) {
    try {
        const { data } = await axios.get(`${INSTAGRAM_BASIC_DISPLAY_URL}/me`, {
            params: { fields: 'id,username', access_token: token }
        });
        if (!data?.id) throw new Error('Missing id in token validation response');
        if (accountId && String(accountId) !== String(data.id)) {
            console.warn(`[Publisher] Account ID mismatch. Stored: ${accountId} Token reports: ${data.id}`);
        }
        console.log(`[Publisher] Token validated for IG user: ${data.username || data.id}`);
        return true;
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        const errorCode = error.response?.data?.error?.code;
        console.error(`[Publisher] Token validation failed: ${errorMsg} Code: ${errorCode}`);

        if (/Cannot parse access token|Invalid OAuth access token|Malformed access token/i.test(errorMsg) || errorCode === 190) {
            throw new Error('Instagram access token is invalid or expired. Please reconnect your Instagram account.');
        }

        if (errorCode === 100 && /Unsupported request/i.test(errorMsg)) {
            console.log('[Publisher] Treating unsupported request as non-fatal (token may still work for publishing).');
            return true;
        }

        // Non-fatal: allow attempt but log
        console.warn('[Publisher] Proceeding despite validation anomaly.');
        return true;
    }
}

// Helper: Refresh Instagram token if needed
async function refreshInstagramTokenIfNeeded(user, account) {
    // Direct Instagram Login tokens (short/long-lived) only support refresh via ig_refresh_token if originally obtained with that capability.
    // If we have no expiry, skip. If token has < 7 days, attempt refresh; if unsupported, log and continue (user can reconnect later).
    const expiryDate = account.tokenExpires || account.tokenExpiry;
    if (!expiryDate) {
        console.log('[Publisher] No token expiry date stored for Instagram account. Skipping refresh.');
        return;
    }
    const msLeft = new Date(expiryDate) - Date.now();
    const daysUntilExpiry = msLeft / 86400000;
    console.log(`[Publisher] Token expires in ${daysUntilExpiry.toFixed(2)} days`);
    if (daysUntilExpiry >= 7) return;

    console.log('[Publisher] Attempting token refresh (within 7 days of expiry)...');
    try {
        const { data } = await axios.get(`${INSTAGRAM_GRAPH_URL}/refresh_access_token`, {
            params: { grant_type: 'ig_refresh_token', access_token: account.accessToken }
        });
        if (data?.access_token) {
            account.accessToken = data.access_token;
            if (data.expires_in) account.tokenExpires = new Date(Date.now() + data.expires_in * 1000);
            user.markModified('socialAccounts');
            await user.save();
            console.log('[Publisher] ✓ Instagram token refreshed');
        } else {
            console.warn('[Publisher] Refresh response missing access_token');
        }
    } catch (e) {
        const msg = e.response?.data?.error?.message || e.message;
        if (/Cannot parse access token|Invalid OAuth access token/i.test(msg)) {
            throw new Error('Instagram token is invalid and cannot be refreshed. Please reconnect your Instagram account.');
        }
        console.warn('[Publisher] Non-fatal refresh failure:', msg);
    }
}
// Helper: find page token for a user's connected account
async function resolveAuthForPlatform(user, platform) {
    if (platform.name === 'facebook') {
        const page = (user.settings?.facebookPages || []).find(p => p.id === platform.accountId);
        if (!page || !page.accessToken) throw new Error('Facebook page token not found for accountId');
        return { kind: 'facebook', pageId: page.id, token: page.accessToken };
    }
    if (platform.name === 'instagram') {
        console.log(`[Publisher] Looking for Instagram account: ${platform.accountId}`);
        console.log(`[Publisher] User has ${user.socialAccounts?.length || 0} social accounts`);

        // Check for direct OAuth Instagram account first
        const directAccount = (user.socialAccounts || []).find(
            acc => acc.platform === 'instagram' &&
                acc.accountId === platform.accountId &&
                acc.isActive
        );

        if (directAccount) {
            console.log(`[Publisher] Found direct OAuth account: ${directAccount.accountId}`);
            console.log(`[Publisher] Token present: ${!!directAccount.accessToken}, Token preview: ${directAccount.accessToken?.substring(0, 20)}...`);
            console.log(`[Publisher] Token expiry: ${directAccount.tokenExpires || directAccount.tokenExpiry || 'not set'}`);

            if (!directAccount.accessToken) {
                throw new Error('Instagram account found but token is missing. Please reconnect your account.');
            }

            try {
                console.log('[Publisher] Validating token...');
                await validateInstagramToken(directAccount.accountId, directAccount.accessToken);
            } catch (validationError) {
                console.error('[Publisher] Token validation failed (direct IG login):', validationError.message);
                throw validationError;
            }
            await refreshInstagramTokenIfNeeded(user, directAccount);
            console.log('[Publisher] Using direct Instagram Login token');
            return {
                kind: 'instagram',
                igUserId: platform.accountId,
                token: directAccount.accessToken,
                isDirect: true
            };
        } console.log(`[Publisher] No direct OAuth account found, checking Facebook-linked...`);

        // Fall back to Facebook-linked Instagram account
        const page = (user.settings?.facebookPages || []).find(p => p.instagramId === platform.accountId);
        if (!page || !page.accessToken) {
            throw new Error('Instagram account not found. Please reconnect your Instagram account.');
        }
        console.log(`[Publisher] Found Facebook-linked Instagram account`);
        return {
            kind: 'instagram',
            igUserId: platform.accountId,
            token: page.accessToken,
            isDirect: false // Flag to indicate Facebook-linked
        };
    }
    if (platform.name === 'tiktok') {
        console.log(`[Publisher] Looking for TikTok account: ${platform.accountId}`);

        const tiktokAccount = (user.socialAccounts || []).find(
            acc => acc.platform === 'tiktok' &&
                acc.accountId === platform.accountId &&
                acc.isActive
        );

        if (!tiktokAccount) {
            throw new Error('TikTok account not found. Please reconnect your TikTok account.');
        }

        if (!tiktokAccount.accessToken) {
            throw new Error('TikTok account found but token is missing. Please reconnect.');
        }

        // Check if token is expired
        if (tiktokAccount.tokenExpires && new Date(tiktokAccount.tokenExpires) < new Date()) {
            console.log('[Publisher] TikTok token expired, attempting refresh...');
            try {
                const tokenData = await tiktokService.refreshAccessToken(
                    tiktokAccount.refreshToken,
                    process.env.TIKTOK_CLIENT_KEY,
                    process.env.TIKTOK_CLIENT_SECRET
                );
                tiktokAccount.accessToken = tokenData.access_token;
                if (tokenData.refresh_token) {
                    tiktokAccount.refreshToken = tokenData.refresh_token;
                }
                tiktokAccount.tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));
                user.markModified('socialAccounts');
                await user.save();
                console.log('[Publisher] TikTok token refreshed successfully');
            } catch (refreshError) {
                console.error('[Publisher] TikTok token refresh failed:', refreshError.message);
                throw new Error('TikTok token expired and refresh failed. Please reconnect your account.');
            }
        }

        console.log(`[Publisher] Found TikTok account: ${tiktokAccount.accountName}`);
        return {
            kind: 'tiktok',
            openId: platform.accountId,
            token: tiktokAccount.accessToken,
            accountName: tiktokAccount.accountName
        };
    }
    throw new Error(`Unsupported platform: ${platform.name}`);
}

function choosePrimaryMedia(media = []) {
    if (!Array.isArray(media) || media.length === 0) return null;
    // Prefer video over image when both exist
    const video = media.find(m => m.type === 'video');
    if (video) return video;
    const image = media.find(m => m.type === 'image' || m.type === 'gif');
    return image || media[0];
}

async function publishToFacebook(auth, content, mediaList) {
    const primary = choosePrimaryMedia(mediaList);
    if (!primary) {
        // Text-only post
        const res = await createPagePost(auth.pageId, auth.token, content || '', undefined);
        return { postId: res?.id || res?.post_id };
    }
    if (primary.type === 'video') {
        const res = await createPageVideo(auth.pageId, auth.token, primary.url, content || '');
        return { postId: res?.id };
    } else {
        const res = await createPagePhoto(auth.pageId, auth.token, primary.url, content || '');
        return { postId: res?.post_id || res?.id };
    }
}

async function publishToInstagram(auth, content, mediaList) {
    console.log(`[Publisher] publishToInstagram called - igUserId: ${auth.igUserId}, hasToken: ${!!auth.token}, isDirect: ${auth.isDirect}`);
    const primary = choosePrimaryMedia(mediaList);
    if (!primary) {
        throw new Error('Instagram requires media to publish. No media found.');
    }
    console.log(`[Publisher] Primary media - type: ${primary.type}, url: ${primary.url}`);

    // Build container payload
    const base = { caption: content || '' };
    const isVideo = primary.type === 'video';
    let payload = {};
    if (isVideo) {
        // For direct Instagram Login, REELS may not be supported without specific scopes; start with VIDEO
        payload = auth.isDirect
            ? { ...base, media_type: 'VIDEO', video_url: primary.url }
            : { ...base, media_type: 'REELS', video_url: primary.url };
    } else {
        payload = { ...base, image_url: primary.url };
    }
    console.log(`[Publisher] Container payload:`, JSON.stringify(payload, null, 2));

    // Select the correct API functions based on auth type
    const createContainerFn = auth.isDirect ? createDirectOAuthMediaContainer : createMediaContainer;
    const getStatusFn = auth.isDirect ? getDirectOAuthContainerStatus : getContainerStatus;
    const publishFn = auth.isDirect ? publishDirectOAuthContainer : publishContainer;

    console.log(`[Publisher] Using ${auth.isDirect ? 'Direct OAuth' : 'Facebook-linked'} Instagram API`);

    // Helper to create and wait for container
    async function createAndAwait(p) {
        console.log(`[Publisher] Creating media container with payload:`, p);
        const created = await createContainerFn(auth.igUserId, auth.token, p);
        console.log(`[Publisher] Container created:`, created);
        const creationId = created?.id;
        if (!creationId) throw new Error('Failed to create Instagram media container');
        console.log(`[Publisher] Container ID: ${creationId}, checking status...`);
        // Poll up to ~2 minutes with backoff (2.5s)
        let status = 'IN_PROGRESS';
        const started = Date.now();
        while (status === 'IN_PROGRESS' && Date.now() - started < 120000) {
            await new Promise(r => setTimeout(r, 2500));
            try {
                status = await getStatusFn(creationId, auth.token);
                console.log(`[Publisher] Container status: ${status}`);
            } catch (_) {
                // keep polling even if a check fails transiently
            }
        }
        if (status !== 'FINISHED') throw new Error(`Instagram container not ready: ${status}`);
        return creationId;
    }

    let creationId;
    try {
        console.log('[Publisher] Attempting to create container...');
        creationId = await createAndAwait(payload);
    } catch (err) {
        const errMsg = err?.response?.data?.error?.message || err.message || 'Container creation failed';
        console.log('[Publisher] Container creation failed:', errMsg);
        // Fallback logic
        if (isVideo) {
            if (!auth.isDirect) {
                // Facebook-linked fallback from REELS -> VIDEO
                try {
                    console.log('[Publisher] Fallback to VIDEO media_type...');
                    const fallback = { ...base, media_type: 'VIDEO', video_url: primary.url };
                    creationId = await createAndAwait(fallback);
                } catch (err2) {
                    const msg2 = err2?.response?.data?.error?.message || err2.message || 'Fallback (VIDEO) failed';
                    throw new Error(`${errMsg} | ${msg2}`);
                }
            } else {
                // Direct token: try degrading further if REELS rejected earlier (we started with VIDEO already)
                if (/REELS|media_type/i.test(errMsg) && !/VIDEO/i.test(payload.media_type || '')) {
                    try {
                        console.log('[Publisher] Retrying with VIDEO for direct token...');
                        const fallbackDirect = { ...base, media_type: 'VIDEO', video_url: primary.url };
                        creationId = await createAndAwait(fallbackDirect);
                    } catch (err3) {
                        const msg3 = err3?.response?.data?.error?.message || err3.message;
                        throw new Error(`${errMsg} | ${msg3}`);
                    }
                } else {
                    throw new Error(errMsg);
                }
            }
        } else {
            throw new Error(errMsg);
        }
    }

    console.log(`[Publisher] Publishing container ${creationId}...`);
    const pub = await publishFn(auth.igUserId, auth.token, creationId);
    console.log(`[Publisher] Publish result:`, pub);
    return { postId: pub?.id || creationId };
}

/**
 * Publish video to TikTok using PULL_FROM_URL method
 * TikTok will pull the video from the Cloudinary URL
 */
async function publishToTikTok(auth, content, mediaList) {
    console.log(`[Publisher] publishToTikTok called - openId: ${auth.openId}, account: ${auth.accountName}`);

    // TikTok only supports video content
    const video = mediaList.find(m => m.type === 'video');
    if (!video) {
        throw new Error('TikTok only supports video content. Please include a video in your post.');
    }

    console.log(`[Publisher] TikTok video URL: ${video.url}`);

    // Use direct publish with PULL_FROM_URL
    // Default to SELF_ONLY (private) for safety - users can change in TikTok app
    // Unreviewed apps can only post as private anyway
    const result = await tiktokService.initializeVideoUploadFromUrl(
        auth.token,
        video.url,
        {
            caption: content || '',
            privacy_level: 'SELF_ONLY', // Safe default
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false
        }
    );

    console.log(`[Publisher] TikTok publish initiated, publish_id: ${result.publish_id}`);

    // Optionally wait for processing (but don't block too long)
    // TikTok processing can take a while for PULL_FROM_URL
    try {
        const status = await tiktokService.waitForPublishComplete(
            auth.token,
            result.publish_id,
            60000, // Wait up to 1 minute
            5000   // Poll every 5 seconds
        );
        console.log(`[Publisher] TikTok publish status: ${status.status}`);
        return { postId: result.publish_id, status: status.status };
    } catch (waitError) {
        // If we timeout waiting, the video might still be processing
        // Return the publish_id anyway - it can be checked later
        console.log(`[Publisher] TikTok processing not complete, but publish_id obtained: ${result.publish_id}`);
        return { postId: result.publish_id, status: 'PROCESSING' };
    }
}

async function publishPlatform(user, platform, post) {
    const auth = await resolveAuthForPlatform(user, platform);
    const startedAt = new Date();
    try {
        let result;
        if (auth.kind === 'facebook') {
            result = await publishToFacebook(auth, post.content, post.media);
        } else if (auth.kind === 'instagram') {
            result = await publishToInstagram(auth, post.content, post.media);
        } else if (auth.kind === 'tiktok') {
            result = await publishToTikTok(auth, post.content, post.media);
        }
        return {
            ...platform.toObject?.() || platform,
            status: 'published',
            postId: result?.postId || null,
            publishedAt: new Date(),
            errorMessage: undefined,
        };
    } catch (err) {
        const rawMsg = err?.response?.data?.error?.message || err.message || 'Publish failed';
        let friendly = rawMsg;
        if (err.code === 'IG_UNSUPPORTED_PUBLISH' || /Unsupported request - method type: post/i.test(rawMsg)) {
            friendly = 'Instagram account/token does not support publishing. Convert to a Business or Creator account linked to a Facebook Page and reconnect with publishing permissions.';
        }
        return {
            ...platform.toObject?.() || platform,
            status: 'failed',
            publishedAt: startedAt,
            errorMessage: friendly,
        };
    }
}

async function publishPostById(userId, postId) {
    console.log(`[Publisher] publishPostById called - userId: ${userId}, postId: ${postId}`);
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    if (post.user.toString() !== userId.toString()) throw new Error('Not authorized');
    console.log(`[Publisher] Post found - content length: ${post.content?.length || 0}, media count: ${post.media?.length || 0}`);
    console.log(`[Publisher] Post platforms:`, post.platforms.map(p => ({ name: p.name, accountId: p.accountId, status: p.status })));
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Attempt platforms that are scheduled, draft, or failed (allow retries)
    const nextPlatforms = await Promise.all(post.platforms.map(async (p) => {
        if (['scheduled', 'draft', 'failed'].includes(p.status)) {
            console.log(`[Publisher] Publishing to platform: ${p.name} (${p.accountId}), current status: ${p.status}`);
            return await publishPlatform(user, p, post);
        }
        console.log(`[Publisher] Skipping platform ${p.name} with status: ${p.status}`);
        return p;
    }));

    post.platforms = nextPlatforms;
    // Aggregate flags
    const allPublished = nextPlatforms.every(p => p.status === 'published');
    const anyPublished = nextPlatforms.some(p => p.status === 'published');
    const anyScheduled = nextPlatforms.some(p => p.status === 'scheduled');
    post.isPublished = allPublished || anyPublished;
    post.isScheduled = anyScheduled;
    post.isDraft = !anyPublished && !anyScheduled;
    await post.save();
    await post.populate('user', 'name email');
    return post;
}

async function publishDueScheduledPosts(now = new Date()) {
    const due = await Post.find({
        isScheduled: true,
        scheduledDate: { $lte: now },
        'platforms.status': 'scheduled',
    }).limit(20);
    for (const post of due) {
        try {
            await publishPostById(post.user, post._id);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Scheduled publish failed:', post._id.toString(), e.message);
        }
    }
    return due.length;
}

module.exports = {
    publishPostById,
    publishDueScheduledPosts,
};
