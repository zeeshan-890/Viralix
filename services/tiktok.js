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
    console.log('[TikTok] Using client_key:', clientKey ? clientKey.substring(0, 8) + '...' : 'MISSING');
    console.log('[TikTok] Redirect URI:', redirectUri);

    // TikTok requires form-urlencoded body, not query params
    const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
    });

    try {
        const { data } = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (data.error) {
            console.error('[TikTok] Token exchange error response:', JSON.stringify(data, null, 2));
            throw new Error(data.error_description || data.error);
        }

        console.log('[TikTok] Token exchange successful, open_id:', data.open_id);
        return data;
    } catch (error) {
        console.error('[TikTok] Token exchange failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw new Error(error.response?.data?.error_description || error.response?.data?.error || error.message);
    }
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

    try {
        // Only request fields that are definitely available with user.info.basic scope
        const { data } = await axios.get(`${TIKTOK_API_BASE}/user/info/`, {
            params: {
                fields: 'open_id,avatar_url,display_name'
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('[TikTok] getUserInfo response:', JSON.stringify(data, null, 2));

        if (data.error?.code && data.error.code !== 'ok') {
            console.error('[TikTok] Get user info error:', data.error);
            throw new Error(data.error.message || 'Failed to get user info');
        }

        console.log('[TikTok] User info retrieved:', data.data?.user?.display_name);
        return data.data?.user || data.data || {};
    } catch (error) {
        console.error('[TikTok] getUserInfo failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        // Return empty object instead of throwing - let callback handle it
        return null;
    }
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

/**
 * Initialize FILE_UPLOAD for inbox (no domain verification needed)
 * This method uploads video directly to TikTok servers
 * 
 * @param {string} accessToken - Valid access token
 * @param {number} videoSize - Size of video file in bytes
 * @param {number} chunkSize - Size of each chunk (default 10MB, max 64MB)
 * @returns {Promise<Object>} Response with publish_id and upload_url
 */
async function initializeFileUpload(accessToken, videoSize, chunkSize = 10 * 1024 * 1024) {
    console.log(`[TikTok] Initializing FILE_UPLOAD - size: ${videoSize} bytes, chunk: ${chunkSize} bytes`);

    const totalChunkCount = Math.ceil(videoSize / chunkSize);

    const payload = {
        source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoSize,
            chunk_size: chunkSize,
            total_chunk_count: totalChunkCount
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

    if (data.error?.code && data.error.code !== 'ok') {
        console.error('[TikTok] FILE_UPLOAD init error:', data.error);
        throw new Error(data.error.message || 'Failed to initialize file upload');
    }

    console.log('[TikTok] FILE_UPLOAD initialized, publish_id:', data.data?.publish_id);
    return data.data;
}

/**
 * Upload a video chunk to TikTok
 * 
 * @param {string} uploadUrl - URL from initializeFileUpload
 * @param {Buffer} chunkData - The chunk data to upload
 * @param {number} chunkIndex - Index of this chunk (0-based)
 * @param {number} startByte - Starting byte position
 * @param {number} endByte - Ending byte position
 * @param {number} totalSize - Total file size
 * @returns {Promise<Object>} Upload response
 */
async function uploadVideoChunk(uploadUrl, chunkData, chunkIndex, startByte, endByte, totalSize) {
    console.log(`[TikTok] Uploading chunk ${chunkIndex}: bytes ${startByte}-${endByte}/${totalSize}`);

    const { data } = await axios.put(uploadUrl, chunkData, {
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': chunkData.length.toString(),
            'Content-Range': `bytes ${startByte}-${endByte}/${totalSize}`
        }
    });

    console.log(`[TikTok] Chunk ${chunkIndex} uploaded successfully`);
    return data;
}

/**
 * Download video from URL and upload to TikTok using FILE_UPLOAD method
 * This bypasses the domain verification requirement
 * 
 * @param {string} accessToken - Valid access token
 * @param {string} videoUrl - URL of video to download (e.g., Cloudinary)
 * @returns {Promise<Object>} Response with publish_id
 */
async function uploadVideoFromUrl(accessToken, videoUrl) {
    console.log('[TikTok] Starting FILE_UPLOAD from URL:', videoUrl);

    // Step 1: Download video to buffer
    console.log('[TikTok] Downloading video...');
    const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        maxContentLength: 500 * 1024 * 1024, // 500MB max
        timeout: 300000 // 5 minute timeout for large files
    });

    const videoBuffer = Buffer.from(videoResponse.data);
    const videoSize = videoBuffer.length;
    console.log(`[TikTok] Video downloaded: ${(videoSize / (1024 * 1024)).toFixed(2)} MB`);

    // Step 2: Calculate chunk size based on TikTok requirements:
    // - Minimum chunk: 5MB
    // - Maximum chunk: 64MB  
    // - Videos < 5MB: use video size as chunk size (single chunk)
    // - Last chunk can be smaller than 5MB
    let chunkSize;
    if (videoSize < 5 * 1024 * 1024) {
        // Video is under 5MB - upload as single chunk
        chunkSize = videoSize;
        console.log(`[TikTok] Small video, using single chunk of ${videoSize} bytes`);
    } else {
        // Use 10MB chunks (within 5-64MB range)
        chunkSize = 10 * 1024 * 1024;
    }

    const initResult = await initializeFileUpload(accessToken, videoSize, chunkSize);

    const { publish_id, upload_url } = initResult;
    if (!upload_url) {
        throw new Error('No upload URL returned from TikTok');
    }

    // Step 3: Upload in chunks
    const totalChunks = Math.ceil(videoSize / chunkSize);
    console.log(`[TikTok] Uploading ${totalChunks} chunk(s)...`);

    for (let i = 0; i < totalChunks; i++) {
        const startByte = i * chunkSize;
        const endByte = Math.min(startByte + chunkSize - 1, videoSize - 1);
        const chunkData = videoBuffer.slice(startByte, endByte + 1);

        await uploadVideoChunk(upload_url, chunkData, i, startByte, endByte, videoSize);
    }

    console.log('[TikTok] All chunks uploaded successfully');
    return { publish_id };
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
    initializeFileUpload,
    uploadVideoChunk,
    uploadVideoFromUrl,
    getPublishStatus,
    waitForPublishComplete,

    // Video Data
    getVideoList,
    queryVideos,

    // Constants
    TIKTOK_SCOPES
};
