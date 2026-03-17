/**
 * Abstract Base Publisher Class
 * Defines the interface for all platform publishers
 */
class BasePublisher {
    constructor(user) {
        this.user = user;
    }

    /**
     * Resolve and validate authentication for the platform
     * @param {Object} account - Platform account details
     * @returns {Promise<Object>} Auth credentials
     */
    async resolveAuth(account) {
        throw new Error('resolveAuth must be implemented');
    }

    /**
     * Validate content before publishing
     * @param {Object} content - Post content
     * @param {Array} media - Media items
     */
    async validateContent(content, media) {
        // Default validation (can be overridden)
        if (!content && (!media || media.length === 0)) {
            throw new Error('Content or media is required');
        }
    }

    /**
     * Publish content to the platform
     * @param {Object} account - Target account
     * @param {Object} postData - { content, media, title, etc. }
     * @returns {Promise<Object>} { postId, status, url }
     */
    async publish(account, postData) {
        throw new Error('publish must be implemented');
    }

    /**
     * Format the response
     */
    formatResponse(postId, status = 'published', data = {}) {
        return {
            postId,
            status,
            publishedAt: new Date(),
            ...data
        };
    }
}

module.exports = BasePublisher;
