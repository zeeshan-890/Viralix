const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/team — list team members
router.get('/', auth, async (req, res) => {
    try {
        const teamId = req.user.teamId || req.user.id;
        const members = await User.find({
            $or: [
                { _id: teamId },              // owner
                { teamId: teamId }             // members
            ]
        })
            .select('name email role avatar teamId createdAt lastLogin')
            .sort({ role: 1 })
            .lean();

        const owner = members.find(m => m._id.toString() === teamId.toString());

        res.json({
            teamId,
            owner: owner ? { _id: owner._id, name: owner.name, email: owner.email } : null,
            members: members.map(m => ({
                _id: m._id,
                name: m.name,
                email: m.email,
                role: m.role,
                avatar: m.avatar,
                isOwner: m._id.toString() === teamId.toString(),
                joinedAt: m.createdAt
            }))
        });
    } catch (e) {
        console.error('[Team] List error:', e.message);
        res.status(500).json({ message: 'Failed to load team' });
    }
});

// POST /api/team/invite — invite user to team by email
router.post('/invite', auth, async (req, res) => {
    try {
        // Only owners/admins can invite
        if (req.user.role !== 'admin' && req.user.role !== 'user') {
            return res.status(403).json({ message: 'Only team owners can invite members' });
        }

        const { email, role = 'editor' } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const validRoles = ['editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Role must be: ${validRoles.join(', ')}` });
        }

        const invitee = await User.findOne({ email: email.toLowerCase() });
        if (!invitee) return res.status(404).json({ message: 'No user found with that email' });

        if (invitee._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot invite yourself' });
        }

        if (invitee.teamId) {
            return res.status(409).json({ message: 'User is already on a team' });
        }

        // Set teamId to the inviter (team owner)
        const teamId = req.user.teamId || req.user.id;
        invitee.teamId = teamId;
        invitee.role = role;
        await invitee.save();

        res.json({
            message: `${invitee.name} added as ${role}`,
            member: {
                _id: invitee._id,
                name: invitee.name,
                email: invitee.email,
                role: invitee.role
            }
        });
    } catch (e) {
        console.error('[Team] Invite error:', e.message);
        res.status(500).json({ message: 'Invite failed' });
    }
});

// PATCH /api/team/:userId/role — update member role
router.patch('/:userId/role', auth, async (req, res) => {
    try {
        const teamId = req.user.teamId || req.user.id;
        if (teamId.toString() !== (req.user.teamId || req.user.id).toString() &&
            req.user.role !== 'admin' && req.user.role !== 'user') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { role } = req.body;
        const validRoles = ['editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Role must be: ${validRoles.join(', ')}` });
        }

        const member = await User.findOne({ _id: req.params.userId, teamId });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        member.role = role;
        await member.save();
        res.json({ message: 'Role updated', role });
    } catch (e) {
        res.status(500).json({ message: 'Update failed' });
    }
});

// DELETE /api/team/:userId — remove member from team
router.delete('/:userId', auth, async (req, res) => {
    try {
        const teamId = req.user.teamId || req.user.id;
        const member = await User.findOne({ _id: req.params.userId, teamId });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Cannot remove self (owner)
        if (member._id.toString() === teamId.toString()) {
            return res.status(400).json({ message: 'Cannot remove team owner' });
        }

        member.teamId = null;
        member.role = 'user';
        await member.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Remove failed' });
    }
});

// POST /api/team/posts/:id/submit — submit post for approval (editor action)
router.post('/posts/:id/submit', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Check ownership or team membership
        const teamId = req.user.teamId || req.user.id;
        if (post.user.toString() !== req.user.id && post.user.toString() !== teamId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        post.approvalStatus = 'pending';
        post.approvalNote = req.body.note || '';
        await post.save();

        res.json({ message: 'Post submitted for approval', status: post.approvalStatus });
    } catch (e) {
        res.status(500).json({ message: 'Submit failed' });
    }
});

// POST /api/team/posts/:id/approve — approve a post (owner/admin action)
router.post('/posts/:id/approve', auth, async (req, res) => {
    try {
        // Only owners can approve
        if (req.user.role === 'viewer' || req.user.role === 'editor') {
            return res.status(403).json({ message: 'Only admins/owners can approve posts' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.approvalStatus = 'approved';
        post.approvedBy = req.user.id;
        post.approvedAt = new Date();
        post.approvalNote = req.body.note || '';
        await post.save();

        res.json({ message: 'Post approved', status: post.approvalStatus });
    } catch (e) {
        res.status(500).json({ message: 'Approve failed' });
    }
});

// POST /api/team/posts/:id/reject — reject a post
router.post('/posts/:id/reject', auth, async (req, res) => {
    try {
        if (req.user.role === 'viewer' || req.user.role === 'editor') {
            return res.status(403).json({ message: 'Only admins/owners can reject posts' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.approvalStatus = 'rejected';
        post.approvedBy = req.user.id;
        post.approvedAt = new Date();
        post.approvalNote = req.body.note || 'Rejected';
        await post.save();

        res.json({ message: 'Post rejected', status: post.approvalStatus });
    } catch (e) {
        res.status(500).json({ message: 'Reject failed' });
    }
});

// GET /api/team/posts/pending — list pending approval posts for the team
router.get('/posts/pending', auth, async (req, res) => {
    try {
        const teamId = req.user.teamId || req.user.id;
        const teamMembers = await User.find({
            $or: [{ _id: teamId }, { teamId }]
        }).select('_id');
        const memberIds = teamMembers.map(m => m._id);

        const posts = await Post.find({
            user: { $in: memberIds },
            approvalStatus: 'pending'
        })
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ posts });
    } catch (e) {
        res.status(500).json({ message: 'Failed to load pending posts' });
    }
});

module.exports = router;
