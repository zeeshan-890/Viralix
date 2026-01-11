const BasePublisher = require('./base.publisher');
const { uploadVideoFromUrl } = require('../tiktok');
const AccountService = require('../account.service');

class TikTokPublisher extends BasePublisher {

    async resolveAuth(account) {
        console.log(`[TikTokPublisher] Resolving auth for: ${account.accountId}`);

        const tiktokAccount = await AccountService.getAccount(this.user._id, 'tiktok', account.accountId);

        if (!tiktokAccount) {
            throw new Error('TikTok account not connected');
        }

        // We need to request the token explicitly as it is select: false by default
        // The getAccount method in service already does .select('+accessToken')

        if (!tiktokAccount.accessToken) {
            throw new Error('TikTok token missing');
        }

        return {
            openId: account.accountId,
            accessToken: tiktokAccount.accessToken
        };
    }

    async publish(account, postData) {
        const auth = await this.resolveAuth(account);
        const { media } = postData;

        const video = media.find(m => m.type === 'video');
        if (!video) {
            throw new Error('TikTok requires a video');
        }

        const result = await uploadVideoFromUrl(auth.accessToken, video.url);

        return this.formatResponse(result.publish_id, 'processing', {
            message: 'Video sent to TikTok inbox'
        });
    }
}

module.exports = TikTokPublisher;
