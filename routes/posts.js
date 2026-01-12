const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
// const { publishPostById } = require('../services/publisher'); // Legacy removed

const router = express.Router();

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
            const { title, content, platforms, media = [], hashtags = [], mentions = [], scheduledDate, isScheduled } = req.body;

            // Debug logging
            console.log('[posts] Creating post with platforms:', JSON.stringify(platforms));

            const validPlatforms = ['facebook', 'instagram', 'tiktok', 'youtube'];
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
                media: post.media
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
                media: post.media
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

// GET /api/posts/status/:jobId
router.get('/status/:jobId', auth, async (req, res) => {
    try {
        const job = await PublishJob.findOne({ jobId: req.params.jobId });
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        res.json(job);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
// const express = require('express');
// const { body, validationResult } = require('express-validator');
// const Post = require('../models/Post');
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // @route   GET /api/posts
// // @desc    Get all posts for authenticated user
// // @access  Private
// router.get('/', auth, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         const filter = { user: req.user.id };

//         // Filter by status
//         if (req.query.status) {
//             filter['platforms.status'] = req.query.status;
//         }

//         // Filter by platform
//         if (req.query.platform) {
//             filter['platforms.name'] = req.query.platform;
//         }

//         // Filter by date range
//         if (req.query.startDate && req.query.endDate) {
//             filter.createdAt = {
//                 $gte: new Date(req.query.startDate),
//                 $lte: new Date(req.query.endDate)
//             };
//         }

//         const posts = await Post.find(filter)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit)
//             .populate('user', 'name email');

//         const total = await Post.countDocuments(filter);

//         res.json({
//             posts,
//             pagination: {
//                 current: page,
//                 pages: Math.ceil(total / limit),
//                 total
//             }
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/posts/:id
// // @desc    Get post by ID
// // @access  Private
// router.get('/:id', auth, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id).populate('user', 'name email');

//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         // Check if user owns the post
//         if (post.user._id.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'Not authorized' });
//         }

//         res.json(post);
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   POST /api/posts
// // @desc    Create a new post
// // @access  Private
// router.post('/', [
//     auth,
//     body('title', 'Title is required').not().isEmpty(),
//     body('content', 'Content is required').not().isEmpty(),
//     body('platforms', 'At least one platform is required').isArray({ min: 1 })
// ], async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const {
//             title,
//             content,
//             platforms,
//             media,
//             hashtags,
//             mentions,
//             scheduledDate,
//             isScheduled
//         } = req.body;

//         // Validate platforms
//         const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
//         for (const platform of platforms) {
//             if (!validPlatforms.includes(platform.name)) {
//                 return res.status(400).json({ message: `Invalid platform: ${platform.name}` });
//             }
//         }

//         const newPost = new Post({
//             user: req.user.id,
//             title,
//             content,
//             platforms: platforms.map(p => ({
//                 name: p.name,
//                 accountId: p.accountId,
//                 status: isScheduled ? 'scheduled' : 'draft'
//             })),
//             media: media || [],
//             hashtags: hashtags || [],
//             mentions: mentions || [],
//             scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
//             isScheduled: isScheduled || false,
//             isDraft: !isScheduled
//         });

//         const post = await newPost.save();
//         await post.populate('user', 'name email');

//         res.json(post);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   PUT /api/posts/:id
// // @desc    Update a post
// // @access  Private
// router.put('/:id', auth, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);

//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         // Check if user owns the post
//         if (post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'Not authorized' });
//         }

//         // Update fields
//         const updateFields = {};
//         const { title, content, platforms, media, hashtags, mentions, scheduledDate, isScheduled } = req.body;

//         if (title) updateFields.title = title;
//         if (content) updateFields.content = content;
//         if (platforms) updateFields.platforms = platforms;
//         if (media) updateFields.media = media;
//         if (hashtags) updateFields.hashtags = hashtags;
//         if (mentions) updateFields.mentions = mentions;
//         if (scheduledDate) updateFields.scheduledDate = new Date(scheduledDate);
//         if (typeof isScheduled === 'boolean') {
//             updateFields.isScheduled = isScheduled;
//             updateFields.isDraft = !isScheduled;
//         }

//         const updatedPost = await Post.findByIdAndUpdate(
//             req.params.id,
//             { $set: updateFields },
//             { new: true }
//         ).populate('user', 'name email');

//         res.json(updatedPost);
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   DELETE /api/posts/:id
// // @desc    Delete a post
// // @access  Private
// router.delete('/:id', auth, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);

//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         // Check if user owns the post
//         if (post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'Not authorized' });
//         }

//         await Post.findByIdAndDelete(req.params.id);

//         res.json({ message: 'Post removed' });
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   POST /api/posts/:id/publish
// // @desc    Publish a post immediately
// // @access  Private
// router.post('/:id/publish', auth, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);

//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         // Check if user owns the post
//         if (post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'Not authorized' });
//         }

//         // Update post status
//         post.platforms.forEach(platform => {
//             platform.status = 'published';
//             platform.publishedAt = new Date();
//         });
//         post.isPublished = true;
//         post.isDraft = false;
//         post.isScheduled = false;

//         await post.save();

//         // Here you would integrate with actual social media APIs
//         // For now, we'll just simulate the publishing

//         res.json({ message: 'Post published successfully', post });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/posts/analytics/overview
// // @desc    Get posts analytics overview
// // @access  Private
// router.get('/analytics/overview', auth, async (req, res) => {
//     try {
//         const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//         const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

//         const posts = await Post.find({
//             user: req.user.id,
//             createdAt: { $gte: startDate, $lte: endDate }
//         });

//         const analytics = {
//             totalPosts: posts.length,
//             publishedPosts: posts.filter(p => p.isPublished).length,
//             scheduledPosts: posts.filter(p => p.isScheduled).length,
//             draftPosts: posts.filter(p => p.isDraft).length,
//             totalReach: posts.reduce((sum, p) => sum + (p.analytics.totalReach || 0), 0),
//             totalEngagement: posts.reduce((sum, p) => sum + (p.analytics.totalEngagement || 0), 0),
//             averageEngagementRate: 0,
//             platformBreakdown: {}
//         };

//         // Calculate platform breakdown
//         posts.forEach(post => {
//             post.platforms.forEach(platform => {
//                 if (!analytics.platformBreakdown[platform.name]) {
//                     analytics.platformBreakdown[platform.name] = {
//                         posts: 0,
//                         published: 0,
//                         engagement: 0
//                     };
//                 }
//                 analytics.platformBreakdown[platform.name].posts++;
//                 if (platform.status === 'published') {
//                     analytics.platformBreakdown[platform.name].published++;
//                 }
//                 analytics.platformBreakdown[platform.name].engagement += platform.engagement?.likes || 0;
//             });
//         });

//         // Calculate average engagement rate
//         const publishedPosts = posts.filter(p => p.isPublished);
//         if (publishedPosts.length > 0) {
//             analytics.averageEngagementRate = publishedPosts.reduce((sum, p) => sum + (p.analytics.engagementRate || 0), 0) / publishedPosts.length;
//         }

//         res.json(analytics);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// module.exports = router;
