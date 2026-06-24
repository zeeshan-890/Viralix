const BasePublisher = require('./base.publisher');
const instagramPublish = require('../instagramPublish');
const { refreshLongLivedToken } = require('../instagram');
const AccountService = require('../account.service');

class InstagramPublisher extends BasePublisher {

    async resolveAuth(account) {
        const directAccount = await AccountService.getAccount(this.user._id, 'instagram', account.accountId);
        if (!directAccount) {
            throw new Error('Instagram account not connected. Connect via Instagram Login in Connections.');
        }

        const now = Date.now();
        const expires = directAccount.tokenExpires ? new Date(directAccount.tokenExpires).getTime() : 0;
        const isExpired = expires > 0 && (expires - now < 60 * 60 * 1000);

        if (isExpired) {
            try {
                const refreshed = await refreshLongLivedToken(directAccount.accessToken);
                const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
                await AccountService.connectAccount(this.user._id, {
                    platform: 'instagram',
                    accountId: account.accountId,
                    name: directAccount.accountName,
                    accessToken: refreshed.access_token,
                    expires: newExpiry,
                    metadata: directAccount.metadata
                });
                return {
                    accessToken: refreshed.access_token,
                    instagramId: account.accountId,
                };
            } catch (e) {
                console.warn('[InstagramPublisher] Token refresh failed:', e.message);
            }
        }

        return {
            accessToken: directAccount.accessToken,
            instagramId: account.accountId,
        };
    }

    async publish(account, postData) {
        let auth = await this.resolveAuth(account);
        const { content, media } = postData;

        if (!media || media.length === 0) {
            throw new Error('Instagram requires media (image or video)');
        }

        const mediaItem = media[0];
        const caption = content || '';
        const isVideo = mediaItem.type === 'video';

        try {
            return await this._publishInternal(auth, mediaItem, caption, isVideo);
        } catch (error) {
            const isTokenError = error.code === 'IG_INVALID_TOKEN'
                || error.message?.includes('Invalid OAuth access token')
                || error.response?.data?.error?.code === 190;

            if (isTokenError) {
                const directAccount = await AccountService.getAccount(this.user._id, 'instagram', account.accountId);
                if (!directAccount) throw error;
                const refreshed = await refreshLongLivedToken(directAccount.accessToken);
                const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
                await AccountService.connectAccount(this.user._id, {
                    platform: 'instagram',
                    accountId: account.accountId,
                    name: directAccount.accountName,
                    accessToken: refreshed.access_token,
                    expires: newExpiry,
                    metadata: directAccount.metadata
                });
                auth.accessToken = refreshed.access_token;
                return await this._publishInternal(auth, mediaItem, caption, isVideo);
            }
            throw error;
        }
    }

    async _publishInternal(auth, mediaItem, caption, isVideo) {
        const payload = { caption };
        if (isVideo) {
            payload.media_type = 'REELS';
            payload.video_url = mediaItem.url;
        } else {
            payload.image_url = instagramPublish.ensureInstagramImageUrl(mediaItem.url, 'IMAGE');
            await instagramPublish.verifyInstagramImageUrl(payload.image_url);
        }

        const container = await instagramPublish.createMediaContainer(auth.instagramId, auth.accessToken, payload);
        const waitOpts = instagramPublish.waitOptionsForMediaType(
            isVideo ? 'REELS' : 'IMAGE',
            { background: isVideo }
        );
        await instagramPublish.waitForContainer(container.id, auth.accessToken, waitOpts);
        const published = await instagramPublish.publishContainer(auth.instagramId, auth.accessToken, container.id);
        return this.formatResponse(published.id, 'published');
    }
}

module.exports = InstagramPublisher;
