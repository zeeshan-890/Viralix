const express = require('express');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const { generateText } = require('../services/ai'); // Assumes generic generateText available
const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  1. ANALYZE — Get content strategy from past performance
// ─────────────────────────────────────────────────────────────
router.post('/analyze', auth, async (req, res) => {
    try {
        const { platform = 'instagram', days = 90 } = req.body;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Fetch top performing posts
        const topPosts = await Post.find({
            user: req.user.id,
            isPublished: true,
            createdAt: { $gte: since },
            'platforms.name': platform
        })
            .sort({ 'analytics.engagementRate': -1 }) // Sort by engagement
            .limit(5)
            .select('title content hashtags analytics.engagementRate media.type')
            .lean();

        // If no posts, return generic strategy
        if (topPosts.length === 0) {
            return res.json({
                strategy: {
                    topics: ['Industry News', 'Behind the Scenes', 'Tips & Tricks', 'Motivation'],
                    tone: 'Professional yet engaging',
                    bestTime: '10:00 AM',
                    format: 'Mix of images and videos',
                    notes: 'No past data found. Using industry standards.'
                },
                topPosts: []
            });
        }

        // Aggregate data for AI analysis
        const postsSummary = topPosts.map(p =>
            `- Topic: ${p.title || p.content.substring(0, 30)}... | Type: ${p.media?.[0]?.type || 'text'} | Engagement: ${p.analytics?.engagementRate?.toFixed(2)}%`
        ).join('\n');

        // Ask AI to derive strategy
        const prompt = `Analyze these top performing social media posts and extract a content strategy.
        
        Posts:
        ${postsSummary}
        
        Return JSON with fields: topics (array of 5 strings), tone (string), bestTime (string), format (string recommendation), notes (string observation).
        Do not include markdown formatting.`;

        let analysis;
        try {
            const aiJson = await generateText({ prompt });
            // Cleanup json if wrapped in backticks
            const cleanJson = aiJson.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(cleanJson);
        } catch (e) {
            // Fallback if AI fails parsing
            analysis = {
                topics: ['Educational', 'Inspirational', 'Promotional'],
                tone: 'Consistent with top posts',
                bestTime: 'Based on past performance',
                format: 'Image/Video mix',
                notes: 'derived from engagement data'
            };
        }

        res.json({
            strategy: analysis,
            topPosts
        });

    } catch (e) {
        console.error('[AI Calendar] Analyze error:', e.message);
        res.status(500).json({ message: 'Analysis failed' });
    }
});

// ─────────────────────────────────────────────────────────────
//  2. GENERATE — Batched content creation
// ─────────────────────────────────────────────────────────────
router.post('/generate', auth, async (req, res) => {
    try {
        const { strategy, days = 7, platform = 'instagram', topics } = req.body;

        const count = Math.min(days, 30); // Cap at 30 days
        const topicList = topics && topics.length ? topics.join(', ') : strategy.topics.join(', ');

        const prompt = `Generate a ${count}-day social media content calendar for ${platform}.
        
        Strategy:
        - Topics: ${topicList}
        - Tone: ${strategy.tone}
        - Format: ${strategy.format}
        
        Output a JSON array of objects, where each object has:
        - day (number 1-${count})
        - title (short hook)
        - content (the caption, max 100 words, include emojis)
        - imagePrompt (description for an image)
        - hashtags (array of string tags)
        
        Strictly valid JSON array only. No markdown.`;

        const raw = await generateText({ prompt });
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        let plan;
        try {
            plan = JSON.parse(clean);
        } catch (e) {
            // If AI returns broken JSON, try to salvage or fail
            console.error('JSON parse fail:', e.message, clean.substring(0, 100));
            return res.status(500).json({ message: 'AI generation format error. Try again.' });
        }

        res.json({ plan });
    } catch (e) {
        console.error('[AI Calendar] Generate error:', e.message);
        res.status(500).json({ message: 'Generation failed' });
    }
});

// ─────────────────────────────────────────────────────────────
//  3. CONFIRM — Bulk create posts
// ─────────────────────────────────────────────────────────────
router.post('/confirm', auth, async (req, res) => {
    try {
        const { plan, platform, startDate } = req.body;

        if (!Array.isArray(plan)) return res.status(400).json({ message: 'Invalid plan format' });

        const start = startDate ? new Date(startDate) : new Date();
        const postsToCreate = plan.map((item, idx) => {
            const publishDate = new Date(start);
            publishDate.setDate(start.getDate() + (item.day - 1));
            // Set time to default 10am if not specified
            publishDate.setHours(10, 0, 0, 0);

            // Build caption with image idea appended so nothing is lost
            const caption = item.content || 'AI-generated post';
            const fullContent = item.imagePrompt
                ? `${caption}\n\n🎨 Image idea: ${item.imagePrompt}`
                : caption;

            return {
                user: req.user.id,
                title: item.title || `Post Day ${item.day}`,
                content: fullContent,
                hashtags: item.hashtags || [],
                platforms: [{
                    name: platform,
                    status: 'draft',
                    accountId: 'pending' // Resolved when user edits or publishes
                }],
                media: [],
                isScheduled: true,
                scheduledDate: publishDate,
                isDraft: true,
                aiGenerated: true
            };
        });

        await Post.insertMany(postsToCreate);

        res.json({ success: true, count: postsToCreate.length });

    } catch (e) {
        console.error('[AI Calendar] Confirm error:', e.message);
        res.status(500).json({ message: 'Bulk creation failed' });
    }
});

module.exports = router;
