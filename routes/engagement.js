// const express = require('express');
// const auth = require('../middleware/auth');
// const Post = require('../models/Post');

// const router = express.Router();

// // Mock engagement data for demonstration
// const mockComments = [
//     {
//         id: '1',
//         postId: 'post1',
//         platform: 'instagram',
//         author: 'john_doe',
//         content: 'Great post! Love this content.',
//         timestamp: new Date(Date.now() - 2 * 60 * 1000),
//         sentiment: 'positive',
//         isRead: false,
//         needsResponse: true
//     },
//     {
//         id: '2',
//         postId: 'post2',
//         platform: 'facebook',
//         author: 'jane_smith',
//         content: 'When will this be available?',
//         timestamp: new Date(Date.now() - 15 * 60 * 1000),
//         sentiment: 'neutral',
//         isRead: false,
//         needsResponse: true
//     },
//     {
//         id: '3',
//         postId: 'post1',
//         platform: 'twitter',
//         author: 'tech_enthusiast',
//         content: 'Amazing innovation! 🚀',
//         timestamp: new Date(Date.now() - 60 * 60 * 1000),
//         sentiment: 'positive',
//         isRead: true,
//         needsResponse: false
//     }
// ];

// const mockMentions = [
//     {
//         id: '1',
//         platform: 'twitter',
//         author: 'industry_leader',
//         content: 'Check out @autoreach_ai - they are doing great work in social media automation!',
//         timestamp: new Date(Date.now() - 30 * 60 * 1000),
//         sentiment: 'positive',
//         isRead: false,
//         url: 'https://twitter.com/industry_leader/status/123456789'
//     },
//     {
//         id: '2',
//         platform: 'linkedin',
//         author: 'marketing_pro',
//         content: 'Has anyone tried AutoReach AI for their social media management?',
//         timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
//         sentiment: 'neutral',
//         isRead: false,
//         url: 'https://linkedin.com/posts/marketing_pro_123456'
//     }
// ];

// // @route   GET /api/engagement/comments
// // @desc    Get comments across all platforms
// // @access  Private
// router.get('/comments', auth, async (req, res) => {
//     try {
//         const { platform, status, page = 1, limit = 20 } = req.query;

//         let filteredComments = [...mockComments];

//         // Filter by platform
//         if (platform) {
//             filteredComments = filteredComments.filter(comment => comment.platform === platform);
//         }

//         // Filter by status
//         if (status === 'unread') {
//             filteredComments = filteredComments.filter(comment => !comment.isRead);
//         } else if (status === 'needs_response') {
//             filteredComments = filteredComments.filter(comment => comment.needsResponse);
//         }

//         // Sort by timestamp (newest first)
//         filteredComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

//         // Pagination
//         const startIndex = (page - 1) * limit;
//         const paginatedComments = filteredComments.slice(startIndex, startIndex + parseInt(limit));

//         res.json({
//             comments: paginatedComments,
//             pagination: {
//                 current: parseInt(page),
//                 total: Math.ceil(filteredComments.length / limit),
//                 count: filteredComments.length
//             },
//             stats: {
//                 total: mockComments.length,
//                 unread: mockComments.filter(c => !c.isRead).length,
//                 needsResponse: mockComments.filter(c => c.needsResponse).length,
//                 positive: mockComments.filter(c => c.sentiment === 'positive').length,
//                 neutral: mockComments.filter(c => c.sentiment === 'neutral').length,
//                 negative: mockComments.filter(c => c.sentiment === 'negative').length
//             }
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   PUT /api/engagement/comments/:id
// // @desc    Update comment status (mark as read, responded, etc.)
// // @access  Private
// router.put('/comments/:id', auth, async (req, res) => {
//     try {
//         const { isRead, needsResponse, response } = req.body;
//         const commentId = req.params.id;

//         // Find and update comment (in a real app, this would be in a database)
//         const commentIndex = mockComments.findIndex(c => c.id === commentId);

//         if (commentIndex === -1) {
//             return res.status(404).json({ message: 'Comment not found' });
//         }

//         if (typeof isRead === 'boolean') {
//             mockComments[commentIndex].isRead = isRead;
//         }

//         if (typeof needsResponse === 'boolean') {
//             mockComments[commentIndex].needsResponse = needsResponse;
//         }

//         if (response) {
//             mockComments[commentIndex].response = response;
//             mockComments[commentIndex].respondedAt = new Date();
//             mockComments[commentIndex].needsResponse = false;
//         }

//         res.json({
//             message: 'Comment updated successfully',
//             comment: mockComments[commentIndex]
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/engagement/mentions
// // @desc    Get brand mentions across platforms
// // @access  Private
// router.get('/mentions', auth, async (req, res) => {
//     try {
//         const { platform, sentiment, page = 1, limit = 20 } = req.query;

//         let filteredMentions = [...mockMentions];

//         // Filter by platform
//         if (platform) {
//             filteredMentions = filteredMentions.filter(mention => mention.platform === platform);
//         }

//         // Filter by sentiment
//         if (sentiment) {
//             filteredMentions = filteredMentions.filter(mention => mention.sentiment === sentiment);
//         }

//         // Sort by timestamp (newest first)
//         filteredMentions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

//         // Pagination
//         const startIndex = (page - 1) * limit;
//         const paginatedMentions = filteredMentions.slice(startIndex, startIndex + parseInt(limit));

//         res.json({
//             mentions: paginatedMentions,
//             pagination: {
//                 current: parseInt(page),
//                 total: Math.ceil(filteredMentions.length / limit),
//                 count: filteredMentions.length
//             },
//             stats: {
//                 total: mockMentions.length,
//                 unread: mockMentions.filter(m => !m.isRead).length,
//                 positive: mockMentions.filter(m => m.sentiment === 'positive').length,
//                 neutral: mockMentions.filter(m => m.sentiment === 'neutral').length,
//                 negative: mockMentions.filter(m => m.sentiment === 'negative').length
//             }
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   PUT /api/engagement/mentions/:id
// // @desc    Update mention status
// // @access  Private
// router.put('/mentions/:id', auth, async (req, res) => {
//     try {
//         const { isRead } = req.body;
//         const mentionId = req.params.id;

//         const mentionIndex = mockMentions.findIndex(m => m.id === mentionId);

//         if (mentionIndex === -1) {
//             return res.status(404).json({ message: 'Mention not found' });
//         }

//         if (typeof isRead === 'boolean') {
//             mockMentions[mentionIndex].isRead = isRead;
//         }

//         res.json({
//             message: 'Mention updated successfully',
//             mention: mockMentions[mentionIndex]
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/engagement/stats
// // @desc    Get engagement statistics
// // @access  Private
// router.get('/stats', auth, async (req, res) => {
//     try {
//         const { period = '7d' } = req.query;

//         // Calculate date range
//         let startDate;
//         switch (period) {
//             case '24h':
//                 startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
//                 break;
//             case '7d':
//                 startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//                 break;
//             case '30d':
//                 startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//                 break;
//             default:
//                 startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//         }

//         // Filter data by date range
//         const recentComments = mockComments.filter(c => new Date(c.timestamp) >= startDate);
//         const recentMentions = mockMentions.filter(m => new Date(m.timestamp) >= startDate);

//         const stats = {
//             period,
//             comments: {
//                 total: recentComments.length,
//                 unread: recentComments.filter(c => !c.isRead).length,
//                 needsResponse: recentComments.filter(c => c.needsResponse).length,
//                 responded: recentComments.filter(c => c.response).length,
//                 averageResponseTime: '2.3h', // Mock data
//                 sentiment: {
//                     positive: recentComments.filter(c => c.sentiment === 'positive').length,
//                     neutral: recentComments.filter(c => c.sentiment === 'neutral').length,
//                     negative: recentComments.filter(c => c.sentiment === 'negative').length
//                 }
//             },
//             mentions: {
//                 total: recentMentions.length,
//                 unread: recentMentions.filter(m => !m.isRead).length,
//                 sentiment: {
//                     positive: recentMentions.filter(m => m.sentiment === 'positive').length,
//                     neutral: recentMentions.filter(m => m.sentiment === 'neutral').length,
//                     negative: recentMentions.filter(m => m.sentiment === 'negative').length
//                 }
//             },
//             responseRate: recentComments.length > 0 ?
//                 Math.round((recentComments.filter(c => c.response).length / recentComments.length) * 100) : 0,
//             sentimentScore: 8.5 // Mock overall sentiment score out of 10
//         };

//         res.json(stats);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   POST /api/engagement/templates
// // @desc    Create response template
// // @access  Private
// router.post('/templates', auth, async (req, res) => {
//     try {
//         const { name, content, category, platforms } = req.body;

//         if (!name || !content) {
//             return res.status(400).json({ message: 'Name and content are required' });
//         }

//         // In a real app, this would be saved to database
//         const template = {
//             id: Date.now().toString(),
//             name,
//             content,
//             category: category || 'general',
//             platforms: platforms || ['all'],
//             userId: req.user.id,
//             createdAt: new Date(),
//             usageCount: 0
//         };

//         res.json({
//             message: 'Template created successfully',
//             template
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/engagement/templates
// // @desc    Get response templates
// // @access  Private
// router.get('/templates', auth, async (req, res) => {
//     try {
//         // Mock templates data
//         const templates = [
//             {
//                 id: '1',
//                 name: 'Thank You',
//                 content: 'Thank you for your comment! We appreciate your feedback.',
//                 category: 'appreciation',
//                 platforms: ['all'],
//                 usageCount: 15,
//                 createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
//             },
//             {
//                 id: '2',
//                 name: 'Product Inquiry',
//                 content: 'Thanks for your interest! Please visit our website or DM us for more details.',
//                 category: 'support',
//                 platforms: ['instagram', 'facebook'],
//                 usageCount: 8,
//                 createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
//             }
//         ];

//         res.json(templates);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// module.exports = router;
