const BasePublisher = require('./base.publisher');
const {
    createDirectOAuthMediaContainer,
    publishDirectOAuthContainer,
    getDirectOAuthContainerStatus,
    getContainerStatus
} = require('../instagram');
const AccountService = require('../account.service');

class InstagramPublisher extends BasePublisher {

    async resolveAuth(account) {
        console.log(`[InstagramPublisher] Resolving auth for: ${account.accountId}`);

        // 1. Try to find direct Instagram Login account
        const directAccount = await AccountService.getAccount(this.user._id, 'instagram', account.accountId);

        if (directAccount) {
            return {
                kind: 'instagram',
                accessToken: directAccount.accessToken,
                instagramId: account.accountId,
                accountName: directAccount.accountName,
                isDirect: true
            };
        }

        // 2. Try fallback to Facebook-linked (if implemented)
        // For optimization phase, we focus on cleaner Direct OAuth
        // If we want to support FB-linked, we'd query FB account as in FacebookPublisher

        throw new Error('Instagram account not connected or not found in new system. Please reconnect.');
    }

    async publish(account, postData) {
        const auth = await this.resolveAuth(account);
        const { content, media } = postData;

        if (!media || media.length === 0) {
            throw new Error('Instagram requires media (image or video)');
        }

        const mediaItem = media[0];
        const caption = content || '';

        if (auth.isDirect) {
            const containerId = await createDirectOAuthMediaContainer(
                auth.accessToken,
                auth.instagramId,
                mediaItem.url,
                caption,
                mediaItem.type
            );

            await this._waitForContainer(auth.accessToken, containerId, true);

            const publishId = await publishDirectOAuthContainer(auth.accessToken, auth.instagramId, containerId);
            return this.formatResponse(publishId, 'published');
        } else {
            throw new Error('Only Direct Instagram Login supported in this version');
        }
    }

    async _waitForContainer(token, containerId, isDirect) {
        let attempts = 0;
        while (attempts < 10) {
            const status = isDirect
                ? await getDirectOAuthContainerStatus(token, containerId)
                : await getContainerStatus(token, containerId);

            if (status === 'FINISHED') return;
            if (status === 'ERROR') throw new Error('Media processing failed');

            await new Promise(r => setTimeout(r, 2000));
            attempts++;
        }
        throw new Error('Media processing timed out');
    }
}

module.exports = InstagramPublisher;
