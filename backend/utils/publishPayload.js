function buildPublishQueuePayload({ jobId, userId, traceId, post }) {
    return {
        jobId,
        userId,
        traceId,
        postId: post._id,
        platforms: post.platforms,
        content: {
            title: post.title,
            body: post.content,
            media: post.media,
            tiktokSettings: post.tiktokSettings,
        },
    };
}

module.exports = { buildPublishQueuePayload };

