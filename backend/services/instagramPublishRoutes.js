const instagramPublish = require('./instagramPublish');

function needsAsyncProcessing(type, children, { imageUrl, videoUrl } = {}) {
    if (type === 'REELS') return true;
    if (type === 'STORIES') return Boolean(videoUrl && !imageUrl);
    if (type === 'CAROUSEL') {
        return (children || []).some((child) => (child.type || '').toLowerCase() === 'video');
    }
    return false;
}

function publishErrorMessage(error) {
    return error.response?.data?.error
        ? instagramPublish.formatIgApiError(error)
        : (error.message || 'Publish failed');
}

function mountInstagramPublishRoutes(router, {
    PublishLog,
    loadAccountWithToken,
    touchAccount,
    logPrefix = '[instagramPublish]'
}) {
    async function runPublishJob({ logId, userId, accountId, igUserId, token, containerId, mediaType }) {
        try {
            await instagramPublish.waitForContainer(
                containerId,
                token,
                instagramPublish.waitOptionsForMediaType(mediaType, { background: true })
            );
            const published = await instagramPublish.publishContainer(igUserId, token, containerId);
            await PublishLog.findOneAndUpdate(
                { _id: logId, userId },
                { status: 'published', publishedMediaId: published.id }
            );
            await touchAccount(accountId);
            console.log(`${logPrefix} Background publish complete:`, published.id);
        } catch (error) {
            const msg = publishErrorMessage(error);
            await PublishLog.findOneAndUpdate({ _id: logId, userId }, { status: 'failed', error: msg });
            console.error(`${logPrefix} Background publish error:`, error.response?.data || error.message);
        }
    }

    async function runCarouselPublishJob({
        logId, userId, accountId, igUserId, token, children, caption, isAiGenerated, mediaType
    }) {
        try {
            const waitOpts = instagramPublish.waitOptionsForMediaType(mediaType, { background: true });
            const childIds = [];
            for (const child of children) {
                const isVideo = (child.type || '').toLowerCase() === 'video';
                const childPayload = { is_carousel_item: true };
                if (isVideo) {
                    childPayload.media_type = 'VIDEO';
                    childPayload.video_url = child.url;
                } else {
                    childPayload.image_url = instagramPublish.ensureInstagramImageUrl(child.url, 'IMAGE');
                    if (child.altText) childPayload.alt_text = child.altText;
                }
                const created = await instagramPublish.createMediaContainer(igUserId, token, childPayload);
                await instagramPublish.waitForContainer(created.id, token, waitOpts);
                childIds.push(created.id);
            }
            const carouselPayload = { media_type: 'CAROUSEL', children: childIds.join(',') };
            if (caption) carouselPayload.caption = caption;
            if (isAiGenerated) carouselPayload.is_ai_generated = true;
            const carousel = await instagramPublish.createMediaContainer(igUserId, token, carouselPayload);
            await instagramPublish.waitForContainer(carousel.id, token, waitOpts);
            const published = await instagramPublish.publishContainer(igUserId, token, carousel.id);
            await PublishLog.findOneAndUpdate(
                { _id: logId, userId },
                { status: 'published', publishedMediaId: published.id, containerId: carousel.id, carouselChildren: childIds }
            );
            await touchAccount(accountId);
        } catch (error) {
            const msg = publishErrorMessage(error);
            await PublishLog.findOneAndUpdate({ _id: logId, userId }, { status: 'failed', error: msg });
            console.error(`${logPrefix} Background carousel publish error:`, error.response?.data || error.message);
        }
    }

    router.post('/publish', async (req, res) => {
        const { accountId, mediaType, imageUrl, videoUrl, children, caption, altText, isAiGenerated } = req.body || {};
        let log;
        try {
            if (!accountId) throw new Error('accountId is required');
            const type = String(mediaType || '').toUpperCase();
            if (!['IMAGE', 'REELS', 'STORIES', 'CAROUSEL'].includes(type)) {
                throw new Error('mediaType must be IMAGE, REELS, STORIES, or CAROUSEL');
            }

            const { account, token, igUserId } = await loadAccountWithToken(req.user.id, accountId);
            const isStoryImage = type === 'STORIES' && imageUrl && !videoUrl;
            const isAsync = needsAsyncProcessing(type, children || [], { imageUrl, videoUrl });

            const mediaUrls = [];
            if (type === 'CAROUSEL') {
                if (!Array.isArray(children) || children.length < 2) throw new Error('CAROUSEL requires at least 2 children');
                if (children.length > 10) throw new Error('CAROUSEL supports a maximum of 10 items');
            } else if (type === 'IMAGE' || isStoryImage) {
                if (!imageUrl) throw new Error('imageUrl is required for IMAGE/STORY image');
                const preparedImageUrl = instagramPublish.ensureInstagramImageUrl(imageUrl, isStoryImage ? 'STORIES' : 'IMAGE');
                await instagramPublish.verifyInstagramImageUrl(preparedImageUrl);
                console.log(`${logPrefix} Publishing image URL:`, preparedImageUrl);
                mediaUrls.push(preparedImageUrl);
            } else {
                if (!videoUrl) throw new Error('videoUrl is required for REELS/STORIES video');
                mediaUrls.push(videoUrl);
            }

            log = await PublishLog.create({
                userId: req.user.id,
                igUserId,
                mediaType: type,
                caption,
                mediaUrls,
                status: isAsync ? 'processing' : 'pending'
            });

            if (isAsync && type === 'CAROUSEL') {
                log.mediaUrls = children.map((c) => c.url);
                await log.save();
                setImmediate(() => runCarouselPublishJob({
                    logId: log._id, userId: req.user.id, accountId: account.id,
                    igUserId, token, children, caption, isAiGenerated, mediaType: type
                }));
                return res.status(202).json({
                    success: true, async: true, logId: log._id,
                    message: 'Carousel is processing on Instagram. This may take a few minutes.'
                });
            }

            const waitOpts = instagramPublish.waitOptionsForMediaType(type);
            let creationId;

            if (type === 'CAROUSEL') {
                const childIds = [];
                for (const child of children) {
                    const isVideo = (child.type || '').toLowerCase() === 'video';
                    const childPayload = { is_carousel_item: true };
                    if (isVideo) {
                        childPayload.media_type = 'VIDEO';
                        childPayload.video_url = child.url;
                    } else {
                        childPayload.image_url = instagramPublish.ensureInstagramImageUrl(child.url, 'IMAGE');
                        if (child.altText) childPayload.alt_text = child.altText;
                    }
                    const created = await instagramPublish.createMediaContainer(igUserId, token, childPayload);
                    await instagramPublish.waitForContainer(created.id, token, waitOpts);
                    childIds.push(created.id);
                }
                const carouselPayload = { media_type: 'CAROUSEL', children: childIds.join(',') };
                if (caption) carouselPayload.caption = caption;
                if (isAiGenerated) carouselPayload.is_ai_generated = true;
                const carousel = await instagramPublish.createMediaContainer(igUserId, token, carouselPayload);
                await instagramPublish.waitForContainer(carousel.id, token, waitOpts);
                creationId = carousel.id;
                log.carouselChildren = childIds;
                log.mediaUrls = children.map((c) => c.url);
            } else {
                const payload = {};
                if (caption) payload.caption = caption;
                if (isAiGenerated) payload.is_ai_generated = true;
                if (type === 'IMAGE' || isStoryImage) {
                    payload.image_url = mediaUrls[0];
                    if (type === 'STORIES') payload.media_type = 'STORIES';
                    if (altText) payload.alt_text = altText;
                } else {
                    payload.media_type = type;
                    payload.video_url = videoUrl;
                }
                const container = await instagramPublish.createMediaContainer(igUserId, token, payload);
                creationId = container.id;
                if (isAsync) {
                    log.containerId = creationId;
                    await log.save();
                    setImmediate(() => runPublishJob({
                        logId: log._id, userId: req.user.id, accountId: account.id,
                        igUserId, token, containerId: creationId, mediaType: type
                    }));
                    return res.status(202).json({
                        success: true, async: true, logId: log._id, containerId: creationId,
                        message: 'Video is processing on Instagram. This usually takes 1–3 minutes.'
                    });
                }
                await instagramPublish.waitForContainer(container.id, token, waitOpts);
            }

            log.containerId = creationId;
            await log.save();
            const published = await instagramPublish.publishContainer(igUserId, token, creationId);
            log.publishedMediaId = published.id;
            log.status = 'published';
            await log.save();
            await touchAccount(account.id);
            res.json({ success: true, mediaId: published.id, containerId: creationId });
        } catch (error) {
            const msg = publishErrorMessage(error);
            if (log) {
                log.status = 'failed';
                log.error = msg;
                await log.save().catch(() => {});
            }
            console.error(`${logPrefix} publish error:`, error.response?.data || error.message);
            res.status(500).json({ message: msg });
        }
    });

    router.get('/publish/:logId', async (req, res) => {
        try {
            const log = await PublishLog.findOne({ _id: req.params.logId, userId: req.user.id });
            if (!log) return res.status(404).json({ message: 'Publish job not found' });
            res.json({
                logId: log._id,
                status: log.status,
                mediaId: log.publishedMediaId,
                containerId: log.containerId,
                error: log.error
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    router.get('/publish-limit/:accountId', async (req, res) => {
        try {
            const { token, igUserId } = await loadAccountWithToken(req.user.id, req.params.accountId);
            const data = await instagramPublish.getPublishingLimit(igUserId, token);
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: instagramPublish.formatIgApiError(error) });
        }
    });

    router.get('/logs', async (req, res) => {
        try {
            const logs = await PublishLog.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
            res.json({ logs });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
}

module.exports = { mountInstagramPublishRoutes, needsAsyncProcessing, publishErrorMessage };
