'use client';

import { useState } from 'react';
import Link from 'next/link';
import { inboxAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';

const TONES = [
    { id: 'friendly', label: 'Friendly' },
    { id: 'professional', label: 'Professional' },
    { id: 'concise', label: 'Concise' },
    { id: 'empathetic', label: 'Empathetic' },
];

export default function AiReplyPanel({ conversationId, onInsert, aiEnabled = true }) {
    const [expanded, setExpanded] = useState(true);
    const [tone, setTone] = useState('friendly');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const generate = async () => {
        if (!conversationId) return;
        setLoading(true);
        setSuggestions([]);
        try {
            const res = await inboxAPI.aiSuggest(conversationId, { tone });
            setSuggestions(res.data.suggestions || []);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    if (!aiEnabled) {
        return (
            <div className="border-t border-[#E8EDEA] bg-[#FAFCFB] px-4 py-2">
                <Link href="/dashboard/inbox/auto-reply" className="flex items-center justify-center gap-1.5 text-xs text-[#52796F] hover:text-[#354F52]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Enable AI replies in settings
                </Link>
            </div>
        );
    }

    return (
        <div className="border-t border-[#E8EDEA] bg-gradient-to-r from-[#84A98C]/5 to-transparent">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left"
            >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#354F52]">
                    <Sparkles className="h-3.5 w-3.5 text-[#84A98C]" />
                    AI reply assistant
                </span>
                <span className="flex items-center gap-2">
                    <Link
                        href="/dashboard/inbox/auto-reply"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-1 text-[#94A3B8] hover:bg-white hover:text-[#52796F]"
                        title="Auto-reply settings"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                    </Link>
                    {expanded ? <ChevronUp className="h-4 w-4 text-[#94A3B8]" /> : <ChevronDown className="h-4 w-4 text-[#94A3B8]" />}
                </span>
            </button>

            {expanded && (
                <div className="space-y-3 px-4 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                            {TONES.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTone(t.id)}
                                    className={cn(
                                        'rounded-lg px-2.5 py-1 text-[0.625rem] font-medium transition',
                                        tone === t.id ? 'bg-[#354F52] text-white' : 'bg-white text-[#52796F] ring-1 ring-[#D5DFD9]'
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={generate}
                            disabled={loading || !conversationId}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#52796F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#354F52] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                            Generate
                        </button>
                    </div>

                    {loading && (
                        <p className="text-center text-xs text-[#52796F]">Drafting replies…</p>
                    )}

                    {!loading && suggestions.length > 0 && (
                        <div className="space-y-2">
                            {suggestions.map((sug) => (
                                <button
                                    key={sug.id}
                                    type="button"
                                    onClick={() => onInsert(sug.text)}
                                    className="group w-full rounded-xl border border-[#E8EDEA] bg-white p-3 text-left transition hover:border-[#84A98C] hover:shadow-sm"
                                >
                                    <p className="line-clamp-3 text-xs text-[#354F52] group-hover:text-[#2F3E46]">{sug.text}</p>
                                    <p className="mt-1.5 text-[0.5625rem] text-[#94A3B8]">
                                        {Math.round((sug.confidence || 0) * 100)}% confidence · {sug.tone}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {!loading && suggestions.length === 0 && (
                        <p className="text-center text-[0.625rem] text-[#94A3B8]">
                            Pick a tone and generate — click a suggestion to insert it
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
