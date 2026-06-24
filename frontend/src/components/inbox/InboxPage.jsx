'use client';
import notify from '@/lib/notify';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { inboxAPI, autoReplyAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import AiReplyPanel from './AiReplyPanel';
import {
    Inbox, Search, Loader2, Send, MessageSquare, MailOpen, Archive, Clock, Bot,
} from 'lucide-react';

const STATUS_STYLES = {
    open: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-[var(--viralix-inset)] text-[var(--viralix-muted)]',
    archived: 'bg-amber-100 text-amber-800',
    snoozed: 'bg-blue-100 text-blue-700',
};

function normalizeMessage(msg) {
    const outbound = msg.direction === 'outbound' || msg.sender === 'me';
    return {
        ...msg,
        direction: outbound ? 'outbound' : 'inbound',
        senderName: msg.senderName || (outbound ? 'You' : msg.sender || 'Contact'),
    };
}

function relativeTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function InboxPage() {
    const searchParams = useSearchParams();
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
    const [aiEnabled, setAiEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const openedConvRef = useRef(null);

    const loadConversations = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filter };
            if (search) params.search = search;
            const res = await inboxAPI.list(params);
            setConversations(res.data.conversations || []);
        } catch {
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    const loadStats = async () => {
        try {
            const res = await inboxAPI.stats();
            setStats(res.data);
        } catch { /* ignore */ }
    };

    useEffect(() => { loadConversations(); loadStats(); }, [loadConversations]);

    useEffect(() => {
        if (searchParams.get('conversation')) {
            setFilter((f) => (f.status === 'all' ? f : { ...f, status: 'all' }));
        }
    }, [searchParams]);

    const selectConversation = useCallback(async (conv) => {
        setSelected(conv);
        setMsgLoading(true);
        try {
            const res = await inboxAPI.messages(conv._id);
            setMessages((res.data.messages || []).map(normalizeMessage));
            setConversations((prev) => prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c)));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch {
            setMessages([]);
        } finally {
            setMsgLoading(false);
        }
    }, []);

    useEffect(() => {
        const convId = searchParams.get('conversation');
        if (!convId || loading || conversations.length === 0) return;
        if (openedConvRef.current === convId) return;
        const conv = conversations.find((c) => c._id === convId);
        if (conv) {
            openedConvRef.current = convId;
            selectConversation(conv);
        }
    }, [searchParams, conversations, loading, selectConversation]);

    useEffect(() => {
        autoReplyAPI.getSettings()
            .then((res) => setAiEnabled(res.data?.aiEnabled !== false))
            .catch(() => {});
    }, []);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selected) return;
        setSending(true);
        try {
            const res = await inboxAPI.reply(selected._id, replyText.trim());
            setMessages((prev) => [...prev, normalizeMessage(res.data.message)]);
            setReplyText('');
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            notify.error(err.response?.data?.message || 'Reply failed');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (convId, status) => {
        try {
            await inboxAPI.updateStatus(convId, status);
            if (selected?._id === convId) setSelected((prev) => ({ ...prev, status }));
            loadConversations();
            loadStats();
        } catch {
            notify.error('Status update failed');
        }
    };

    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
    const openCount = stats.byStatus?.find((s) => s.status === 'open')?.count
        ?? conversations.filter((c) => c.status === 'open').length;

    const platformStats = (stats.byPlatform || []).map((p) => ({
        key: p.platform || p._id,
        count: p.count || 0,
        unread: p.unread || 0,
    }));

    return (
        <div className="dash-card overflow-hidden rounded-2xl border border-[var(--viralix-border)]">
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-4 text-white sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <Inbox className="h-5 w-5 opacity-80" aria-hidden />
                            Inbox
                            {totalUnread > 0 && (
                                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">{totalUnread}</span>
                            )}
                        </h1>
                        <p className="mt-0.5 text-sm text-white/60">All conversations across connected platforms</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold tabular-nums leading-none">{openCount}</p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">Open</p>
                        </div>
                        {platformStats.map(({ key, count, unread }) => {
                            const cfg = PLATFORM_CONFIG[key];
                            const Icon = cfg?.icon;
                            return (
                                <div key={key} className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {Icon && <Icon className="h-3 w-3 opacity-70" aria-hidden />}
                                        <p className="text-lg font-bold tabular-nums leading-none">{count}</p>
                                        {unread > 0 && <span className="text-xs text-red-300">({unread})</span>}
                                    </div>
                                    <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70 capitalize">{key}</p>
                                </div>
                            );
                        })}
                        <Link
                            href="/dashboard/inbox/auto-reply"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#84A98C]/30 px-3 py-2 text-xs font-medium text-white hover:bg-[#84A98C]/40"
                        >
                            <Bot className="h-3.5 w-3.5" />
                            Auto-Reply
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[560px] h-[calc(100vh-11rem)] flex-col lg:flex-row">
                {/* Conversation list */}
                <div className="flex w-full shrink-0 flex-col border-b border-[var(--viralix-border)] lg:w-80 lg:border-b-0 lg:border-r">
                    <div className="space-y-2 border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-3">
                        <form onSubmit={(e) => { e.preventDefault(); loadConversations(); }} className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search conversations…"
                                className="w-full rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] py-2 pl-9 pr-3 text-sm text-[var(--viralix-accent)] placeholder:text-[#94A3B8] focus:border-[#84A98C] focus:outline-none"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-1">
                            {[
                                { id: 'open', label: 'Open', icon: MailOpen },
                                { id: 'closed', label: 'Closed', icon: Archive },
                                { id: 'all', label: 'All', icon: MessageSquare },
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setFilter((prev) => ({ ...prev, status: id }))}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                                        filter.status === id
                                            ? 'bg-[#354F52] text-white'
                                            : 'bg-white text-[var(--viralix-muted)] ring-1 ring-[var(--viralix-border)] hover:text-[var(--viralix-accent)]'
                                    )}
                                >
                                    <Icon className="h-3 w-3" />
                                    {label}
                                </button>
                            ))}
                            <select
                                value={filter.platform}
                                onChange={(e) => setFilter((prev) => ({ ...prev, platform: e.target.value }))}
                                className="ml-auto rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-2 py-1.5 text-xs text-[var(--viralix-muted)] focus:border-[#84A98C] focus:outline-none"
                            >
                                <option value="">All platforms</option>
                                {Object.keys(PLATFORM_CONFIG).map((p) => (
                                    <option key={p} value={p}>{PLATFORM_CONFIG[p].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--viralix-muted)]">
                                <Loader2 className="h-5 w-5 animate-spin text-[#84A98C]" />
                                Loading…
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="py-16 text-center">
                                <MessageSquare className="mx-auto h-10 w-10 text-[var(--viralix-border)]" />
                                <p className="mt-3 text-sm font-medium text-[var(--viralix-accent)]">No conversations</p>
                                <p className="mt-1 text-xs text-[var(--viralix-muted)]">Try changing filters or search</p>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const cfg = PLATFORM_CONFIG[conv.platform];
                                const Icon = cfg?.icon;
                                const isActive = selected?._id === conv._id;
                                return (
                                    <button
                                        key={conv._id}
                                        type="button"
                                        onClick={() => selectConversation(conv)}
                                        className={cn(
                                            'w-full border-b border-[var(--viralix-border)] px-4 py-3 text-left transition hover:bg-[var(--viralix-bg)]',
                                            isActive && 'border-l-2 border-l-[#84A98C] bg-[var(--viralix-inset)]'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {cfg && Icon && (
                                                    <span
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                        style={{ backgroundColor: cfg.bg }}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} aria-hidden />
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-[var(--viralix-accent)]">{conv.participantName}</p>
                                                    <p className="truncate text-xs text-[var(--viralix-muted)]">
                                                        {conv.lastMessage?.direction === 'outbound' ? 'You: ' : ''}
                                                        {conv.lastMessage?.text || 'No messages'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span className="flex items-center gap-0.5 text-[0.625rem] text-[#94A3B8]">
                                                    <Clock className="h-3 w-3" />
                                                    {relativeTime(conv.updatedAt)}
                                                </span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#52796F] px-1 text-[0.625rem] font-bold text-white">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                            <span className={cn('rounded px-1.5 py-0.5 text-[0.625rem] font-medium capitalize', STATUS_STYLES[conv.status] || STATUS_STYLES.closed)}>
                                                {conv.status}
                                            </span>
                                            {conv.type && <span className="text-[0.625rem] text-[#94A3B8]">{conv.type}</span>}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Thread */}
                <div className="flex min-h-0 flex-1 flex-col">
                    {!selected ? (
                        <div className="flex flex-1 flex-col items-center justify-center text-[var(--viralix-muted)]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--viralix-inset)]">
                                <MessageSquare className="h-8 w-8 text-[#84A98C]" />
                            </div>
                            <p className="mt-4 text-base font-medium text-[var(--viralix-accent)]">Select a conversation</p>
                            <p className="mt-1 text-sm">Messages from all platforms appear here</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-4 py-3 sm:px-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#52796F] to-[#354F52] text-sm font-bold text-white">
                                        {selected.participantName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--viralix-accent)]">{selected.participantName}</h3>
                                        <p className="text-xs capitalize text-[var(--viralix-muted)]">
                                            {PLATFORM_CONFIG[selected.platform]?.label || selected.platform}
                                            {selected.type && ` · ${selected.type}`}
                                        </p>
                                    </div>
                                </div>
                                <select
                                    value={selected.status}
                                    onChange={(e) => handleStatusChange(selected._id, e.target.value)}
                                    className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-2 py-1.5 text-xs text-[var(--viralix-muted)] focus:border-[#84A98C] focus:outline-none"
                                >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                    <option value="snoozed">Snoozed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-[var(--viralix-bg)] p-4 sm:p-5">
                                {msgLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--viralix-muted)]">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Loading messages…
                                    </div>
                                ) : messages.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-[var(--viralix-muted)]">No messages yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((msg, i) => (
                                            <div key={msg._id || i} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                                                <div
                                                    className={cn(
                                                        'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                                                        msg.direction === 'outbound'
                                                            ? 'rounded-br-md bg-[#354F52] text-white'
                                                            : 'rounded-bl-md border border-[var(--viralix-border)] bg-[var(--viralix-surface)] text-[var(--viralix-accent)]'
                                                    )}
                                                >
                                                    {msg.direction === 'inbound' && (
                                                        <p className="mb-0.5 text-[0.625rem] font-semibold text-[var(--viralix-muted)]">{msg.senderName}</p>
                                                    )}
                                                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                                    <p className={cn('mt-1 text-[0.625rem]', msg.direction === 'outbound' ? 'text-white/50' : 'text-[#94A3B8]')}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {msg.isAutoReply && ' · Auto-reply'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <AiReplyPanel
                                conversationId={selected._id}
                                aiEnabled={aiEnabled}
                                onInsert={(text) => setReplyText(text)}
                            />

                            <form onSubmit={handleReply} className="border-t border-[var(--viralix-border)] bg-[var(--viralix-surface)] p-3 sm:p-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply…"
                                        disabled={sending}
                                        className="flex-1 rounded-xl border border-[var(--viralix-border)] px-4 py-2.5 text-sm text-[var(--viralix-accent)] placeholder:text-[#94A3B8] focus:border-[#84A98C] focus:outline-none disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !replyText.trim()}
                                        className="btn btn-confirm disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Send
                                    </button>
                                </div>
                                <p className="mt-2 text-center text-[0.625rem] text-[#94A3B8]">
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
