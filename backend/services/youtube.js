const axios = require('axios');

// YouTube/Google API Configuration
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';

// Required OAuth scopes for YouTube uploads
const YOUTUBE_SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
].join(' ');

/**
 * Generate YouTube OAuth authorization URL
 * @param {string} clientId - Google OAuth client ID
 * @param {string} redirectUri - OAuth callback URL
 * @param {string} state - CSRF protection state token
 * @returns {string} Authorization URL
 */
function generateAuthUrl(clientId, redirectUri, state) {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: YOUTUBE_SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state: state
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from callback
 * @param {string} clientId - Google OAuth client ID
 * @param {string} clientSecret - Google OAuth client secret
 * @param {string} redirectUri - OAuth callback URL
 * @returns {Promise<Object>} Token response with access_token, refresh_token, expires_in
 */
async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    console.log('[YouTube] Exchanging code for token');

    const params = new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });

    const { data } = await axios.post(GOOGLE_TOKEN_URL, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    console.log('[YouTube] Token exchange successful');
    return data;
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - Refresh token
 * @param {string} clientId - Google OAuth client ID
 * @param {string} clientSecret - Google OAuth client secret
 * @returns {Promise<Object>} New token response
 */
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
    console.log('[YouTube] Refreshing access token');

    const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token'
    });

    const { data } = await axios.post(GOOGLE_TOKEN_URL, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    console.log('[YouTube] Token refresh successful');
    return data;
}

/**
 * Revoke access token (disconnect)
 * @param {string} token - Access or refresh token to revoke
 * @returns {Promise<void>}
 */
async function revokeToken(token) {
    console.log('[YouTube] Revoking token');

    try {
        await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
        console.log('[YouTube] Token revoked successfully');
    } catch (error) {
        console.warn('[YouTube] Token revocation failed:', error.response?.data || error.message);
    }
}

/**
 * Get YouTube channel info for the authenticated user
 * @param {string} accessToken - Valid access token
 * @returns {Promise<Object>} Channel info with id, title, thumbnail, etc.
 */
async function getChannelInfo(accessToken) {
    console.log('[YouTube] Fetching channel info');

    const { data } = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
            part: 'snippet,statistics,contentDetails',
            mine: true
        },
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!data.items || data.items.length === 0) {
        throw new Error('No YouTube channel found for this account');
    }

    const channel = data.items[0];
    console.log('[YouTube] Channel info retrieved:', channel.snippet?.title);

    return {
        id: channel.id,
        title: channel.snippet?.title,
        description: channel.snippet?.description,
        customUrl: channel.snippet?.customUrl,
        thumbnail: channel.snippet?.thumbnails?.default?.url,
        subscriberCount: channel.statistics?.subscriberCount,
        videoCount: channel.statistics?.videoCount,
        viewCount: channel.statistics?.viewCount
    };
}

/**
 * Upload a video to YouTube using resumable upload
 * Downloads video from URL and uploads to YouTube
 * 
 * @param {string} accessToken - Valid access token
 * @param {string} videoUrl - URL of video to upload
 * @param {Object} metadata - Video metadata
 * @param {string} metadata.title - Video title (required)
 * @param {string} metadata.description - Video description
 * @param {string[]} metadata.tags - Video tags
 * @param {string} metadata.privacyStatus - 'private', 'unlisted', or 'public'
 * @param {boolean} metadata.madeForKids - Is video made for kids
 * @returns {Promise<Object>} Upload response with video ID
 */
async function uploadVideo(accessToken, videoUrl, metadata = {}) {
    console.log('[YouTube] Starting video upload from URL:', videoUrl);
    console.log('[YouTube] Metadata:', JSON.stringify(metadata, null, 2));

    // Step 1: Download video
    console.log('[YouTube] Downloading video...');
    const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        maxContentLength: 500 * 1024 * 1024, // 500MB max
        timeout: 300000 // 5 minute timeout
    });

    const videoBuffer = Buffer.from(videoResponse.data);
    const videoSize = videoBuffer.length;
    console.log(`[YouTube] Video downloaded: ${(videoSize / (1024 * 1024)).toFixed(2)} MB`);

    // Step 2: Get content type from response headers
    const contentType = videoResponse.headers['content-type'] || 'video/mp4';

    // Step 3: Prepare video metadata
    const videoMetadata = {
        snippet: {
            title: metadata.title || 'Uploaded via Viralix',
            description: metadata.description || '',
            tags: metadata.tags || [],
            categoryId: '22' // People & Blogs (default)
        },
        status: {
            privacyStatus: metadata.privacyStatus || 'private',
            madeForKids: metadata.madeForKids || false,
            selfDeclaredMadeForKids: metadata.madeForKids || false
        }
    };

    // Step 4: Initialize resumable upload
    console.log('[YouTube] Initializing resumable upload...');
    const initResponse = await axios.post(
        `${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status`,
        videoMetadata,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Length': videoSize.toString(),
                'X-Upload-Content-Type': contentType
            }
        }
    );

    const uploadUrl = initResponse.headers.location;
    if (!uploadUrl) {
        throw new Error('No upload URL returned from YouTube');
    }

    console.log('[YouTube] Upload URL obtained, uploading video...');

    // Step 5: Upload video content
    const uploadResponse = await axios.put(uploadUrl, videoBuffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Length': videoSize.toString()
        },
        maxContentLength: 500 * 1024 * 1024,
        maxBodyLength: 500 * 1024 * 1024
    });

    console.log('[YouTube] Video upload complete, video ID:', uploadResponse.data?.id);

    return {
        videoId: uploadResponse.data?.id,
        title: uploadResponse.data?.snippet?.title,
        status: uploadResponse.data?.status?.uploadStatus,
        privacyStatus: uploadResponse.data?.status?.privacyStatus
    };
}

/**
 * Get video details by ID
 * @param {string} accessToken - Valid access token
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details
 */
async function getVideoDetails(accessToken, videoId) {
    console.log('[YouTube] Fetching video details:', videoId);

    const { data } = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
            part: 'snippet,status,statistics',
            id: videoId
        },
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
    }

    return data.items[0];
}

/**
 * Get list of user's uploaded videos
 * @param {string} accessToken - Valid access token
 * @param {number} maxResults - Maximum videos to return
 * @returns {Promise<Object>} Videos list
 */
async function getMyVideos(accessToken, maxResults = 20) {
    console.log('[YouTube] Fetching user videos');

    // First get the uploads playlist ID
    const { data: channelData } = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
            part: 'contentDetails',
            mine: true
        },
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!channelData.items || channelData.items.length === 0) {
        return { videos: [] };
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
        return { videos: [] };
    }

    // Get videos from uploads playlist
    const { data } = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params: {
            part: 'snippet,status',
            playlistId: uploadsPlaylistId,
            maxResults: maxResults
        },
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    console.log('[YouTube] Retrieved', data.items?.length || 0, 'videos');
    return {
        videos: data.items || [],
        nextPageToken: data.nextPageToken
    };
}

module.exports = {
    // OAuth
    generateAuthUrl,
    exchangeCodeForToken,
    refreshAccessToken,
    revokeToken,

    // Channel
    getChannelInfo,

    // Videos
    uploadVideo,
    getVideoDetails,
    getMyVideos,

    // Constants
    YOUTUBE_SCOPES
};
