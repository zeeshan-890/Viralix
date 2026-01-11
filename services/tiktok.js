const axios = require('axios');

// TikTok API Configuration
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

// Required OAuth scopes for content publishing
const TIKTOK_SCOPES = [
    'user.info.basic',
    'video.upload',
    'video.publish',
    'video.list'
].join(',');

/**
 * Generate TikTok OAuth authorization URL
 * @param {string} clientKey - TikTok app client key
 * @param {string} redirectUri - OAuth callback URL
 * @param {string} state - CSRF protection state token
 * @returns {string} Authorization URL
 */
function generateAuthUrl(clientKey, redirectUri, state) {
    const params = new URLSearchParams({
        client_key: clientKey,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: TIKTOK_SCOPES,
        state: state
    });
    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from callback
 * @param {string} clientKey - TikTok app client key
 * @param {string} clientSecret - TikTok app client secret
 * @param {string} redirectUri - OAuth callback URL
 * @returns {Promise<Object>} Token response with access_token, refresh_token, open_id, expires_in
 */
async function exchangeCodeForToken(code, clientKey, clientSecret, redirectUri) {
    console.log('[TikTok] Exchanging code for token');

    // TikTok requires form-urlencoded body, not query params
    const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
    });

    const { data } = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (data.error) {
        console.error('[TikTok] Token exchange error:', data);
        throw new Error(data.error_description || data.error);
    }

    console.log('[TikTok] Token exchange successful, open_id:', data.open_id);
    return data;
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - Refresh token
 * @param {string} clientKey - TikTok app client key
 * @param {string} clientSecret - TikTok app client secret
 * @returns {Promise<Object>} New token response
 */
async function refreshAccessToken(refreshToken, clientKey, clientSecret) {
    console.log('[TikTok] Refreshing access token');

    // TikTok requires form-urlencoded body
    const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    const { data } = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (data.error) {
        console.error('[TikTok] Token refresh error:', data);
        throw new Error(data.error_description || data.error);
    }

    console.log('[TikTok] Token refresh successful');
    return data;
}

/**
 * Revoke access token (disconnect)
 * @param {string} accessToken - Access token to revoke
 * @param {string} clientKey - TikTok app client key
 * @param {string} clientSecret - TikTok app client secret
 * @returns {Promise<void>}
 */
async function revokeToken(accessToken, clientKey, clientSecret) {
    console.log('[TikTok] Revoking access token');

    try {
        await axios.post(`${TIKTOK_API_BASE}/oauth/revoke/`, null, {
            params: {
                client_key: clientKey,
                client_secret: clientSecret,
                token: accessToken
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('[TikTok] Token revoked successfully');
    } catch (error) {
        console.warn('[TikTok] Token revocation failed:', error.response?.data || error.message);
        // Don't throw - we still want to remove from our database
    }
}

/**
 * Get user profile information
 * @param {string} accessToken - Valid access token
 * @returns {Promise<Object>} User info with open_id, display_name, avatar_url, etc.
 */
async function getUserInfo(accessToken) {
    console.log('[TikTok] Fetching user info');

    const { data } = await axios.get(`${TIKTOK_API_BASE}/user/info/`, {
        params: {
            fields: 'open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count'
        },
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (data.error?.code !== 'ok' && data.error?.code) {
        console.error('[TikTok] Get user info error:', data.error);
        throw new Error(data.error.message || 'Failed to get user info');
    }

    console.log('[TikTok] User info retrieved:', data.data?.user?.display_name || data.data?.user?.username);
    return data.data?.user || data.data;
}

/**
 * Initialize video upload using PULL_FROM_URL method
 * TikTok will pull the video from the provided URL (e.g., Cloudinary)
 * This sends video directly to user's TikTok inbox for final editing/posting
 * 
 * @param {string} accessToken - Valid access token
 * @param {string} videoUrl - Public URL of the video to upload
 * @param {Object} options - Upload options
 * @param {string} options.caption - Video caption/description (max 2200 chars)
 * @param {string} options.privacy_level - SELF_ONLY, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, or PUBLIC_TO_EVERYONE
 * @param {boolean} options.disable_comment - Disable comments
 * @param {boolean} options.disable_duet - Disable duet
 * @param {boolean} options.disable_stitch - Disable stitch
 * @returns {Promise<Object>} Response with publish_id for tracking
 */
async function initializeVideoUploadFromUrl(accessToken, videoUrl, options = {}) {
    console.log('[TikTok] Initializing video upload from URL:', videoUrl);

    const payload = {
        post_info: {
            title: options.caption || '',
            privacy_level: options.privacy_level || 'SELF_ONLY',
            disable_comment: options.disable_comment || false,
            disable_duet: options.disable_duet || false,
            disable_stitch: options.disable_stitch || false
        },
        source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl
        }
    };

    const { data } = await axios.post(
        `${TIKTOK_API_BASE}/post/publish/video/init/`,
        payload,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (data.error?.code !== 'ok' && data.error?.code) {
        console.error('[TikTok] Video init error:', data.error);
        throw new Error(data.error.message || 'Failed to initialize video upload');
    }

    console.log('[TikTok] Video upload initialized, publish_id:', data.data?.publish_id);
    return data.data;
}

/**
 * Initialize video upload to user's inbox (draft) 
 * User will complete posting in TikTok app
 * 
 * @param {string} accessToken - Valid access token
 * @param {string} videoUrl - Public URL of the video
 * @returns {Promise<Object>} Response with publish_id
 */
async function initializeInboxVideoUpload(accessToken, videoUrl) {
    console.log('[TikTok] Initializing inbox video upload from URL:', videoUrl);

    const payload = {
        source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl
        }
    };

    const { data } = await axios.post(
        `${TIKTOK_API_BASE}/post/publish/inbox/video/init/`,
        payload,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (data.error?.code !== 'ok' && data.error?.code) {
        console.error('[TikTok] Inbox video init error:', data.error);
        throw new Error(data.error.message || 'Failed to initialize inbox video upload');
    }

    console.log('[TikTok] Inbox video upload initialized, publish_id:', data.data?.publish_id);
    return data.data;
}

/**
 * Check the status of a video publish request
 * @param {string} accessToken - Valid access token
 * @param {string} publishId - The publish_id from initialization
 * @returns {Promise<Object>} Status info with status (PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, SEND_TO_USER_INBOX, PUBLISH_COMPLETE, FAILED)
 */
async function getPublishStatus(accessToken, publishId) {
    console.log('[TikTok] Checking publish status for:', publishId);

    const { data } = await axios.post(
        `${TIKTOK_API_BASE}/post/publish/status/fetch/`,
        { publish_id: publishId },
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (data.error?.code !== 'ok' && data.error?.code) {
        console.error('[TikTok] Get publish status error:', data.error);
        throw new Error(data.error.message || 'Failed to get publish status');
    }

    console.log('[TikTok] Publish status:', data.data?.status);
    return data.data;
}

/**
 * Get list of user's videos
 * @param {string} accessToken - Valid access token
 * @param {number} maxCount - Maximum videos to return (default 20, max 20)
 * @param {number} cursor - Pagination cursor
 * @returns {Promise<Object>} Videos list with cursor for pagination
 */
async function getVideoList(accessToken, maxCount = 20, cursor = 0) {
    console.log('[TikTok] Fetching video list, cursor:', cursor);

    const { data } = await axios.post(
        `${TIKTOK_API_BASE}/video/list/`,
        {
            max_count: Math.min(maxCount, 20),
            cursor: cursor
        },
        {
            params: {
                fields: 'id,title,video_description,duration,cover_image_url,embed_link,create_time,share_url,like_count,comment_count,share_count,view_count'
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (data.error?.code !== 'ok' && data.error?.code) {
        console.error('[TikTok] Get video list error:', data.error);
        throw new Error(data.error.message || 'Failed to get video list');
    }

    console.log('[TikTok] Retrieved', data.data?.videos?.length || 0, 'videos');
    return data.data;
}

/**
 * Query specific videos by IDs for detailed metrics
 * @param {string} accessToken - Valid access token
 * @param {string[]} videoIds - Array of video IDs to query
 * @returns {Promise<Object>} Video details with metrics
 */
async function queryVideos(accessToken, videoIds) {
    console.log('[TikTok] Querying videos:', videoIds);

    const { data } = await axios.post(
        `${TIKTOK_API_BASE}/video/query/`,
        {
            filters: {
                video_ids: videoIds
            }
        },
        {
            params: {
                fields: 'id,title,video_description,duration,cover_image_url,embed_link,create_time,share_url,like_count,comment_count,share_count,view_count'
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (data.error?.code !== 'ok' && data.error?.code) {
        console.error('[TikTok] Query videos error:', data.error);
        throw new Error(data.error.message || 'Failed to query videos');
    }

    console.log('[TikTok] Queried', data.data?.videos?.length || 0, 'videos');
    return data.data;
}

/**
 * Helper: Wait for video processing to complete
 * @param {string} accessToken - Valid access token
 * @param {string} publishId - The publish_id to monitor
 * @param {number} maxWaitMs - Maximum time to wait (default 5 minutes)
 * @param {number} pollIntervalMs - Polling interval (default 5 seconds)
 * @returns {Promise<Object>} Final status
 */
async function waitForPublishComplete(accessToken, publishId, maxWaitMs = 300000, pollIntervalMs = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        const status = await getPublishStatus(accessToken, publishId);

        if (status.status === 'PUBLISH_COMPLETE' || status.status === 'SEND_TO_USER_INBOX') {
            return status;
        }

        if (status.status === 'FAILED') {
            throw new Error(`Video publish failed: ${status.fail_reason || 'Unknown reason'}`);
        }

        // Still processing, wait and poll again
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Video publish timed out');
}

module.exports = {
    // OAuth
    generateAuthUrl,
    exchangeCodeForToken,
    refreshAccessToken,
    revokeToken,

    // User
    getUserInfo,

    // Video Publishing
    initializeVideoUploadFromUrl,
    initializeInboxVideoUpload,
    getPublishStatus,
    waitForPublishComplete,

    // Video Data
    getVideoList,
    queryVideos,

    // Constants
    TIKTOK_SCOPES
};
