const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const AutoReplyRule = require('../models/AutoReplyRule');
const AccountService = require('../services/account.service');

const router = express.Router();
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// Get all auto-reply rules for user
router.get('/rules', auth, async (req, res) => {
    try {
        const rules = await AutoReplyRule.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        res.json(rules);
    } catch (error) {
        console.error('[AutoReply] Get rules error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get rules for a specific post
router.get('/rules/post/:postId', auth, async (req, res) => {
    try {
        const rule = await AutoReplyRule.findOne({
            userId: req.user.id,
            postId: req.params.postId
        }).lean();
        res.json(rule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create auto-reply rule
router.post('/rules', auth, async (req, res) => {
    try {
        const {
            postId,
            accountId,
            triggerType,
            keywords,
            targetAudience,
            replyContent,
            enabled
        } = req.body;

        // Validate required fields
        if (!postId || !accountId) {
            return res.status(400).json({ message: 'Post ID and Account ID are required' });
        }
        if (!replyContent?.message) {
            return res.status(400).json({ message: 'Reply message is required' });
        }

        // Check if rule already exists for this post
        const existingRule = await AutoReplyRule.findOne({
            userId: req.user.id,
            postId
        });

        if (existingRule) {
            // Update existing rule
            existingRule.triggerType = triggerType || 'keyword';
            existingRule.keywords = keywords || [];
            existingRule.targetAudience = targetAudience || 'anyone';
            existingRule.replyContent = replyContent;
            existingRule.enabled = enabled !== false;
            await existingRule.save();
            return res.json(existingRule);
        }

        // Create new rule
        const rule = new AutoReplyRule({
            userId: req.user.id,
            platform: 'instagram',
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
        console.error('[AutoReply] Create rule error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update auto-reply rule
router.put('/rules/:ruleId', auth, async (req, res) => {
    try {
        const rule = await AutoReplyRule.findOneAndUpdate(
            { _id: req.params.ruleId, userId: req.user.id },
            { $set: req.body },
            { new: true }
        );

        if (!rule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        res.json(rule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete auto-reply rule
router.delete('/rules/:ruleId', auth, async (req, res) => {
    try {
        const rule = await AutoReplyRule.findOneAndDelete({
            _id: req.params.ruleId,
            userId: req.user.id
        });

        if (!rule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Toggle rule enabled/disabled
router.patch('/rules/:ruleId/toggle', auth, async (req, res) => {
    try {
        const rule = await AutoReplyRule.findOne({
            _id: req.params.ruleId,
            userId: req.user.id
        });

        if (!rule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        rule.enabled = !rule.enabled;
        await rule.save();
        res.json(rule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Process comment and send DM if matching rule exists
async function processComment(commentData, accessToken) {
    const { mediaId, commentId, commentText, commenterId, commenterUsername } = commentData;

    try {
        // Find matching rule for this post
        const rule = await AutoReplyRule.findOne({
            postId: mediaId,
            enabled: true
        });

        if (!rule) {
            console.log(`[AutoReply] No rule found for post ${mediaId}`);
            return null;
        }

        // Check if user already received DM
        const alreadyResponded = rule.respondedUsers.some(u => u.igUserId === commenterId);
        if (alreadyResponded) {
            console.log(`[AutoReply] User ${commenterId} already received DM`);
            return null;
        }

        // Check keyword trigger
        if (rule.triggerType === 'keyword' && rule.keywords.length > 0) {
            const commentLower = commentText.toLowerCase();
            const matched = rule.keywords.some(kw => commentLower.includes(kw.toLowerCase()));
            if (!matched) {
                console.log(`[AutoReply] No keyword match for "${commentText}"`);
                return null;
            }
        }

        // Update stats
        rule.stats.triggered += 1;

        // TODO: Check if commenter is a follower (requires additional API call)
        // For now, we'll skip this check if targetAudience is 'followers'

        // Send DM
        try {
            // Instagram DM requires instagram_manage_messages permission
            const dmResult = await sendInstagramDM(
                rule.accountId,
                commenterId,
                rule.replyContent,
                accessToken
            );

            if (dmResult.success) {
                rule.stats.sent += 1;
                rule.respondedUsers.push({
                    igUserId: commenterId,
                    respondedAt: new Date()
                });
            } else {
                rule.stats.failed += 1;
            }
        } catch (dmError) {
            console.error('[AutoReply] DM send error:', dmError.message);
            rule.stats.failed += 1;
        }

        await rule.save();
        return rule;
    } catch (error) {
        console.error('[AutoReply] Process comment error:', error);
        return null;
    }
}

// Send Instagram DM
async function sendInstagramDM(igAccountId, recipientId, content, accessToken) {
    try {
        // Instagram Messaging API
        const messagePayload = {
            recipient: { id: recipientId },
            message: { text: content.message }
        };

        // Add attachment if present
        if (content.attachmentType === 'image' && content.attachmentUrl) {
            messagePayload.message.attachment = {
                type: 'image',
                payload: { url: content.attachmentUrl }
            };
        } else if (content.attachmentType === 'link' && content.linkUrl) {
            messagePayload.message.text += `\n\n${content.linkUrl}`;
        }

        const response = await axios.post(
            `${INSTAGRAM_GRAPH_URL}/${igAccountId}/messages`,
            messagePayload,
            { params: { access_token: accessToken } }
        );

        console.log('[AutoReply] DM sent successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('[AutoReply] DM error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

// Webhook endpoint for Instagram comments (to be called by Facebook webhook)
router.post('/webhook', async (req, res) => {
    const { object, entry } = req.body;

    // Verify it's an Instagram webhook
    if (object !== 'instagram') {
        return res.sendStatus(404);
    }

    // Process each entry
    for (const e of entry || []) {
        for (const change of e.changes || []) {
            if (change.field === 'comments') {
                const { media_id, id, text, from } = change.value;

                // Get access token for this account
                try {
                    const accounts = await AccountService.getAccountsByPlatformId(from.id);
                    if (accounts && accounts[0]) {
                        await processComment({
                            mediaId: media_id,
                            commentId: id,
                            commentText: text,
                            commenterId: from.id,
                            commenterUsername: from.username
                        }, accounts[0].accessToken);
                    }
                } catch (error) {
                    console.error('[AutoReply Webhook] Error:', error);
                }
            }
        }
    }

    res.sendStatus(200);
});

// Export for testing
router.processComment = processComment;
router.sendInstagramDM = sendInstagramDM;

module.exports = router;
