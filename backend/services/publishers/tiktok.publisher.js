const BasePublisher = require('./base.publisher');
const { uploadVideoFromUrl, refreshAccessToken, resolveDirectPostOptions, getCreatorInfo, isPrivateTikTokAccount } = require('../tiktok');
const AccountService = require('../account.service');

// TikTok App Credentials from Env
const TT_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TT_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

class TikTokPublisher extends BasePublisher {

    async resolveAuth(account) {
        console.log(`[TikTokPublisher] Resolving auth for: ${account.accountId}`);

        const tiktokAccount = await AccountService.getAccount(this.user._id, 'tiktok', account.accountId);

        if (!tiktokAccount) {
            throw new Error('TikTok account not connected');
        }

        // Check if token is invalid or expired (with 5 min buffer)
        // If tokenExpires is missing, we assume it's valid until it fails (or we could force refresh if refresh token exists)
        const isExpired = tiktokAccount.tokenExpires && (new Date(tiktokAccount.tokenExpires).getTime() - 5 * 60 * 1000 < Date.now());

        if (isExpired || !tiktokAccount.accessToken) {
            console.log('[TikTokPublisher] Token expired or missing. Attempting refresh...');

            if (!tiktokAccount.refreshToken) {
                console.error('[TikTokPublisher] No refresh token available');
                throw new Error('TikTok access token expired and no refresh token available');
            }

            if (!TT_CLIENT_KEY || !TT_CLIENT_SECRET) {
                console.error('[TikTokPublisher] Client key/secret missing');
                throw new Error('TikTok App credentials missing on server');
            }

            try {
                const tokenData = await refreshAccessToken(tiktokAccount.refreshToken, TT_CLIENT_KEY, TT_CLIENT_SECRET);

                const expires = new Date(Date.now() + (tokenData.expires_in * 1000));

                // Update account in DB
                await AccountService.connectAccount(this.user._id, {
                    platform: 'tiktok',
                    accountId: tiktokAccount.platformAccountId,
                    name: tiktokAccount.accountName,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expires: expires,
                    metadata: tiktokAccount.metadata
                });

                console.log('[TikTokPublisher] Token refreshed and DB updated');

                return {
                    openId: tiktokAccount.platformAccountId,
                    accessToken: tokenData.access_token
                };

            } catch (error) {
                console.error('[TikTokPublisher] Token refresh failed:', error.message);
                throw new Error('Failed to refresh TikTok token: ' + error.message);
            }
        }

        return {
            openId: tiktokAccount.platformAccountId,
            accessToken: tiktokAccount.accessToken
        };
    }

    async publish(account, postData) {
        // Resolve auth (will auto-refresh if needed)
        const auth = await this.resolveAuth(account);
        const { media, title, content, tiktokSettings } = postData;

        const video = media.find(m => m.type === 'video');
        if (!video) {
            throw new Error('TikTok requires a video');
        }

        // Check if we have TikTok-specific settings (for direct publish)
        // If no settings provided, use inbox mode (draft)
        if (tiktokSettings && tiktokSettings.privacyLevel) {
            console.log('[TikTokPublisher] Publishing with custom settings:', tiktokSettings);

            let isPrivateAccount = tiktokSettings.isPrivateAccount;
            if (isPrivateAccount === undefined) {
                try {
                    const info = await getCreatorInfo(auth.accessToken);
                    isPrivateAccount = isPrivateTikTokAccount(info.privacy_level_options || []);
                } catch (err) {
                    console.warn('[TikTokPublisher] Could not fetch creator info for privacy check:', err.message);
                    isPrivateAccount = true;
                }
            }

            const tiktokCaption = tiktokSettings.caption !== undefined && tiktokSettings.caption !== null
                ? tiktokSettings.caption
                : (content || title || '');

            const result = await uploadVideoFromUrl(auth.accessToken, video.url, resolveDirectPostOptions({
                caption: tiktokCaption,
                privacy_level: tiktokSettings.privacyLevel,
                disable_comment: tiktokSettings.disableComment || false,
                disable_duet: tiktokSettings.disableDuet || false,
                disable_stitch: tiktokSettings.disableStitch || false,
                brand_content_toggle: tiktokSettings.brandOrganic || tiktokSettings.brandedContent || false,
                brand_organic_toggle: tiktokSettings.brandOrganic || false,
                is_branded_content: tiktokSettings.brandedContent || false
            }, { isPrivateAccount: !!isPrivateAccount }));

            return this.formatResponse(result.publish_id, 'processing', {
                message: 'Video publish initiated with custom settings',
                privacyLevel: tiktokSettings.privacyLevel
            });
        }

        // Fallback: Use PROXY UPLOAD for inbox publishing (for screen recording/drafts)
        // This downloads the video to server and uploads to TikTok inbox
        // Passing null/no options triggers the inbox mode in uploadVideoFromUrl
        const result = await uploadVideoFromUrl(auth.accessToken, video.url);

        return this.formatResponse(result.publish_id, 'processing', {
            message: 'Video upload initiated to Inbox (Proxy)'
        });
    }
}

module.exports = TikTokPublisher;
