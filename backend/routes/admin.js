// const express = require('express');
// const auth = require('../middleware/auth');
// const User = require('../models/User');
// const Post = require('../models/Post');

// const router = express.Router();

// // Admin middleware to check if user is admin
// const adminAuth = (req, res, next) => {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Access denied. Admin role required.' });
//     }
//     next();
// };

// // @route   GET /api/admin/stats
// // @desc    Get admin dashboard statistics
// // @access  Private (Admin only)
// router.get('/stats', auth, adminAuth, async (req, res) => {
//     try {
//         const totalUsers = await User.countDocuments();
//         const activeUsers = await User.countDocuments({ isActive: true });
//         const totalPosts = await Post.countDocuments();
//         const publishedPosts = await Post.countDocuments({ isPublished: true });
//         const scheduledPosts = await Post.countDocuments({ isScheduled: true });

//         // User registrations in the last 30 days
//         const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//         const newUsers = await User.countDocuments({
//             createdAt: { $gte: thirtyDaysAgo }
//         });

//         // Posts created in the last 30 days
//         const newPosts = await Post.countDocuments({
//             createdAt: { $gte: thirtyDaysAgo }
//         });

//         // Subscription breakdown
//         const subscriptionStats = await User.aggregate([
//             {
//                 $group: {
//                     _id: '$subscription.plan',
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         // Platform usage
//         const platformStats = await Post.aggregate([
//             { $unwind: '$platforms' },
//             {
//                 $group: {
//                     _id: '$platforms.name',
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         const stats = {
//             users: {
//                 total: totalUsers,
//                 active: activeUsers,
//                 new: newUsers,
//                 inactive: totalUsers - activeUsers
//             },
//             posts: {
//                 total: totalPosts,
//                 published: publishedPosts,
//                 scheduled: scheduledPosts,
//                 new: newPosts
//             },
//             subscriptions: subscriptionStats.reduce((acc, item) => {
//                 acc[item._id] = item.count;
//                 return acc;
//             }, {}),
//             platforms: platformStats.reduce((acc, item) => {
//                 acc[item._id] = item.count;
//                 return acc;
//             }, {}),
//             systemHealth: {
//                 status: 'operational',
//                 uptime: '99.9%',
//                 responseTime: '120ms',
//                 errorRate: '0.1%'
//             }
//         };

//         res.json(stats);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/admin/users
// // @desc    Get all users with pagination
// // @access  Private (Admin only)
// router.get('/users', auth, adminAuth, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const skip = (page - 1) * limit;

//         const filter = {};

//         // Filter by status
//         if (req.query.status === 'active') {
//             filter.isActive = true;
//         } else if (req.query.status === 'inactive') {
//             filter.isActive = false;
//         }

//         // Filter by subscription plan
//         if (req.query.plan) {
//             filter['subscription.plan'] = req.query.plan;
//         }

//         // Search by name or email
//         if (req.query.search) {
//             filter.$or = [
//                 { name: { $regex: req.query.search, $options: 'i' } },
//                 { email: { $regex: req.query.search, $options: 'i' } }
//             ];
//         }

//         const users = await User.find(filter)
//             .select('-password')
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit);

//         const total = await User.countDocuments(filter);

//         res.json({
//             users,
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

// // @route   PUT /api/admin/users/:id
// // @desc    Update user (activate/deactivate, change role, etc.)
// // @access  Private (Admin only)
// router.put('/users/:id', auth, adminAuth, async (req, res) => {
//     try {
//         const { isActive, role, subscription } = req.body;

//         const updateFields = {};
//         if (typeof isActive === 'boolean') updateFields.isActive = isActive;
//         if (role) updateFields.role = role;
//         if (subscription) {
//             Object.keys(subscription).forEach(key => {
//                 updateFields[`subscription.${key}`] = subscription[key];
//             });
//         }

//         const user = await User.findByIdAndUpdate(
//             req.params.id,
//             { $set: updateFields },
//             { new: true }
//         ).select('-password');

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         res.json({
//             message: 'User updated successfully',
//             user
//         });
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   DELETE /api/admin/users/:id
// // @desc    Delete user account
// // @access  Private (Admin only)
// router.delete('/users/:id', auth, adminAuth, async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Delete all user's posts
//         await Post.deleteMany({ user: req.params.id });

//         // Delete user
//         await User.findByIdAndDelete(req.params.id);

//         res.json({ message: 'User and associated data deleted successfully' });
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/admin/posts
// // @desc    Get all posts across all users
// // @access  Private (Admin only)
// router.get('/posts', auth, adminAuth, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const skip = (page - 1) * limit;

//         const filter = {};

//         // Filter by status
//         if (req.query.status) {
//             if (req.query.status === 'published') {
//                 filter.isPublished = true;
//             } else if (req.query.status === 'scheduled') {
//                 filter.isScheduled = true;
//             } else if (req.query.status === 'draft') {
//                 filter.isDraft = true;
//             }
//         }

//         // Filter by platform
//         if (req.query.platform) {
//             filter['platforms.name'] = req.query.platform;
//         }

//         const posts = await Post.find(filter)
//             .populate('user', 'name email')
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit);

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

// // @route   DELETE /api/admin/posts/:id
// // @desc    Delete any post (content moderation)
// // @access  Private (Admin only)
// router.delete('/posts/:id', auth, adminAuth, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);

//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         await Post.findByIdAndDelete(req.params.id);

//         res.json({ message: 'Post deleted successfully' });
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/admin/analytics
// // @desc    Get platform-wide analytics
// // @access  Private (Admin only)
// router.get('/analytics', auth, adminAuth, async (req, res) => {
//     try {
//         const { period = '30d' } = req.query;

//         // Calculate date range
//         let startDate;
//         switch (period) {
//             case '7d':
//                 startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//                 break;
//             case '30d':
//                 startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//                 break;
//             case '90d':
//                 startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
//                 break;
//             default:
//                 startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//         }

//         // User growth analytics
//         const userGrowth = await User.aggregate([
//             {
//                 $match: { createdAt: { $gte: startDate } }
//             },
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: '$createdAt' },
//                         month: { $month: '$createdAt' },
//                         day: { $dayOfMonth: '$createdAt' }
//                     },
//                     count: { $sum: 1 }
//                 }
//             },
//             { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
//         ]);

//         // Post creation analytics
//         const postGrowth = await Post.aggregate([
//             {
//                 $match: { createdAt: { $gte: startDate } }
//             },
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: '$createdAt' },
//                         month: { $month: '$createdAt' },
//                         day: { $dayOfMonth: '$createdAt' }
//                     },
//                     count: { $sum: 1 }
//                 }
//             },
//             { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
//         ]);

//         // Revenue analytics (mock data)
//         const revenue = {
//             total: 45000,
//             growth: 15.2,
//             byPlan: {
//                 free: 0,
//                 basic: 15000,
//                 pro: 25000,
//                 enterprise: 5000
//             }
//         };

//         res.json({
//             period,
//             userGrowth,
//             postGrowth,
//             revenue
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/admin/system-health
// // @desc    Get system health metrics
// // @access  Private (Admin only)
// router.get('/system-health', auth, adminAuth, async (req, res) => {
//     try {
//         // Mock system health data (in production, this would come from monitoring tools)
//         const health = {
//             status: 'healthy',
//             uptime: process.uptime(),
//             memory: process.memoryUsage(),
//             cpu: {
//                 usage: Math.random() * 100, // Mock CPU usage
//                 load: [0.5, 0.3, 0.2] // Mock load averages
//             },
//             database: {
//                 status: 'connected',
//                 responseTime: Math.floor(Math.random() * 50) + 10 // Mock DB response time
//             },
//             apis: {
//                 facebook: { status: 'operational', responseTime: '120ms' },
//                 instagram: { status: 'operational', responseTime: '95ms' },
//                 twitter: { status: 'degraded', responseTime: '350ms' },
//                 linkedin: { status: 'operational', responseTime: '180ms' },
//                 tiktok: { status: 'operational', responseTime: '200ms' },
//                 youtube: { status: 'operational', responseTime: '160ms' }
//             },
//             errors: {
//                 last24h: Math.floor(Math.random() * 10),
//                 last7d: Math.floor(Math.random() * 50)
//             }
//         };

//         res.json(health);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// module.exports = router;
