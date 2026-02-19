'use client';
import { useState, useEffect, useRef } from 'react';
import { inboxAPI } from '@/lib/api';

const platformIcons = {
    instagram: '📸', facebook: '👤', twitter: '🐦', tiktok: '🎵', youtube: '▶️'
};

const statusColors = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
    archived: 'bg-yellow-100 text-yellow-700',
    snoozed: 'bg-blue-100 text-blue-600'
};

export default function InboxPage() {
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState({ status: 'open', platform: '' });
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ byStatus: [], byPlatform: [] });
    const messagesEndRef = useRef(null);

    useEffect(() => { loadConversations(); loadStats(); }, [filter]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const params = { ...filter };
            if (search) params.search = search;
            const res = await inboxAPI.list(params);
            setConversations(res.data.conversations || []);
        } catch (err) {
            console.error('Inbox load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await inboxAPI.stats();
            setStats(res.data);
        } catch (_) { }
    };

    const selectConversation = async (conv) => {
        setSelected(conv);
        setMsgLoading(true);
        try {
            const res = await inboxAPI.messages(conv._id);
            setMessages(res.data.messages || []);
            // Update unread
            conv.unreadCount = 0;
            setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            console.error('Messages load error:', err);
        } finally {
            setMsgLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selected) return;
        setSending(true);
        try {
            const res = await inboxAPI.reply(selected._id, replyText.trim());
            setMessages(prev => [...prev, res.data.message]);
            setReplyText('');
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            alert(err.response?.data?.message || 'Reply failed');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (convId, status) => {
        try {
            await inboxAPI.updateStatus(convId, status);
            if (selected?._id === convId) {
                setSelected(prev => ({ ...prev, status }));
            }
            loadConversations();
        } catch (err) {
            alert('Status update failed');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadConversations();
    };

    const totalUnread = stats.byStatus?.reduce((sum, s) => sum + (s.unread || 0), 0) || 0;

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        📥 Unified Inbox
                        {totalUnread > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{totalUnread}</span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-500">All conversations across platforms</p>
                </div>
                <div className="flex items-center gap-2">
                    {stats.byPlatform?.map(p => (
                        <span key={p._id} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            {platformIcons[p._id] || '💬'} {p.count} {p.unread > 0 && <span className="text-red-500">({p.unread})</span>}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar — Conversation List */}
                <div className="w-80 border-r bg-gray-50 flex flex-col">
                    {/* Filters */}
                    <div className="p-3 border-b space-y-2">
                        <form onSubmit={handleSearch} className="flex gap-1">
                            <input
                                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button type="submit" className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded-lg">🔍</button>
                        </form>
                        <div className="flex gap-1">
                            {['open', 'closed', 'all'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(prev => ({ ...prev, status: s }))}
                                    className={`px-2 py-1 text-xs rounded ${filter.status === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                            <select
                                value={filter.platform}
                                onChange={(e) => setFilter(prev => ({ ...prev, platform: e.target.value }))}
                                className="text-xs border rounded px-2 py-1 bg-white ml-auto"
                            >
                                <option value="">All Platforms</option>
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitter">Twitter</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <span className="text-4xl block mb-2">📭</span>
                                No conversations
                            </div>
                        ) : conversations.map(conv => (
                            <button
                                key={conv._id}
                                onClick={() => selectConversation(conv)}
                                className={`w-full text-left p-3 border-b hover:bg-white transition ${selected?._id === conv._id ? 'bg-white border-l-2 border-l-blue-500' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">{platformIcons[conv.platform] || '💬'}</span>
                                        <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                                            {conv.participantName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {conv.unreadCount > 0 && (
                                            <span className="w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(conv.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {conv.lastMessage?.direction === 'outbound' ? 'You: ' : ''}
                                    {conv.lastMessage?.text || 'No messages'}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[conv.status]}`}>{conv.status}</span>
                                    {conv.type && <span className="text-[10px] text-gray-400">{conv.type}</span>}
                                    {conv.sentiment?.label && (
                                        <span className="text-[10px] text-gray-400">
                                            {conv.sentiment.label === 'positive' ? '😊' : conv.sentiment.label === 'negative' ? '😞' : '😐'}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main — Message Thread */}
                <div className="flex-1 flex flex-col bg-white">
                    {!selected ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <span className="text-6xl block mb-3">💬</span>
                                <p className="text-lg">Select a conversation</p>
                                <p className="text-sm mt-1">Messages from all platforms appear here</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                        {selected.participantName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">{selected.participantName}</h3>
                                        <p className="text-xs text-gray-400">
                                            {platformIcons[selected.platform]} {selected.platform} · {selected.type}
                                            {selected.postTitle && ` · ${selected.postTitle}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selected.status}
                                        onChange={(e) => handleStatusChange(selected._id, e.target.value)}
                                        className="text-xs border rounded px-2 py-1 bg-white"
                                    >
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                        <option value="snoozed">Snoozed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {msgLoading ? (
                                    <div className="text-center py-8 text-gray-400">Loading messages...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">No messages yet</div>
                                ) : messages.map((msg, i) => (
                                    <div key={msg._id || i} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.direction === 'outbound'
                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}>
                                            {msg.direction === 'inbound' && (
                                                <p className="text-[10px] font-medium text-gray-500 mb-0.5">{msg.senderName}</p>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.isAutoReply && <span>🤖</span>}
                                                {msg.sentiment?.label && (
                                                    <span>{msg.sentiment.label === 'positive' ? '😊' : msg.sentiment.label === 'negative' ? '😞' : '😐'}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Box */}
                            <form onSubmit={handleReply} className="p-3 border-t bg-gray-50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 px-4 py-2.5 border rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !replyText.trim()}
                                        className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
                                    >
                                        {sending ? '...' : '➤ Send'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                                    Replies are saved locally. Platform API delivery coming soon.
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
