'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Plus,
    Search,
    RefreshCw,
    Loader2,
    Upload,
    Calendar,
    BarChart3,
    Link2,
    MessageSquare,
    Bot,
    ArrowUpRight,
} from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { getPostStatus } from './postUtils';
import PostTableRow, { PostMobileCard } from './PostTableRow';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'published', label: 'Published' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'draft', label: 'Drafts' },
    { id: 'failed', label: 'Failed' },
];

export default function PostsListPage() {
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { accounts } = useAccounts();

    useEffect(() => {
        const status = searchParams.get('status');
        if (status && FILTERS.some((f) => f.id === status)) {
            setStatusFilter(status);
        }
    }, [searchParams]);

    const loadPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await postsAPI.getAllPosts({ limit: 100 });
            setPosts(response.data?.posts || []);
        } catch (err) {
            setError('Failed to load posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const status = getPostStatus(post);
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                post.title?.toLowerCase().includes(q) ||
                post.content?.toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [posts, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const counts = { total: posts.length, published: 0, scheduled: 0, draft: 0, failed: 0 };
        posts.forEach((p) => {
            const s = getPostStatus(p);
            if (counts[s] !== undefined) counts[s]++;
        });
        return counts;
    }, [posts]);

    const connectedPlatforms = useMemo(() => {
        const set = new Set(accounts.map((a) => a.platform));
        return Object.keys(PLATFORM_CONFIG).map((id) => ({
            id,
            ...PLATFORM_CONFIG[id],
            connected: set.has(id),
        }));
    }, [accounts]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
                <p className="text-sm text-[#52796F]">Loading posts…</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#B8C9C0] bg-white shadow-[0_8px_30px_rgba(47,62,70,0.08)]">
            {/* Hero header */}
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-5 text-white sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Posts</h1>
                        <p className="mt-0.5 text-sm text-white/70">Manage content across all platforms</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { label: 'Total', value: stats.total },
                            { label: 'Published', value: stats.published, cls: 'bg-emerald-500/20 text-emerald-100' },
                            { label: 'Scheduled', value: stats.scheduled, cls: 'bg-amber-500/20 text-amber-100' },
                            { label: 'Drafts', value: stats.draft, cls: 'bg-white/15 text-white/90' },
                        ].map(({ label, value, cls }) => (
                            <div
                                key={label}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-center',
                                    cls || 'bg-white/10'
                                )}
                            >
                                <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
                                <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-80">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={loadPosts}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </button>
                        <Link
                            href="/dashboard/upload"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#84A98C] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/20 hover:bg-[#95b89c]"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Post
                        </Link>
                    </div>
                </div>
            </div>

            {error && (
                <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">{error}</div>
            )}

            <div className="grid lg:grid-cols-[1fr_240px]">
                {/* Main table area */}
                <div className="min-w-0 border-r border-[#E8EDEA]">
                    {/* Toolbar strip */}
                    <div className="flex flex-col gap-3 border-b border-[#E8EDEA] bg-[#F4F8F6] px-4 py-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52796F]/50" aria-hidden />
                            <input
                                type="search"
                                placeholder="Search by title or caption…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 w-full rounded-lg border-0 bg-white pl-10 pr-3 text-sm text-[#354F52] shadow-sm ring-1 ring-[#D5DFD9] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#84A98C]"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {FILTERS.map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setStatusFilter(id)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                                        statusFilter === id
                                            ? 'bg-[#354F52] text-white shadow-sm'
                                            : 'bg-white text-[#52796F] ring-1 ring-[#D5DFD9] hover:ring-[#84A98C]'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredPosts.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <p className="text-sm font-medium text-[#354F52]">No posts found</p>
                            <p className="mt-1 text-xs text-[#52796F]">Adjust filters or create a new post</p>
                            <Link
                                href="/dashboard/upload"
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#84A98C] px-4 py-2 text-xs font-semibold text-white"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Post
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Mobile list */}
                            <div className="sm:hidden">
                                {filteredPosts.map((post) => (
                                    <PostMobileCard key={post._id} post={post} />
                                ))}
                            </div>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full min-w-[640px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-[#E8EDEA] bg-white text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">
                                            <th className="px-4 py-3 font-semibold">Post</th>
                                            <th className="hidden px-4 py-3 font-semibold sm:table-cell">Status</th>
                                            <th className="hidden px-4 py-3 font-semibold md:table-cell">Platforms</th>
                                            <th className="hidden px-4 py-3 font-semibold lg:table-cell">Date</th>
                                            <th className="hidden px-4 py-3 font-semibold xl:table-cell">Engagement</th>
                                            <th className="px-4 py-3 text-right font-semibold" aria-label="Actions" />
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {filteredPosts.map((post) => (
                                            <PostTableRow key={post._id} post={post} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar rail — no cards, just sections */}
                <aside className="hidden bg-[#FAFCFB] p-4 lg:block">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">
                        Quick links
                    </p>
                    <nav className="mt-3 space-y-1">
                        {[
                            { href: '/dashboard/upload', label: 'Upload media', icon: Upload },
                            { href: '/dashboard/schedule', label: 'Content calendar', icon: Calendar },
                            { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
                            { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
                            { href: '/dashboard/inbox/auto-reply', label: 'Auto-reply', icon: Bot },
                        ].map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-[#354F52] transition-colors hover:bg-white hover:shadow-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-[#84A98C]" aria-hidden />
                                    {label}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-[#CAD2C5] group-hover:text-[#52796F]" aria-hidden />
                            </Link>
                        ))}
                    </nav>

                    <div className="my-5 h-px bg-[#E8EDEA]" />

                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">
                        Platforms
                    </p>
                    <ul className="mt-3 space-y-2">
                        {connectedPlatforms.map(({ id, label, icon: Icon, bg, color, connected }) => (
                            <li key={id} className="flex items-center justify-between py-1">
                                <span className="flex items-center gap-2 text-sm text-[#354F52]">
                                    <span
                                        className="flex h-6 w-6 items-center justify-center rounded-md"
                                        style={{ backgroundColor: bg }}
                                    >
                                        <Icon className="h-3 w-3" style={{ color }} aria-hidden />
                                    </span>
                                    {label}
                                </span>
                                <span
                                    className={cn(
                                        'text-[0.625rem] font-medium uppercase',
                                        connected ? 'text-emerald-600' : 'text-[#CAD2C5]'
                                    )}
                                >
                                    {connected ? 'Live' : 'Off'}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/dashboard/connect-accounts"
                        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#52796F] hover:text-[#354F52]"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        Manage connections
                    </Link>
                </aside>
            </div>
        </div>
    );
}
