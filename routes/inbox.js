const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const router = express.Router();
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Escape special regex characters to prevent ReDoS
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/inbox — list conversations with filters
router.get('/', auth, async (req, res) => {
    try {
        const {
            status = 'open',
            platform,
            label,
            search,
            page = 1,
            limit = 30
        } = req.query;

        const filter = { userId: req.user.id };
        if (status && status !== 'all') filter.status = status;
        if (platform) filter.platform = platform;
        if (label) filter.labels = label;
        if (search) {
            const safe = escapeRegex(search);
            filter.$or = [
                { participantName: { $regex: safe, $options: 'i' } },
                { 'lastMessage.text': { $regex: safe, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [conversations, total] = await Promise.all([
            Conversation.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Conversation.countDocuments(filter)
        ]);

        const unreadTotal = await Conversation.aggregate([
            { $match: { userId: toObjectId(req.user.id), status: 'open' } },
            { $group: { _id: null, total: { $sum: '$unreadCount' } } }
        ]);

        res.json({
            conversations,
            total,
            unreadTotal: unreadTotal[0]?.total || 0,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (e) {
        console.error('[Inbox] List error:', e.message);
        res.status(500).json({ message: 'Failed to load inbox' });
    }
});

// GET /api/inbox/stats — quick unread counts
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Conversation.aggregate([
            { $match: { userId: toObjectId(req.user.id) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    unread: { $sum: '$unreadCount' }
                }
            }
        ]);

        const platforms = await Conversation.aggregate([
            { $match: { userId: toObjectId(req.user.id), status: 'open' } },
            {
                $group: {
                    _id: '$platform',
                    count: { $sum: 1 },
                    unread: { $sum: '$unreadCount' }
                }
            }
        ]);

        res.json({ byStatus: stats, byPlatform: platforms });
    } catch (e) {
        res.status(500).json({ message: 'Stats failed' });
    }
});

// GET /api/inbox/:conversationId/messages — get messages in a conversation
router.get('/:conversationId/messages', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            userId: req.user.id
        });
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Mark as read
        if (conversation.unreadCount > 0) {
            conversation.unreadCount = 0;
            await conversation.save();
        }
        await Message.updateMany(
            { conversationId: conversation._id, direction: 'inbound', readAt: null },
            { readAt: new Date() }
        );

        res.json({
            messages: messages.reverse(), // Oldest first for display
            conversation
        });
    } catch (e) {
        console.error('[Inbox] Messages error:', e.message);
        res.status(500).json({ message: 'Failed to load messages' });
    }
});

// POST /api/inbox/:conversationId/reply — send a reply
router.post('/:conversationId/reply', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            userId: req.user.id
        });
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Reply text is required' });

        // Save the outbound message
        const message = new Message({
            conversationId: conversation._id,
            direction: 'outbound',
            text: text.trim(),
            senderName: 'You',
            senderId: req.user.id
        });
        await message.save();

        // Update conversation last message
        conversation.lastMessage = {
            text: text.trim().substring(0, 200),
            direction: 'outbound',
            timestamp: new Date()
        };
        await conversation.save();

        // TODO: Actually send via platform API (IG Graph API, FB Graph API)
        // This would call the platform-specific API to post the reply/DM
        // For now, the message is stored and marked as outbound

        // Emit via Socket.io if available
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${req.user.id}`).emit('inbox:message', {
                conversationId: conversation._id,
                message
            });
        }

        res.json({ message, conversation });
    } catch (e) {
        console.error('[Inbox] Reply error:', e.message);
        res.status(500).json({ message: 'Reply failed' });
    }
});

// PATCH /api/inbox/:conversationId/status — update conversation status
router.patch('/:conversationId/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ['open', 'closed', 'archived', 'snoozed'];
        if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.conversationId, userId: req.user.id },
            { status },
            { new: true }
        );
        if (!conversation) return res.status(404).json({ message: 'Not found' });
        res.json(conversation);
    } catch (e) {
        res.status(500).json({ message: 'Update failed' });
    }
});

// PATCH /api/inbox/:conversationId/labels — update labels
router.patch('/:conversationId/labels', auth, async (req, res) => {
    try {
        const { labels } = req.body;
        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.conversationId, userId: req.user.id },
            { labels: labels || [] },
            { new: true }
        );
        if (!conversation) return res.status(404).json({ message: 'Not found' });
        res.json(conversation);
    } catch (e) {
        res.status(500).json({ message: 'Label update failed' });
    }
});

// PATCH /api/inbox/:conversationId/assign — assign to team member
router.patch('/:conversationId/assign', auth, async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.conversationId, userId: req.user.id },
            { assignedTo: assignedTo || null },
            { new: true }
        );
        if (!conversation) return res.status(404).json({ message: 'Not found' });
        res.json(conversation);
    } catch (e) {
        res.status(500).json({ message: 'Assign failed' });
    }
});

/**
 * Utility: Upsert an inbound message into the inbox system.
 * Called from webhook handlers to unify all platform conversations.
 */
async function ingestInboundMessage({
    userId, platform, participantId, participantName,
    type = 'comment', text, externalId,
    postId, postTitle, sentiment, attachments
}) {
    if (!userId || !text) return null;

    try {
        // Find or create conversation
        let conversation = await Conversation.findOne({
            userId, platform, participantId
        });

        if (!conversation) {
            conversation = new Conversation({
                userId, platform, participantId,
                participantName: participantName || 'Unknown',
                type,
                postId,
                postTitle
            });
        }

        // Save conversation first so it has an _id for the message reference
        await conversation.save();

        // Create message
        const message = new Message({
            conversationId: conversation._id,
            direction: 'inbound',
            text,
            externalId,
            senderName: participantName || 'Unknown',
            senderId: participantId,
            sentiment,
            attachments: attachments || []
        });
        await message.save();

        // Update conversation
        conversation.lastMessage = {
            text: text.substring(0, 200),
            direction: 'inbound',
            timestamp: new Date()
        };
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        if (sentiment) conversation.sentiment = sentiment;
        conversation.status = 'open';
        await conversation.save();

        return { conversation, message };
    } catch (e) {
        console.error('[Inbox] Ingest error:', e.message);
        return null;
    }
}

router.ingestInboundMessage = ingestInboundMessage;
module.exports = router;
