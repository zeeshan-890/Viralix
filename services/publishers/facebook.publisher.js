const BasePublisher = require('./base.publisher');
const { createPagePost, createPagePhoto, createPageVideo } = require('../facebook');
const axios = require('axios');
const AccountService = require('../account.service');

class FacebookPublisher extends BasePublisher {

    async resolveAuth(account) {
        console.log(`[FacebookPublisher] Resolving auth for page: ${account.accountId}`);

        // Fetch users connected Facebook account from SocialAccount collection
        const accounts = await AccountService.getAccounts(this.user._id);
        const fbAccount = accounts.find(a => a.platform === 'facebook');

        if (!fbAccount) {
            throw new Error('Facebook account not connected');
        }

        // We need the *Page* Access Token.
        // We must fetch the Page Token using the User Token.
        try {
            const pageToken = await this._getPageAccessToken(fbAccount.accessToken, account.accountId);
            return {
                kind: 'facebook',
                pageId: account.accountId,
                token: pageToken,
                pageName: account.accountName
            };
        } catch (error) {
            throw new Error(`Failed to get Page Access Token: ${error.message}`);
        }
    }

    async _getPageAccessToken(userAccessToken, pageId) {
        try {
            const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
                params: {
                    fields: 'access_token',
                    access_token: userAccessToken
                }
            });
            return response.data.access_token;
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                const msg = error.response.data.error.message;
                if (msg.includes('Provide valid app ID') || msg.includes('access token is required') || msg.includes('Error validating access token')) {
                    throw new Error('Facebook authentication failed. Please go to Connect Accounts and Reconnect Facebook.');
                }
                throw new Error(msg);
            }
            throw error;
        }
    }

    async publish(account, postData) {
        const auth = await this.resolveAuth(account);
        const { content, media } = postData;

        if (media && media.length > 0) {
            const mediaItem = media[0];
            if (mediaItem.type === 'video') {
                return await createPageVideo(auth.pageId, auth.token, content, mediaItem.url);
            } else {
                return await createPagePhoto(auth.pageId, auth.token, content, mediaItem.url);
            }
        } else {
            return await createPagePost(auth.pageId, auth.token, content);
        }
    }
}

module.exports = FacebookPublisher;
