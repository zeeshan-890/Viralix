'use client';
import { useState, useEffect } from 'react';
import { teamAPI } from '@/lib/api';

export default function TeamManagement() {
    const [team, setTeam] = useState({ members: [], owner: null, teamId: null });
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [inviting, setInviting] = useState(false);
    const [activeTab, setActiveTab] = useState('members');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [teamRes, pendingRes] = await Promise.all([
                teamAPI.list(),
                teamAPI.pendingPosts()
            ]);
            setTeam(teamRes.data);
            setPending(pendingRes.data.posts || []);
        } catch (err) {
            console.error('Team load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await teamAPI.invite({ email: inviteEmail.trim(), role: inviteRole });
            setInviteEmail('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Invite failed');
        } finally {
            setInviting(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await teamAPI.updateRole(userId, newRole);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Role update failed');
        }
    };

    const handleRemove = async (userId, name) => {
        if (!confirm(`Remove ${name} from team?`)) return;
        try {
            await teamAPI.remove(userId);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Remove failed');
        }
    };

    const handleApprove = async (postId) => {
        try {
            await teamAPI.approvePost(postId, '');
            setPending(pending.filter(p => p._id !== postId));
        } catch (err) {
            alert(err.response?.data?.message || 'Approve failed');
        }
    };

    const handleReject = async (postId) => {
        const note = prompt('Rejection reason (optional):') || '';
        try {
            await teamAPI.rejectPost(postId, note);
            setPending(pending.filter(p => p._id !== postId));
        } catch (err) {
            alert(err.response?.data?.message || 'Reject failed');
        }
    };

    const roleColors = {
        user: 'bg-blue-100 text-blue-700',
        admin: 'bg-purple-100 text-purple-700',
        editor: 'bg-green-100 text-green-700',
        viewer: 'bg-gray-100 text-gray-600'
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    👥 Team & Approvals
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Manage team members and content approvals
                    {pending.length > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            {pending.length} pending
                        </span>
                    )}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b">
                {[
                    { id: 'members', label: `Team (${team.members.length})` },
                    { id: 'approvals', label: `Pending (${pending.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'members' && (
                <>
                    {/* Invite Form */}
                    <form onSubmit={handleInvite} className="flex items-end gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="teammate@company.com"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={inviting}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                        >
                            {inviting ? '...' : '+ Invite'}
                        </button>
                    </form>

                    {/* Members list */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading team...</div>
                    ) : team.members.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">🤝</span>
                            No team members yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {team.members.map(member => (
                                <div key={member._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {member.name}
                                                {member.isOwner && <span className="text-xs text-blue-500 ml-1">(Owner)</span>}
                                            </p>
                                            <p className="text-xs text-gray-400">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${roleColors[member.role] || roleColors.viewer}`}>
                                            {member.role}
                                        </span>
                                        {!member.isOwner && (
                                            <>
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member._id, e.target.value)}
                                                    className="text-xs border rounded px-2 py-1 bg-white"
                                                >
                                                    <option value="editor">Editor</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                                <button
                                                    onClick={() => handleRemove(member._id, member.name)}
                                                    className="text-red-400 hover:text-red-600 text-xs"
                                                >🗑️</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'approvals' && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pending.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">✅</span>
                            No posts pending approval
                        </div>
                    ) : pending.map(post => (
                        <div key={post._id} className="p-4 rounded-lg border border-orange-100 bg-orange-50/40">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{post.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{post.content}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>{post.user?.name || 'Unknown'}</span>
                                    <span>·</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span>·</span>
                                    <span>{post.platforms?.map(p => p.name).join(', ')}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(post._id)}
                                        className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(post._id)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
