'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import PlatformBadge from '@/components/ui/PlatformBadge';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { getPlatform } from '@/config/platforms';
import { X, Plus } from 'lucide-react';

const RULE_TYPES = [
    { id: 'comment_dm', label: 'Comment → DM', desc: 'Auto-DM users who comment on posts' },
    { id: 'dm_keyword', label: 'DM keyword', desc: 'Reply when a DM contains keywords' },
    { id: 'away', label: 'Away message', desc: 'Send outside business hours' },
    { id: 'welcome', label: 'Welcome', desc: 'Greet new followers or contacts' },
];

const TONES = ['friendly', 'professional', 'concise', 'empathetic'];

const EMPTY_RULE = {
    name: '',
    type: 'dm_keyword',
    platforms: ['instagram'],
    triggerType: 'keyword',
    keywords: [],
    targetAudience: 'anyone',
    replyType: 'fixed',
    replyMessage: '',
    aiTone: 'friendly',
    enabled: true,
};

function PanelLabel({ children }) {
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--viralix-muted)]">{children}</p>;
}

export default function RuleEditor({ rule, onSave, onCancel, saving }) {
    const [form, setForm] = useState({ ...EMPTY_RULE, ...rule });
    const [keywordInput, setKeywordInput] = useState('');

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const togglePlatform = (p) => {
        const next = form.platforms.includes(p)
            ? form.platforms.filter((x) => x !== p)
            : [...form.platforms, p];
        set('platforms', next.length ? next : [p]);
    };

    const addKeyword = () => {
        const kw = keywordInput.trim().toLowerCase();
        if (!kw || form.keywords.includes(kw)) return;
        set('keywords', [...form.keywords, kw]);
        setKeywordInput('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--viralix-accent)]">{rule?._id ? 'Edit rule' : 'New auto-reply rule'}</h3>
                <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[var(--viralix-bg)]">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div>
                <PanelLabel>Rule name</PanelLabel>
                <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                    placeholder="e.g. Pricing inquiries"
                    className="mt-1.5 w-full rounded-lg border border-[var(--viralix-border)] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                />
            </div>

            <div>
                <PanelLabel>Rule type</PanelLabel>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {RULE_TYPES.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => set('type', t.id)}
                            className={cn(
                                'rounded-xl border p-3 text-left transition',
                                form.type === t.id ? 'border-[#84A98C] bg-[#84A98C]/10' : 'border-[var(--viralix-border)] hover:border-[var(--viralix-border)]'
                            )}
                        >
                            <p className="text-xs font-semibold text-[var(--viralix-accent)]">{t.label}</p>
                            <p className="mt-0.5 text-[0.625rem] text-[var(--viralix-muted)]">{t.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <PanelLabel>Platforms</PanelLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
                        const platformCfg = getPlatform(key);
                        const on = form.platforms.includes(key);
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => togglePlatform(key)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                                    on
                                        ? cn('ring-2 ring-offset-1', platformCfg?.selectedRing)
                                        : 'opacity-60 hover:opacity-100',
                                    platformCfg?.lightBg,
                                    platformCfg?.textColor
                                )}
                            >
                                <PlatformIcon platform={key} size={12} />
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {form.type !== 'away' && form.type !== 'welcome' && (
                <div>
                    <PanelLabel>Trigger</PanelLabel>
                    <div className="mt-2 flex gap-2">
                        {['keyword', 'any'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => set('triggerType', t)}
                                className={cn(
                                    'flex-1 rounded-lg py-2 text-xs font-medium capitalize transition',
                                    form.triggerType === t ? 'bg-[#354F52] text-white' : 'bg-[var(--viralix-inset)] text-[var(--viralix-muted)]'
                                )}
                            >
                                {t === 'any' ? 'Any message' : 'Keywords'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {form.triggerType === 'keyword' && form.type !== 'away' && (
                <div>
                    <PanelLabel>Keywords</PanelLabel>
                    <div className="mt-1.5 flex gap-2">
                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                            placeholder="info, price, help…"
                            className="flex-1 rounded-lg border border-[var(--viralix-border)] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                        />
                        <button type="button" onClick={addKeyword} className="rounded-lg bg-[#84A98C]/20 px-3 text-[var(--viralix-muted)] hover:bg-[#84A98C]/30">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {form.keywords.map((kw) => (
                            <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-[var(--viralix-inset)] px-2 py-0.5 text-xs text-[var(--viralix-accent)]">
                                {kw}
                                <button type="button" onClick={() => set('keywords', form.keywords.filter((k) => k !== kw))} className="text-[#94A3B8] hover:text-red-500">×</button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <PanelLabel>Reply mode</PanelLabel>
                <div className="mt-2 flex gap-2">
                    {[
                        { id: 'fixed', label: 'Fixed message' },
                        { id: 'ai', label: 'AI generated' },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => set('replyType', id)}
                            className={cn(
                                'flex-1 rounded-lg py-2 text-xs font-medium transition',
                                form.replyType === id ? 'bg-[#52796F] text-white' : 'bg-[var(--viralix-inset)] text-[var(--viralix-muted)]'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {form.replyType === 'fixed' ? (
                <div>
                    <PanelLabel>Reply message</PanelLabel>
                    <textarea
                        value={form.replyMessage}
                        onChange={(e) => set('replyMessage', e.target.value)}
                        rows={3}
                        required
                        placeholder="Hey! Thanks for reaching out…"
                        className="mt-1.5 w-full resize-none rounded-lg border border-[var(--viralix-border)] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                    />
                </div>
            ) : (
                <div>
                    <PanelLabel>AI tone</PanelLabel>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {TONES.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => set('aiTone', t)}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition',
                                    form.aiTone === t ? 'bg-[#354F52] text-white' : 'bg-[var(--viralix-inset)] text-[var(--viralix-muted)]'
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onCancel} className="btn btn-cancel flex-1">
                    Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-confirm flex-1 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save rule'}
                </button>
            </div>
        </form>
    );
}
