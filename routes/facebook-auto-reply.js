const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const AutoReplyRule = require('../models/AutoReplyRule');
const User = require('../models/User');

const router = express.Router();
const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

// Get all auto-reply rules for user (Facebook only)
router.get('/rules', auth, async (req, res) => {
    try {
        const rules = await AutoReplyRule.find({ userId: req.user.id, platform: 'facebook' })
            .sort({ createdAt: -1 })
            .lean();
        res.json(rules);
    } catch (error) {
        console.error('[FB AutoReply] Get rules error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create auto-reply rule
router.post('/rules', auth, async (req, res) => {
    try {
        const {
            postId,
            accountId, // Page ID
            triggerType,
            keywords,
            targetAudience,
            replyContent,
            enabled
        } = req.body;

        if (!postId || !accountId) {
            return res.status(400).json({ message: 'Post ID and Account (Page) ID are required' });
        }
        if (!replyContent?.message) {
            return res.status(400).json({ message: 'Reply message is required' });
        }

        const existingRule = await AutoReplyRule.findOne({
            userId: req.user.id,
            postId
        });

        if (existingRule) {
            existingRule.platform = 'facebook';
            existingRule.triggerType = triggerType || 'keyword';
            existingRule.keywords = keywords || [];
            existingRule.targetAudience = targetAudience || 'anyone';
            existingRule.replyContent = replyContent;
            existingRule.enabled = enabled !== false;
            await existingRule.save();
            return res.json(existingRule);
        }

        const rule = new AutoReplyRule({
            userId: req.user.id,
            platform: 'facebook',
            postId,
            accountId,
            triggerType: triggerType || 'keyword',
            keywords: keywords || [],
            targetAudience: targetAudience || 'anyone',
            replyContent,
            enabled: enabled !== false
        });

        await rule.save();
        res.status(201).json(rule);
    } catch (error) {
        console.error('[FB AutoReply] Create rule error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Send Facebook Public Reply (Temporary Logic for Testing)
async function sendFacebookPrivateReply(pageId, commentId, content, accessToken) {
    try {
        const messagePayload = {
            message: content.message
        };

        if ((content.attachmentType === 'link' && content.linkUrl) || content.linkUrl) {
            messagePayload.message += `\n\n${content.linkUrl}`;
        }

        // --- TEMPORARY CHANGE: PUBLIC REPLY INSTEAD OF PRIVATE ---
        // '/private_replies' => '/comments'
        console.log('[FB AutoReply] Attempting PUBLIC reply to test permissions...');
        const response = await axios.post(
            `${FB_GRAPH_URL}/${commentId}/comments`, // Changed edge
            messagePayload,
            { params: { access_token: accessToken } }
        );
        // ---------------------------------------------------------

        console.log('[FB AutoReply] Public reply sent success:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('[FB AutoReply] Send error details:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

// Webhook verification
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === (process.env.FB_VERIFY_TOKEN || 'viralix_fb_token')) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Helper to find Page Access Token by Page ID
async function getPageAccessToken(pageId) {
    // Search for user who has this page in settings
    const user = await User.findOne({ 'settings.facebookPages.id': pageId });
    if (!user) return null;

    const page = user.settings.facebookPages.find(p => p.id === pageId);
    return page ? page.accessToken : null;
}

// Webhook handling
router.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        const tasks = [];

        for (const entry of body.entry) {
            const pageId = entry.id;
            for (const change of entry.changes || []) {
                if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                    // New comment on page post
                    const val = change.value;
                    // Fire and forget
                    tasks.push(processComment({
                        postId: val.post_id,
                        commentId: val.comment_id,
                        message: val.message,
                        fromId: val.from.id,
                        pageId: pageId
                    }));
                }
            }
        }

        Promise.all(tasks).catch(err => console.error('Background task error:', err));

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Process Comment logic
async function processComment(commentData) {
    const { postId, commentId, message, fromId, pageId } = commentData;
    console.log('[FB AutoReply] Processing comment:', { pageId, postId, commentId, fromId, message });

    try {
        // Find rule
        const rule = await AutoReplyRule.findOne({
            postId: postId,
            enabled: true,
            platform: 'facebook'
        });

        if (!rule) {
            console.log('[FB AutoReply] No rule found for post:', postId);
            return;
        }

        // Check already responded
        const alreadyResponded = rule.respondedUsers.some(u => u.igUserId === fromId);
        if (alreadyResponded) {
            console.log('[FB AutoReply] Already responded to user:', fromId);
            return;
        }

        // Keyword Match
        if (rule.triggerType === 'keyword' && rule.keywords.length > 0) {
            const lowerMsg = message.toLowerCase();
            const matched = rule.keywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
            if (!matched) {
                console.log('[FB AutoReply] Keyword not matched');
                return;
            }
        }

        // Get Token
        const token = await getPageAccessToken(pageId);
        if (!token) {
            console.error('[FB AutoReply] No token found for page', pageId);
            return;
        }
        console.log('[FB AutoReply] Found Page Token:', token.substring(0, 10) + '...');

        // Send Reply
        const result = await sendFacebookPrivateReply(pageId, commentId, rule.replyContent, token);

        if (result.success) {
            rule.stats.sent += 1;
            rule.respondedUsers.push({
                igUserId: fromId,
                respondedAt: new Date()
            });
        } else {
            rule.stats.failed += 1;
        }

        rule.stats.triggered += 1;
        await rule.save();

    } catch (e) {
        console.error('[FB AutoReply] Process error:', e);
    }
}

module.exports = router;
