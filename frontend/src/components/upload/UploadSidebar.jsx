'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Calendar,
    Send,
    Save,
    Loader2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Target,
    PenLine,
    Rocket,
    Info,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TagsInput from '../../../app/dashboard/upload/components/TagsInput';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { getPlatform } from '@/config/platforms';

const TABS = [
    { id: 'targets', label: 'Platforms', icon: Target },
    { id: 'write', label: 'Write', icon: PenLine },
    { id: 'publish', label: 'Publish', icon: Rocket },
];

const CATEGORIES = [
    { value: '', label: 'No category' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'technology', label: 'Technology' },
    { value: 'business', label: 'Business' },
];

export default function UploadSidebar({
    contentForm,
    onFormChange,
    connectedTargets,
    selectedPlatforms,
    onTogglePlatform,
    mediaConstraints,
    scheduleType,
    onScheduleTypeChange,
    date,
    time,
    onDateChange,
    onTimeChange,
    uploadedFiles,
    canSubmit,
    actionLoading,
    actionError,
    validationHints,
    onSaveDraft,
    onPublish,
    onSchedule,
    tiktokPanel,
}) {
    const [tab, setTab] = useState('targets');
    const constraints = mediaConstraints || { platformNotes: [], summary: '', hints: [] };
    const fieldClass =
        'w-full rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-3 py-2.5 text-sm text-[var(--viralix-accent)] placeholder:text-[#94A3B8] focus:border-[#84A98C] focus:outline-none focus:ring-2 focus:ring-[#84A98C]/25';

    return (
        <aside className="flex flex-col dash-card bg-[var(--viralix-surface)] lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden">
            {/* Tab bar */}
            <div className="shrink-0 border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-3 pt-3 sm:px-4">
                <div className="flex gap-1 rounded-lg bg-[var(--viralix-border)]/60 p-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all',
                                tab === id ? 'bg-[var(--viralix-surface)] text-[var(--viralix-accent)] shadow-sm' : 'text-[var(--viralix-muted)] hover:text-[var(--viralix-accent)]'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {tab === 'write' && (
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[var(--viralix-accent)]">Title</label>
                            <input
                                type="text"
                                value={contentForm.title}
                                onChange={(e) => onFormChange('title', e.target.value)}
                                placeholder="What's this post about?"
                                className={fieldClass}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="text-xs font-semibold text-[var(--viralix-accent)]">Caption</label>
                                <span className="text-[0.625rem] tabular-nums text-[#94A3B8]">{contentForm.description.length} chars</span>
                            </div>
                            <textarea
                                rows={5}
                                value={contentForm.description}
                                onChange={(e) => onFormChange('description', e.target.value)}
                                placeholder="Write something your audience will love…"
                                className={cn(fieldClass, 'resize-none')}
                            />
                        </div>
                        <TagsInput embedded tags={contentForm.tags} onChange={(tags) => onFormChange('tags', tags)} />
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[var(--viralix-accent)]">Category</label>
                            <select value={contentForm.category} onChange={(e) => onFormChange('category', e.target.value)} className={fieldClass}>
                                {CATEGORIES.map(({ value, label }) => (
                                    <option key={value || 'none'} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {tab === 'targets' && (
                    <div className="space-y-3">
                        <p className="text-xs text-[var(--viralix-muted)]">
                            Step 1 — choose where to publish. Media and publish options adapt to your selection.
                        </p>
                        {connectedTargets.length === 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                                No accounts connected.{' '}
                                <Link href="/dashboard/connect-accounts" className="font-semibold underline">Connect platforms</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                {connectedTargets.map((t) => {
                                    const selected = selectedPlatforms.some((p) => p.name === t.name && p.accountId === t.accountId);
                                    const platformCfg = getPlatform(t.name);
                                    return (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => onTogglePlatform(t)}
                                            className={cn(
                                                'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all',
                                                selected
                                                    ? cn('shadow-sm', platformCfg?.selectedBorder, platformCfg?.selectedBg)
                                                    : 'border-[var(--viralix-border)] hover:border-[var(--viralix-border)] hover:bg-[var(--viralix-bg)]'
                                            )}
                                        >
                                            <PlatformBadge platform={t.name} size="md" />
                                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--viralix-accent)]">{t.label}</span>
                                            {selected && (
                                                <CheckCircle2
                                                    className="h-4 w-4 shrink-0"
                                                    style={{ color: platformCfg?.color || '#84A98C' }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedPlatforms.length > 0 && (
                            <div className="rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--viralix-accent)]">
                                    <Info className="h-3.5 w-3.5 text-[#84A98C]" />
                                    Media for this selection
                                </div>
                                <p className="text-xs text-[var(--viralix-muted)]">
                                    <span className="font-medium text-[var(--viralix-accent)]">{constraints.summary}</span>
                                    {constraints.maxFiles === 1 ? ' · single file' : ` · up to ${constraints.maxFiles} files`}
                                    {!constraints.requiresMedia && ' · text-only OK (Facebook)'}
                                </p>
                                {constraints.hints?.map((hint) => (
                                    <p key={hint} className="text-[0.6875rem] leading-relaxed text-[var(--viralix-muted)]">
                                        {hint}
                                    </p>
                                ))}
                            </div>
                        )}

                        {constraints.platformNotes?.map(({ platform, label, note, advancedUploadPath }) => (
                            <div
                                key={platform}
                                className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-inset)]/50 px-3 py-2.5 text-xs text-[var(--viralix-muted)]"
                            >
                                <span className="font-semibold text-[var(--viralix-accent)]">{label}:</span> {note}
                                {advancedUploadPath && selectedPlatforms.some((p) => p.name === platform) && (
                                    <Link
                                        href={advancedUploadPath}
                                        className="mt-1.5 flex items-center gap-1 font-medium text-pink-600 hover:underline"
                                    >
                                        Open Instagram Upload
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                )}
                            </div>
                        ))}

                        {selectedPlatforms.length > 0 && (
                            <p className="text-[0.6875rem] text-[var(--viralix-muted)]">
                                {selectedPlatforms.length} account{selectedPlatforms.length !== 1 ? 's' : ''} selected
                                {uploadedFiles.length > 0 && ` · ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} uploaded`}
                            </p>
                        )}
                    </div>
                )}

                {tab === 'publish' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {[
                                { id: 'now', label: 'Publish now', desc: 'Go live immediately', icon: Send },
                                { id: 'later', label: 'Schedule', desc: 'Pick a date and time', icon: Clock },
                            ].map(({ id, label, desc, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => onScheduleTypeChange(id)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                                        scheduleType === id
                                            ? 'border-[#354F52] bg-[#354F52]/5'
                                            : 'border-[var(--viralix-border)] hover:border-[var(--viralix-border)]'
                                    )}
                                >
                                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', scheduleType === id ? 'bg-[#354F52] text-white' : 'bg-[var(--viralix-inset)] text-[var(--viralix-muted)]')}>
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-medium text-[var(--viralix-accent)]">{label}</span>
                                        <span className="text-xs text-[var(--viralix-muted)]">{desc}</span>
                                    </span>
                                </button>
                            ))}
                            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--viralix-border)] px-4 py-3 opacity-60">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--viralix-inset)] text-[var(--viralix-muted)]">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <span>
                                    <span className="block text-sm font-medium text-[var(--viralix-accent)]">AI optimal time</span>
                                    <span className="text-xs text-[var(--viralix-muted)]">Coming soon</span>
                                </span>
                            </div>
                        </div>

                        {scheduleType === 'later' && (
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-3">
                                <div>
                                    <label className="mb-1 block text-[0.625rem] font-medium uppercase tracking-wide text-[var(--viralix-muted)]">Date</label>
                                    <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => onDateChange(e.target.value)} className={fieldClass} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[0.625rem] font-medium uppercase tracking-wide text-[var(--viralix-muted)]">Time</label>
                                    <input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} className={fieldClass} />
                                </div>
                            </div>
                        )}

                        {tiktokPanel}

                        {validationHints?.map((hint, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs',
                                    hint.type === 'error'
                                        ? 'bg-red-50 text-red-800 ring-1 ring-red-200'
                                        : hint.type === 'info'
                                          ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-200'
                                          : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                                )}
                            >
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {hint.message}
                            </div>
                        ))}

                        {actionError && (
                            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-800 ring-1 ring-red-200">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {actionError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky actions */}
            <div className="shrink-0 border-t border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-4 sm:p-5">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                        type="button"
                        onClick={onSaveDraft}
                        disabled={actionLoading || !contentForm.title || !contentForm.description || selectedPlatforms.length === 0}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg dash-card border border-[var(--viralix-border)] px-4 py-2.5 text-sm font-medium text-[var(--viralix-accent)] hover:bg-[var(--viralix-surface)] disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save draft
                    </button>
                    {scheduleType === 'now' ? (
                        <button
                            type="button"
                            onClick={onPublish}
                            disabled={actionLoading || !canSubmit}
                            className="btn btn-success disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Publish
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onSchedule}
                            disabled={actionLoading || !canSubmit}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                            style={{ backgroundColor: '#84A98C' }}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                            Schedule
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
