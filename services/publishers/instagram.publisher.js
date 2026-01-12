const BasePublisher = require('./base.publisher');
const {
    createDirectOAuthMediaContainer,
    publishDirectOAuthContainer,
    getDirectOAuthContainerStatus,
    getContainerStatus,
    refreshLongLivedToken
} = require('../instagram');
const AccountService = require('../account.service');

class InstagramPublisher extends BasePublisher {

    async resolveAuth(account) {
        console.log(`[InstagramPublisher] Resolving auth for: ${account.accountId}`);

        // 1. Try to find direct Instagram Login account
        const directAccount = await AccountService.getAccount(this.user._id, 'instagram', account.accountId);

        if (directAccount) {
            // Check expiry (refresh if expired or expires in < 1 hour)
            // Long-lived tokens last 60 days. Checking < 1 hour is safe buffer.
            const now = Date.now();
            const expires = directAccount.tokenExpires ? new Date(directAccount.tokenExpires).getTime() : 0;
            const isExpired = expires > 0 && (expires - now < 60 * 60 * 1000);

            // If expired or we suspect it might be stale/invalid (we could also rely on try-catch in publish, but proactive is better for "expired" dates)
            if (isExpired) {
                console.log('[InstagramPublisher] Token likely expired. Refreshing...');
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
                        kind: 'instagram',
                        accessToken: refreshed.access_token,
                        instagramId: account.accountId,
                        accountName: directAccount.accountName,
                        isDirect: true
                    };
                } catch (e) {
                    console.warn('[InstagramPublisher] Failed to proactive refresh:', e.message);
                    // Fallthrough to try existing token, maybe date was wrong or refresh failed but token is still barely valid
                }
            }

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
        let auth = await this.resolveAuth(account);
        const { content, media } = postData;

        if (!media || media.length === 0) {
            throw new Error('Instagram requires media (image or video)');
        }

        const mediaItem = media[0];
        const caption = content || '';

        if (!auth.isDirect) {
            throw new Error('Only Direct Instagram Login supported in this version');
        }

        try {
            return await this._publishInternal(auth, mediaItem, caption);
        } catch (error) {
            // Check if it's an invalid token error (IG_INVALID_TOKEN or code 190)
            const isTokenError = error.code === 'IG_INVALID_TOKEN' || error.message?.includes('Invalid OAuth access token');

            if (isTokenError) {
                console.log('[InstagramPublisher] Token invalid during publish. Attempting reactive refresh...');
                try {
                    // Force refresh
                    const directAccount = await AccountService.getAccount(this.user._id, 'instagram', account.accountId);
                    if (!directAccount) throw error; // account gone?

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

                    // Update auth object with new token
                    auth.accessToken = refreshed.access_token;

                    // Retry publish with new token
                    console.log('[InstagramPublisher] Retrying publish with refreshed token...');
                    return await this._publishInternal(auth, mediaItem, caption);

                } catch (refreshErr) {
                    console.error('[InstagramPublisher] Reactive refresh failed:', refreshErr.message);
                    throw error; // Throw original error if refresh fails
                }
            }
            throw error; // Throw non-token errors
        }
    }

    async _publishInternal(auth, mediaItem, caption) {
        // Validation: Instagram Graph API deprecation requires REELS for video
        const isVideo = mediaItem.type === 'video';

        const payload = {
            caption: caption,
            media_type: isVideo ? 'REELS' : 'IMAGE'
        };

        if (isVideo) {
            payload.video_url = mediaItem.url;
            // Ensure media_type is REELS for video, as VIDEO is deprecated
            payload.media_type = 'REELS';
        } else {
            payload.image_url = mediaItem.url;
        }

        const containerResult = await createDirectOAuthMediaContainer(
            auth.instagramId,
            auth.accessToken,
            payload
        );
        const containerId = containerResult.id;

        // Must wait for container to be ready, otherwise we get "Media ID is not available"
        await this._waitForContainer(auth.accessToken, containerId, true);

        const publishResult = await publishDirectOAuthContainer(auth.instagramId, auth.accessToken, containerId);
        return this.formatResponse(publishResult.id, 'published');
    }

    async _waitForContainer(token, containerId, isDirect) {
        // PROCESSING can take time for videos/reels. Found ~80s in logs.
        // We check every 1s (fastest safe interval) up to 5 mins.
        let attempts = 0;
        const maxAttempts = 300;
        const interval = 1000;

        while (attempts < maxAttempts) {
            const status = isDirect
                ? await getDirectOAuthContainerStatus(containerId, token)
                : await getContainerStatus(containerId, token);

            if (status === 'FINISHED') return;
            if (status === 'ERROR') throw new Error('Media processing failed');

            await new Promise(r => setTimeout(r, interval));
            attempts++;
        }
        throw new Error(`Media processing timed out after ${maxAttempts * interval / 1000} seconds`);
    }
}

module.exports = InstagramPublisher;
