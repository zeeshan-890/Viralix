const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
// const { publishPostById } = require('../services/publisher'); // Legacy removed

const router = express.Router();

// ─── Static sub-routes MUST be registered before parameterized /:id routes ───

// GET /api/posts/status/:jobId
router.get('/status/:jobId', auth, async (req, res) => {
    try {
        const PublishJob = require('../models/PublishJob');
        const job = await PublishJob.findOne({ jobId: req.params.jobId });
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        res.json(job);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/posts - list posts (optionally by month)
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { user: req.user.id };
        if (req.query.status) filter['platforms.status'] = req.query.status;
        if (req.query.platform) filter['platforms.name'] = req.query.platform;
        if (req.query.month && req.query.year) {
            const year = parseInt(req.query.year, 10);
            const month = parseInt(req.query.month, 10) - 1; // 0-based
            // Add padding to cover timezone differences (fetch a few days before and after)
            // This ensures logic like "Jan 1st Local = Dec 31st UTC" is captured when querying for Jan
            const start = new Date(Date.UTC(year, month, -2, 0, 0, 0));
            const end = new Date(Date.UTC(year, month + 1, 3, 23, 59, 59));
            filter.scheduledDate = { $gte: start, $lte: end };
        }

        const [posts, total] = await Promise.all([
            Post.find(filter).sort({ scheduledDate: 1, createdAt: -1 }).skip(skip).limit(limit),
            Post.countDocuments(filter),
        ]);

        res.json({
            posts,
            pagination: { current: page, pages: Math.ceil(total / limit), total },
        });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/posts/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        res.json(post);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/posts - create
router.post(
    '/',
    [
        auth,
        body('title').notEmpty().withMessage('Title is required'),
        body('content').notEmpty().withMessage('Content is required'),
        body('platforms').isArray({ min: 1 }).withMessage('Platforms required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { title, content, platforms, media = [], hashtags = [], mentions = [], scheduledDate, isScheduled, tiktokSettings } = req.body;

            // Debug logging
            console.log('[posts] Creating post with platforms:', JSON.stringify(platforms));

            const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
            for (const p of platforms) {
                if (!validPlatforms.includes(p.name)) {
                    return res.status(400).json({ message: `Invalid platform: ${p.name}` });
                }
                if (!p.accountId) {
                    console.log('[posts] Missing accountId for platform:', JSON.stringify(p));
                    return res.status(400).json({ message: 'platform.accountId is required' });
                }
            }
            const post = new Post({
                user: req.user.id,
                title,
                content,
                platforms: platforms.map(p => ({ name: p.name, accountId: p.accountId, status: isScheduled ? 'scheduled' : 'draft' })),
                media,
                hashtags,
                mentions,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                isScheduled: !!isScheduled,
                isDraft: !isScheduled,
                // Store TikTok-specific settings if provided
                tiktokSettings: tiktokSettings || null
            });
            const saved = await post.save();
            res.json(saved);
        } catch (e) {
            console.error(e.message);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// PUT /api/posts/:id - update
router.put('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { title, content, platforms, media, hashtags, mentions, scheduledDate, isScheduled } = req.body;
        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (platforms !== undefined) {
            // Normalize incoming platforms array to include required fields and statuses
            const normalized = (Array.isArray(platforms) ? platforms : []).map(p => ({
                name: p.name,
                accountId: p.accountId,
                status: p.status || (req.body.isScheduled ? 'scheduled' : 'draft'),
                postId: p.postId,
                publishedAt: p.publishedAt,
                errorMessage: p.errorMessage,
                engagement: p.engagement,
            }));
            post.platforms = normalized;
        }
        if (media !== undefined) post.media = media;
        if (hashtags !== undefined) post.hashtags = hashtags;
        if (mentions !== undefined) post.mentions = mentions;
        if (scheduledDate !== undefined) post.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
        if (typeof isScheduled === 'boolean') {
            post.isScheduled = isScheduled;
            post.isDraft = !isScheduled;
            // Adjust platform statuses to match scheduling state when not already published
            post.platforms = (post.platforms || []).map(p => ({
                ...(p.toObject?.() || p),
                status: p.status === 'published' ? 'published' : (isScheduled ? 'scheduled' : 'draft'),
            }));
        }
        const saved = await post.save();
        res.json(saved);
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        // 1. Delete related PublishJobs
        const PublishJob = require('../models/PublishJob');
        const deletedJobs = await PublishJob.deleteMany({
            userId: req.user.id,
            'content.title': post.title
        });
        console.log(`[Delete Post] Deleted ${deletedJobs.deletedCount} related PublishJobs`);

        // 2. Delete media from Cloudinary
        if (post.media && post.media.length > 0) {
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            for (const media of post.media) {
                if (media.url) {
                    try {
                        // Extract public_id from Cloudinary URL
                        const urlParts = media.url.split('/');
                        const uploadIndex = urlParts.findIndex(p => p === 'upload');
                        if (uploadIndex !== -1) {
                            // Get everything after 'upload/vXXX/' and remove extension
                            const publicIdParts = urlParts.slice(uploadIndex + 2);
                            let publicId = publicIdParts.join('/');
                            publicId = publicId.replace(/\.[^/.]+$/, ''); // Remove extension

                            const resourceType = media.type === 'video' ? 'video' : 'image';
                            const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                            console.log(`[Delete Post] Cloudinary delete ${publicId}:`, result.result);
                        }
                    } catch (cloudinaryError) {
                        console.error('[Delete Post] Cloudinary delete error:', cloudinaryError.message);
                        // Continue even if Cloudinary delete fails
                    }
                }
            }
        }

        // 3. Delete the post
        await Post.findByIdAndDelete(req.params.id);

        res.json({ message: 'Post and related data removed successfully' });
    } catch (e) {
        console.error('[Delete Post] Error:', e.message);
        res.status(500).json({ message: 'Server error' });
    }
});

const publishQueue = require('../services/queue/publish.queue');
const PublishJob = require('../models/PublishJob');
const { v4: uuidv4 } = require('uuid');

// POST /api/posts/:id/publish - publish async via queue
router.post('/:id/publish', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const jobId = uuidv4();

        // Create Job Record
        const job = new PublishJob({
            jobId,
            userId: req.user.id,
            postId: post._id,
            platforms: post.platforms.map(p => ({
                name: p.name,
                accountId: p.accountId,
                accountName: p.label || p.name, // Fallback
                status: 'pending'
            })),
            content: {
                title: post.title,
                body: post.content,
                media: post.media,
                tiktokSettings: post.tiktokSettings
            },
            status: 'queued'
        });
        await job.save();

        // Add to Queue
        await publishQueue.add({
            jobId,
            userId: req.user.id,
            postId: post._id,
            platforms: post.platforms,
            content: {
                title: post.title,
                body: post.content,
                media: post.media,
                tiktokSettings: post.tiktokSettings
            }
        });

        res.json({
            message: 'Publishing started in background',
            jobId,
            status: 'queued'
        });
    } catch (e) {
        console.error('Publish error:', e.message);
        res.status(500).json({ message: e.message });
    }
});

// NOTE: GET /status/:jobId is registered above /:id to prevent route conflicts

// POST /api/posts/:id/remix — AI-powered content remix
// Creates a new draft post from an existing post with fresh caption & hashtags
router.post('/:id/remix', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { tone = 'fresh', platform } = req.body;
        const validTones = ['fresh', 'emotional', 'professional', 'humorous', 'linkedin-style'];
        if (!validTones.includes(tone)) {
            return res.status(400).json({ message: `Invalid tone. Choose from: ${validTones.join(', ')}` });
        }

        const targetPlatform = platform || post.platforms[0]?.name || 'instagram';

        const { remixContent } = require('../services/ai');
        const remixed = await remixContent({
            content: post.content,
            hashtags: post.hashtags,
            tone,
            platform: targetPlatform
        });

        // Create a new draft post with remixed content
        const newPost = new Post({
            user: req.user.id,
            title: `${post.title} (Remixed)`,
            content: remixed.caption || post.content,
            platforms: post.platforms.map(p => ({
                name: p.name,
                accountId: p.accountId,
                status: 'draft'
            })),
            media: post.media, // Reuse same media (Cloudinary URLs)
            hashtags: remixed.hashtags || post.hashtags,
            mentions: post.mentions,
            isDraft: true,
            isScheduled: false,
            aiGenerated: true
        });

        const saved = await newPost.save();

        res.json({
            message: 'Content remixed successfully',
            originalPostId: post._id,
            newPost: saved,
            appliedTone: tone
        });
    } catch (e) {
        console.error('[Remix] Error:', e.message);
        res.status(500).json({ message: 'Remix failed: ' + e.message });
    }
});

module.exports = router;

