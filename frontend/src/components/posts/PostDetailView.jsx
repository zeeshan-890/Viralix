'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { postsAPI, analyticsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import PlatformTabs from '../../../app/dashboard/preview/[contentId]/components/PlatformTabs';
import ScheduleModal from '../../../app/dashboard/preview/[contentId]/components/ScheduleModal';
import PostEditorSidebar from './PostEditorSidebar';
import {
    ArrowLeft,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    RefreshCw,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { statusBadge } from '@/components/calendar/calendarTheme';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import { getPostStatus, STATUS_LABELS } from './postUtils';

function PanelLabel({ children }) {
    return (
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">{children}</p>
    );
}

export default function PostDetailView({ contentId }) {
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

    useEffect(() => {
        if (!contentId) return;
        loadPost();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentId]);

    useEffect(() => {
        const isProcessing = post?.platforms?.some((p) => p.status === 'processing');
        if (isProcessing) {
            const interval = setInterval(loadPost, 3000);
            return () => clearInterval(interval);
        }
    }, [post]);

    const loadPost = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await postsAPI.getPost(contentId);
            setPost(response.data);
        } catch (err) {
            setError('Failed to load post');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updatePost = async (updates) => {
        if (!post) return;
        setSaving(true);
        try {
            const response = await postsAPI.updatePost(post._id, updates);
            setPost(response.data);
        } catch (err) {
            console.error('Failed to update post:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmSchedule = async (date, time) => {
        if (!post) return;
        setSaving(true);
        try {
            const scheduledDate = new Date(`${date}T${time}:00`).toISOString();
            await postsAPI.updatePost(post._id, {
                isScheduled: true,
                scheduledDate,
                scheduleType: 'later',
            });
            setScheduleModalOpen(false);
            router.push('/dashboard/schedule');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to schedule post');
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        if (!post) return;
        setSaving(true);
        try {
            await postsAPI.updatePost(post._id, { status: 'draft' });
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const publishNow = async () => {
        if (!post) return;
        setPublishing(true);
        setError('');
        try {
            await postsAPI.publishNow(post._id);
            await loadPost();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to publish');
        } finally {
            setPublishing(false);
        }
    };

    const refreshMetrics = async () => {
        setRefreshing(true);
        try {
            await analyticsAPI.refresh();
            await loadPost();
        } catch {
            /* non-blocking */
        } finally {
            setRefreshing(false);
        }
    };

    const deletePost = async () => {
        if (!post) return;
        if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await postsAPI.remove(post._id);
            router.push('/dashboard/preview');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete post');
            setDeleting(false);
        }
    };

    const platforms = post?.platforms || [];
    const publishedPlatforms = useMemo(() => platforms.filter((p) => p.status === 'published'), [platforms]);
    const remainingPlatforms = useMemo(() => platforms.filter((p) => p.status !== 'published'), [platforms]);
    const allPublished = publishedPlatforms.length > 0 && remainingPlatforms.length === 0;
    const status = post ? getPostStatus(post) : 'draft';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
                <p className="text-sm text-[#52796F]">Loading post…</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error || 'Post not found'}
                </div>
                <button
                    type="button"
                    onClick={() => router.push('/dashboard/preview')}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#C8D4CE] px-4 py-2 text-sm text-[#354F52] hover:bg-[#EEF3F0]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to posts
                </button>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#B8C9C0] bg-white shadow-[0_8px_30px_rgba(47,62,70,0.08)]">
            {/* Hero header */}
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-4 text-white sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/preview')}
                            className="shrink-0 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                            aria-label="Back to posts"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                                {post.title || 'Untitled Post'}
                            </h1>
                            <p className="mt-0.5 text-sm text-white/70">Preview, edit, and publish</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
                            {STATUS_LABELS[status] || status}
                        </span>
                        <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs tabular-nums">
                            {platforms.length} platform{platforms.length !== 1 ? 's' : ''}
                        </span>
                        <span className="rounded-lg bg-emerald-500/25 px-3 py-1.5 text-xs text-emerald-100 tabular-nums">
                            {publishedPlatforms.length} live
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Split layout */}
            <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
                {/* Left — preview & analytics */}
                <div className="min-w-0 border-b border-[#E8EDEA] lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between border-b border-[#E8EDEA] bg-[#FAFCFB] px-4 py-2.5 sm:px-5">
                        <PanelLabel>Platform preview</PanelLabel>
                    </div>
                    <PlatformTabs post={post} embedded />

                    {platforms.length > 0 && (
                        <>
                            <div className="border-t border-[#E8EDEA] bg-[#FAFCFB] px-4 py-2.5 sm:px-5">
                                <PanelLabel>Platform status</PanelLabel>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[#E8EDEA] text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">
                                            <th className="px-4 py-2 font-semibold sm:px-5">Platform</th>
                                            <th className="px-4 py-2 font-semibold sm:px-5">Account</th>
                                            <th className="px-4 py-2 text-right font-semibold sm:px-5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {platforms.map((p, idx) => {
                                            const cfg = PLATFORM_CONFIG[p.name];
                                            const Icon = cfg?.icon;
                                            const pStatus = p.status || 'draft';
                                            return (
                                                <tr
                                                    key={idx}
                                                    className="border-b border-[#E8EDEA] last:border-b-0 hover:bg-[#F4F8F6]"
                                                >
                                                    <td className="px-4 py-2.5 sm:px-5">
                                                        <span className="flex items-center gap-2 capitalize text-[#354F52]">
                                                            {cfg && Icon && (
                                                                <span
                                                                    className="flex h-7 w-7 items-center justify-center rounded-md"
                                                                    style={{ backgroundColor: cfg.bg }}
                                                                >
                                                                    <Icon
                                                                        className="h-3.5 w-3.5"
                                                                        style={{ color: cfg.color }}
                                                                        aria-hidden
                                                                    />
                                                                </span>
                                                            )}
                                                            {p.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-xs text-[#52796F] sm:px-5">
                                                        {p.accountId ? `${p.accountId.slice(0, 16)}…` : '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right sm:px-5">
                                                        <span
                                                            className={cn(
                                                                'inline-flex rounded px-2 py-0.5 text-[0.625rem] font-semibold uppercase',
                                                                statusBadge[pStatus] || statusBadge.draft
                                                            )}
                                                        >
                                                            {pStatus === 'processing' ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                    Processing
                                                                </span>
                                                            ) : (
                                                                pStatus
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {platforms.some((p) => p.errorMessage) && (
                                <div className="space-y-2 border-t border-[#E8EDEA] px-4 py-3 sm:px-5">
                                    {platforms
                                        .filter((p) => p.errorMessage)
                                        .map((p, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                                            >
                                                <strong className="capitalize">{p.name}:</strong> {p.errorMessage}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </>
                    )}

                    {publishedPlatforms.length > 0 && (
                        <>
                            <div className="flex items-center justify-between border-t border-[#E8EDEA] bg-[#FAFCFB] px-4 py-2.5 sm:px-5">
                                <PanelLabel>Performance</PanelLabel>
                                <button
                                    type="button"
                                    onClick={refreshMetrics}
                                    disabled={refreshing}
                                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#52796F] shadow-sm ring-1 ring-[#D5DFD9] hover:text-[#354F52] disabled:opacity-50"
                                >
                                    <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
                                    Refresh
                                </button>
                            </div>
                            {publishedPlatforms.map((p, idx) => {
                                const e = p.engagement || {};
                                const cfg = PLATFORM_CONFIG[p.name];
                                const Icon = cfg?.icon;
                                return (
                                    <div key={idx} className="border-t border-[#E8EDEA]">
                                        <div className="flex items-center gap-2 bg-[#354F52]/5 px-4 py-2 sm:px-5">
                                            {cfg && Icon && (
                                                <span
                                                    className="flex h-6 w-6 items-center justify-center rounded-md"
                                                    style={{ backgroundColor: cfg.bg }}
                                                >
                                                    <Icon className="h-3 w-3" style={{ color: cfg.color }} aria-hidden />
                                                </span>
                                            )}
                                            <span className="text-sm font-medium capitalize text-[#354F52]">{p.name}</span>
                                            {p.publishedAt && (
                                                <span className="ml-auto text-[0.6875rem] text-[#52796F]">
                                                    {new Date(p.publishedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-[#E8EDEA] sm:grid-cols-4">
                                            {[
                                                { label: 'Views', value: e.views, icon: Eye },
                                                { label: 'Likes', value: e.likes, icon: Heart },
                                                { label: 'Comments', value: e.comments, icon: MessageCircle },
                                                { label: 'Shares', value: e.shares, icon: Share2 },
                                            ].map(({ label, value, icon: MetricIcon }) => (
                                                <div key={label} className="px-3 py-3 text-center sm:px-4">
                                                    <div className="flex items-center justify-center gap-1 text-[0.625rem] text-[#52796F]">
                                                        <MetricIcon className="h-3 w-3" aria-hidden />
                                                        {label}
                                                    </div>
                                                    <p className="mt-0.5 text-base font-semibold tabular-nums text-[#354F52] sm:text-lg">
                                                        {formatNumber(value || 0)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                <PostEditorSidebar
                    post={post}
                    status={status}
                    allPublished={allPublished}
                    publishedPlatforms={publishedPlatforms}
                    remainingPlatforms={remainingPlatforms}
                    saving={saving}
                    publishing={publishing}
                    deleting={deleting}
                    onUpdatePost={updatePost}
                    onSchedule={() => setScheduleModalOpen(true)}
                    onPublish={publishNow}
                    onSaveDraft={saveDraft}
                    onDelete={deletePost}
                />
            </div>

            <ScheduleModal
                isOpen={scheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                onConfirm={handleConfirmSchedule}
                loading={saving}
            />
        </div>
    );
}
