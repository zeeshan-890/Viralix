'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
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
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">{children}</p>;
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
                <h3 className="text-sm font-semibold text-[#354F52]">{rule?._id ? 'Edit rule' : 'New auto-reply rule'}</h3>
                <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F4F8F6]">
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
                    className="mt-1.5 w-full rounded-lg border border-[#D5DFD9] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
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
                                form.type === t.id ? 'border-[#84A98C] bg-[#84A98C]/10' : 'border-[#E8EDEA] hover:border-[#B8C9C0]'
                            )}
                        >
                            <p className="text-xs font-semibold text-[#354F52]">{t.label}</p>
                            <p className="mt-0.5 text-[0.625rem] text-[#52796F]">{t.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <PanelLabel>Platforms</PanelLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const on = form.platforms.includes(key);
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => togglePlatform(key)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                                    on ? 'ring-2 ring-[#84A98C] ring-offset-1' : 'opacity-60 hover:opacity-100'
                                )}
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                                <Icon className="h-3 w-3" />
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
                                    form.triggerType === t ? 'bg-[#354F52] text-white' : 'bg-[#F4F8F6] text-[#52796F]'
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
                            className="flex-1 rounded-lg border border-[#D5DFD9] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                        />
                        <button type="button" onClick={addKeyword} className="rounded-lg bg-[#84A98C]/20 px-3 text-[#52796F] hover:bg-[#84A98C]/30">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {form.keywords.map((kw) => (
                            <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-[#F4F8F6] px-2 py-0.5 text-xs text-[#354F52]">
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
                                form.replyType === id ? 'bg-[#52796F] text-white' : 'bg-[#F4F8F6] text-[#52796F]'
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
                        className="mt-1.5 w-full resize-none rounded-lg border border-[#D5DFD9] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
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
                                    form.aiTone === t ? 'bg-[#354F52] text-white' : 'bg-[#F4F8F6] text-[#52796F]'
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#D5DFD9] py-2.5 text-sm font-medium text-[#52796F] hover:bg-[#F4F8F6]">
                    Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#52796F] py-2.5 text-sm font-medium text-white hover:bg-[#354F52] disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save rule'}
                </button>
            </div>
        </form>
    );
}
