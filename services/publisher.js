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
} = require('./instagram');

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// Helper: Validate Instagram token by making a simple API call
async function validateInstagramToken(accountId, token) {
    try {
        // Try to fetch basic account info to validate token
        await axios.get(`${INSTAGRAM_GRAPH_URL}/${accountId}`, {
            params: {
                fields: 'id,username',
                access_token: token
            }
        });
        return true;
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error(`[Publisher] Token validation failed:`, errorMsg);

        if (errorMsg.includes('Cannot parse access token') ||
            errorMsg.includes('Invalid OAuth access token') ||
            errorMsg.includes('Malformed access token')) {
            throw new Error('Instagram token is corrupted. Please disconnect and reconnect your Instagram account to get a fresh token.');
        }

        throw new Error(`Instagram token validation failed: ${errorMsg}`);
    }
}

// Helper: Refresh Instagram token if needed
async function refreshInstagramTokenIfNeeded(user, account) {
    // Check both possible field names (tokenExpires is the correct schema field)
    const expiryDate = account.tokenExpires || account.tokenExpiry;

    if (!expiryDate) {
        console.log(`[Publisher] No token expiry date found, skipping refresh check`);
        return; // Skip if no expiry date
    }

    const daysUntilExpiry = (new Date(expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
    console.log(`[Publisher] Token expires in ${daysUntilExpiry.toFixed(1)} days`);

    // Refresh if token expires within 7 days
    if (daysUntilExpiry < 7) {
        console.log(`[Publisher] Token expiring soon, attempting refresh...`);
        try {
            const refreshResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/refresh_access_token`, {
                params: {
                    grant_type: 'ig_refresh_token',
                    access_token: account.accessToken
                }
            });

            account.accessToken = refreshResponse.data.access_token;
            account.tokenExpires = new Date(Date.now() + refreshResponse.data.expires_in * 1000);
            user.markModified('socialAccounts');
            await user.save();

            console.log(`[Publisher] ✓ Instagram token refreshed successfully for account ${account.accountId}`);
        } catch (refreshError) {
            const errorMsg = refreshError.response?.data?.error?.message || refreshError.message;
            console.error(`[Publisher] ✗ Token refresh failed:`, errorMsg);

            // Check for specific "Cannot parse" error
            if (errorMsg.includes('Cannot parse access token') || errorMsg.includes('Invalid OAuth access token')) {
                throw new Error('Instagram token is corrupted and cannot be refreshed. Please disconnect and reconnect your Instagram account.');
            }

            throw new Error(`Instagram token refresh failed: ${errorMsg}. Please reconnect your account.`);
        }
    } else {
        console.log(`[Publisher] Token still valid, no refresh needed`);
    }
}// Helper: find page token for a user's connected account
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
                // First, validate the token
                console.log(`[Publisher] Validating token...`);
                await validateInstagramToken(directAccount.accountId, directAccount.accessToken);
                console.log(`[Publisher] ✓ Token is valid`);

                // Then refresh if needed
                await refreshInstagramTokenIfNeeded(user, directAccount);
                console.log(`[Publisher] Using validated token for publishing`);
                return { kind: 'instagram', igUserId: platform.accountId, token: directAccount.accessToken };
            } catch (validationError) {
                console.error(`[Publisher] Token validation/refresh failed:`, validationError.message);
                throw validationError; // Throw the specific error with instructions
            }
        } console.log(`[Publisher] No direct OAuth account found, checking Facebook-linked...`);

        // Fall back to Facebook-linked Instagram account
        const page = (user.settings?.facebookPages || []).find(p => p.instagramId === platform.accountId);
        if (!page || !page.accessToken) {
            throw new Error('Instagram account not found. Please reconnect your Instagram account.');
        }
        console.log(`[Publisher] Found Facebook-linked Instagram account`);
        return { kind: 'instagram', igUserId: platform.accountId, token: page.accessToken };
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
    const primary = choosePrimaryMedia(mediaList);
    if (!primary) {
        throw new Error('Instagram requires media to publish. No media found.');
    }
    // Build container payload
    const base = { caption: content || '' };
    const isVideo = primary.type === 'video';
    let payload = {};
    if (isVideo) {
        // Try as REELS first
        payload = { ...base, media_type: 'REELS', video_url: primary.url };
    } else {
        payload = { ...base, image_url: primary.url };
    }

    // Helper to create and wait for container
    async function createAndAwait(p) {
        const created = await createMediaContainer(auth.igUserId, auth.token, p);
        const creationId = created?.id;
        if (!creationId) throw new Error('Failed to create Instagram media container');
        // Poll up to ~2 minutes with backoff (2.5s)
        let status = 'IN_PROGRESS';
        const started = Date.now();
        while (status === 'IN_PROGRESS' && Date.now() - started < 120000) {
            await new Promise(r => setTimeout(r, 2500));
            try {
                status = await getContainerStatus(creationId, auth.token);
            } catch (_) {
                // keep polling even if a check fails transiently
            }
        }
        if (status !== 'FINISHED') throw new Error(`Instagram container not ready: ${status}`);
        return creationId;
    }

    let creationId;
    try {
        creationId = await createAndAwait(payload);
    } catch (err) {
        // Fallback for video: try VIDEO if REELS failed to create
        if (isVideo) {
            try {
                const fallback = { ...base, media_type: 'VIDEO', video_url: primary.url };
                creationId = await createAndAwait(fallback);
            } catch (err2) {
                // Propagate the original error with fallback info
                const msg = err?.response?.data?.error?.message || err.message || 'Failed to create IG container (REELS)';
                const msg2 = err2?.response?.data?.error?.message || err2.message || 'Fallback (VIDEO) also failed';
                throw new Error(`${msg} | ${msg2}`);
            }
        } else {
            // Not a video, rethrow
            throw err;
        }
    }

    const pub = await publishContainer(auth.igUserId, auth.token, creationId);
    return { postId: pub?.id || creationId };
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
        }
        return {
            ...platform.toObject?.() || platform,
            status: 'published',
            postId: result?.postId || null,
            publishedAt: new Date(),
            errorMessage: undefined,
        };
    } catch (err) {
        return {
            ...platform.toObject?.() || platform,
            status: 'failed',
            publishedAt: startedAt,
            errorMessage: err?.response?.data?.error?.message || err.message || 'Publish failed',
        };
    }
}

async function publishPostById(userId, postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    if (post.user.toString() !== userId.toString()) throw new Error('Not authorized');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Only attempt platforms that are scheduled or draft
    const nextPlatforms = await Promise.all(post.platforms.map(async (p) => {
        if (['scheduled', 'draft'].includes(p.status)) {
            return await publishPlatform(user, p, post);
        }
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
