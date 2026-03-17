const BasePublisher = require('./base.publisher');
const { uploadVideo, refreshAccessToken } = require('../youtube');
const AccountService = require('../account.service');

class YouTubePublisher extends BasePublisher {

    async resolveAuth(account) {
        console.log(`[YouTubePublisher] Resolving auth for: ${account.accountId}`);

        const ytAccount = await AccountService.getAccount(this.user._id, 'youtube', account.accountId);

        if (!ytAccount) {
            throw new Error('YouTube channel not connected');
        }

        // Check expiry and refresh if needed
        if (ytAccount.tokenExpires && new Date(ytAccount.tokenExpires) < new Date()) {
            console.log('[YouTubePublisher] Token expired, refreshing...');
            const tokenData = await refreshAccessToken(
                ytAccount.refreshToken,
                process.env.YOUTUBE_CLIENT_ID,
                process.env.YOUTUBE_CLIENT_SECRET
            );

            // Update the SocialAccount document via Service
            // We reuse connectAccount to update or create
            await AccountService.connectAccount(this.user._id, {
                platform: 'youtube',
                accountId: account.accountId,
                name: ytAccount.accountName, // Keep existing name
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || ytAccount.refreshToken,
                expires: new Date(Date.now() + (tokenData.expires_in * 1000)),
                metadata: ytAccount.metadata
            });

            return {
                accessToken: tokenData.access_token
            };
        }

        return {
            accessToken: ytAccount.accessToken
        };
    }

    async publish(account, postData) {
        const auth = await this.resolveAuth(account);
        const { content, media, title } = postData;

        const video = media.find(m => m.type === 'video');
        if (!video) {
            throw new Error('YouTube requires a video');
        }

        const result = await uploadVideo(
            auth.accessToken,
            video.url,
            {
                title: title || 'Uploaded via Viralix',
                description: content || '',
                privacyStatus: 'public' // Default to public
            }
        );

        return this.formatResponse(result.videoId, 'published');
    }
}

module.exports = YouTubePublisher;
