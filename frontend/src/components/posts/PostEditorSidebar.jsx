'use client';

import { useState } from 'react';
import {
    Calendar,
    Send,
    Save,
    Trash2,
    Loader2,
    Clock,
    PenLine,
    Layers,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CaptionEditor from '../../../app/dashboard/preview/[contentId]/components/CaptionEditor';
import PlatformSelector from '../../../app/dashboard/preview/[contentId]/components/PlatformSelector';
import { STATUS_LABELS } from './postUtils';

const TABS = [
    { id: 'compose', label: 'Compose', icon: PenLine },
    { id: 'platforms', label: 'Platforms', icon: Layers },
];

export default function PostEditorSidebar({
    post,
    status,
    allPublished,
    publishedPlatforms,
    remainingPlatforms,
    saving,
    publishing,
    deleting,
    onUpdatePost,
    onSchedule,
    onPublish,
    onSaveDraft,
    onDelete,
}) {
    const [activeTab, setActiveTab] = useState('compose');
    const platforms = post?.platforms || [];
    const selectedCount = platforms.filter((p) => p.status !== 'published').length;
    const captionLength = (post?.content || '').length;

    const platformValue = platforms
        .filter((p) => p.status !== 'published')
        .map((p) => ({ name: p.name, accountId: p.accountId }));

    const handlePlatformChange = (list) => {
        const published = platforms.filter((p) => p.status === 'published');
        const next = [
            ...published,
            ...list.map((p) => ({
                name: p.name,
                accountId: p.accountId,
                status: 'draft',
            })),
        ];
        onUpdatePost({ platforms: next });
    };

    return (
        <aside className="flex flex-col bg-[#F4F8F6] lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden">
            {/* Sidebar header */}
            <div className="shrink-0 border-b border-[#D5DFD9] bg-gradient-to-r from-[#354F52] to-[#2F3E46] px-4 py-3.5 sm:px-5">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-semibold text-white">
                            {allPublished ? 'Post summary' : 'Editor'}
                        </p>
                        <p className="text-xs text-white/60">
                            {allPublished ? 'All platforms live' : 'Draft & publish'}
                        </p>
                    </div>
                    <span className="rounded-md bg-white/15 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-white">
                        {STATUS_LABELS[status] || status}
                    </span>
                </div>

                {!allPublished && (
                    <div className="mt-3 flex gap-1 rounded-lg bg-black/20 p-1">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-all',
                                    activeTab === id
                                        ? 'bg-white text-[#354F52] shadow-sm'
                                        : 'text-white/75 hover:text-white'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" aria-hidden />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {(post.scheduledAt || post.scheduledDate) && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                        <Clock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                        <span>
                            Scheduled{' '}
                            <strong>
                                {new Date(post.scheduledAt || post.scheduledDate).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </strong>
                        </span>
                    </div>
                )}

                {allPublished ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                                <div>
                                    <p className="text-sm font-semibold text-[#354F52]">Fully published</p>
                                    <p className="mt-1 text-xs leading-relaxed text-[#52796F]">
                                        Live on all {platforms.length} platform{platforms.length !== 1 ? 's' : ''}.
                                        View engagement in the preview panel.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-[#52796F]">Title</label>
                            <input
                                type="text"
                                value={post.title || ''}
                                disabled
                                className="w-full rounded-lg border border-[#D5DFD9] bg-white px-3 py-2 text-sm text-[#52796F] opacity-80"
                            />
                        </div>
                        {post.content && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-[#52796F]">Caption</label>
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-[#D5DFD9] bg-white px-3 py-2.5 text-sm leading-relaxed text-[#354F52]">
                                    {post.content}
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'compose' ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#D5DFD9] bg-white p-4 shadow-sm">
                            <label className="mb-1.5 block text-xs font-semibold text-[#354F52]">Post title</label>
                            <input
                                type="text"
                                value={post.title || ''}
                                onChange={(e) => onUpdatePost({ title: e.target.value })}
                                placeholder="Give your post a name…"
                                className="w-full rounded-lg border border-[#C8D4CE] bg-[#FAFCFB] px-3 py-2.5 text-sm text-[#354F52] placeholder:text-[#94A3B8] focus:border-[#84A98C] focus:outline-none focus:ring-2 focus:ring-[#84A98C]/25"
                            />
                        </div>

                        <div className="rounded-xl border border-[#D5DFD9] bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <label className="text-xs font-semibold text-[#354F52]">Caption</label>
                                <span className="rounded-full bg-[#F4F8F6] px-2 py-0.5 text-[0.625rem] tabular-nums text-[#52796F]">
                                    {captionLength} chars
                                </span>
                            </div>
                            <CaptionEditor
                                embedded
                                compact
                                content={post.content || ''}
                                topic={post.title || post.content || ''}
                                onChange={(content) => onUpdatePost({ content })}
                                onHashtags={(hashtags) => onUpdatePost({ hashtags })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#D5DFD9] bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-semibold text-[#354F52]">Target accounts</p>
                                <span className="rounded-full bg-[#84A98C]/15 px-2 py-0.5 text-[0.625rem] font-medium text-[#52796F]">
                                    {selectedCount} selected
                                </span>
                            </div>
                            <PlatformSelector embedded value={platformValue} onChange={handlePlatformChange} />
                        </div>

                        {publishedPlatforms.length > 0 && (
                            <div className="rounded-xl border border-[#D5DFD9] bg-white p-4 shadow-sm">
                                <p className="mb-2 text-xs font-semibold text-[#354F52]">Already live</p>
                                <ul className="space-y-1.5">
                                    {publishedPlatforms.map((p, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs"
                                        >
                                            <span className="capitalize text-[#354F52]">{p.name}</span>
                                            <span className="font-medium text-emerald-700">Published</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky actions */}
            <div className="shrink-0 border-t border-[#D5DFD9] bg-white p-4 shadow-[0_-4px_20px_rgba(47,62,70,0.06)] sm:p-5">
                {publishedPlatforms.length > 0 && remainingPlatforms.length > 0 && (
                    <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-[0.6875rem] leading-relaxed text-blue-800">
                        {remainingPlatforms.length} platform{remainingPlatforms.length !== 1 ? 's' : ''} still
                        pending — actions apply to those only.
                    </p>
                )}

                {!allPublished && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={onSchedule}
                            disabled={saving || platforms.length === 0}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#C8D4CE] bg-white px-3 py-2.5 text-sm font-medium text-[#354F52] transition-colors hover:bg-[#F4F8F6] disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Calendar className="h-4 w-4 text-[#52796F]" />
                            )}
                            Schedule
                        </button>
                        <button
                            type="button"
                            onClick={onPublish}
                            disabled={publishing || platforms.length === 0}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {publishing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Publish
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {!allPublished && (
                        <button
                            type="button"
                            onClick={onSaveDraft}
                            disabled={saving}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#52796F] transition-colors hover:bg-[#F4F8F6] disabled:opacity-50"
                            style={{ backgroundColor: '#84A98C18' }}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save draft
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={deleting}
                        className={cn(
                            'inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50',
                            allPublished ? 'flex-1' : 'shrink-0'
                        )}
                    >
                        {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        {allPublished ? 'Delete post' : null}
                    </button>
                </div>
            </div>
        </aside>
    );
}
