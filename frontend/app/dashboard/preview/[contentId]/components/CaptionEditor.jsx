'use client';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { aiAPI } from '@/lib/api';

export default function CaptionEditor({ content = '', onChange, topic = '', onHashtags, embedded = false, compact = false }) {
    const [caption, setCaption] = useState(content);
    const [platform, setPlatform] = useState('facebook');
    const [aiLoading, setAiLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggesting, setSuggesting] = useState(false);
    const [aiTagSuggestions, setAiTagSuggestions] = useState([]);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');

    // Helper to split caption body and a trailing hashtags-only line
    const splitBodyAndTags = (txt) => {
        if (!txt) return { body: '', tags: [] };
        // Match a trailing line that consists primarily of hashtags
        const m = txt.match(/([\s\S]*?)(?:\n\s*)?(#\w+(?:\s+#\w+)*\s*)$/);
        if (m) {
            const body = m[1].trimEnd();
            const tail = m[2] || '';
            const found = (tail.match(/#(\w+)/g) || []).map(s => s.slice(1).toLowerCase());
            return { body, tags: found };
        }
        return { body: txt.trimEnd(), tags: [] };
    };

    // Initialize from incoming content (parse trailing hashtags into tags)
    useEffect(() => {
        setCaption(content || '');
        const { tags: initialTags } = splitBodyAndTags(content || '');
        setTags(initialTags);
    }, [content]);

    const handleCaptionChange = (newCaption) => {
        setCaption(newCaption);
        // Keep tag UI in sync if user edits trailing hashtag line manually
        const { tags: trailing } = splitBodyAndTags(newCaption || '');
        setTags(trailing);
        if (onChange) onChange(newCaption);
    };

    const platformLimits = {
        facebook: 8000,
        instagram: 2200,
        twitter: 280,
        linkedin: 3000,
        tiktok: 300,
        youtube: 5000
    };

    const currentLimit = platformLimits[platform];
    const remainingChars = currentLimit - caption.length;

    const aiSuggestions = [
        "Quick, punchy ideas appear here.",
        "Use AI Generate Suggestions to get 2–3 short lines.",
        "Click any suggestion to apply and auto-add hashtags.",
    ];

    const quickActions = [
        { label: 'Add Emoji', action: () => handleCaptionChange(caption + ' ✨') },
        { label: 'Add CTA', action: () => handleCaptionChange(caption + '\n\n👇 What do you think? Let us know in the comments!') },
        { label: 'Add Question', action: () => handleCaptionChange(caption + '\n\n❓ What\'s your experience with this?') }
    ];

    const runAiOptimize = async () => {
        if (!caption) return;
        setAiLoading(true);
        try {
            const res = await aiAPI.rewrite({ text: caption, tone: 'engaging', platform });
            if (res?.data?.text) handleCaptionChange(res.data.text);
        } catch (e) {
            // noop
        } finally {
            setAiLoading(false);
        }
    };

    const generateSuggestions = async () => {
        const base = topic || caption || 'social media post';
        setSuggesting(true);
        try {
            // Create 6-8 variants by varying tone and angle
            const tones = ['engaging', 'friendly', 'informative', 'bold', 'curious', 'conversational', 'playful', 'professional'];
            const angles = ['', 'benefit-focused', 'question-led', 'authority', 'story-led'];
            const prompts = tones.slice(0, 8).map((t, idx) => {
                const angle = angles[idx % angles.length];
                const tTopic = angle ? `${base} (${angle})` : base;
                return aiAPI.caption({ topic: tTopic, tone: t, platform });
            });
            const results = await Promise.allSettled(prompts);
            const list = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value?.data?.text)
                .filter(Boolean)
                // Normalize whitespace and dedupe
                .map(s => s.replace(/\s+$/g, ''));
            const unique = Array.from(new Set(list));
            setSuggestions(unique);
        } catch (e) {
            setSuggestions([]);
        } finally {
            setSuggesting(false);
        }
    };

    // Build caption with trailing hashtag block from current body and tags
    const buildCaptionWithTags = (body, tagList) => {
        const unique = Array.from(new Set((tagList || []).map(t => t.replace('#', '').toLowerCase())));
        if (unique.length === 0) return body.trimEnd();
        const tagLine = unique.map(t => `#${t}`).join(' ');
        return `${body.trimEnd()}\n\n${tagLine}`;
    };

    const updateTags = (nextTags) => {
        const { body } = splitBodyAndTags(caption || '');
        const capped = Array.from(new Set(nextTags)).slice(0, 30);
        const nextCaption = buildCaptionWithTags(body, capped);
        setTags(capped);
        setCaption(nextCaption);
        if (onChange) onChange(nextCaption);
        if (onHashtags) onHashtags(capped);
    };

    const applySuggestion = async (text) => {
        // Set base caption body only; do not auto-insert hashtags
        const base = (text || '').trim();
        setCaption(base);
        if (onChange) onChange(base);
        // Generate hashtag suggestions, but show as clickable chips instead of auto-append
        try {
            const res = await aiAPI.hashtags({ topic: base, platform, count: 20 });
            const list = (res?.data?.hashtags || []).map(t => t.replace('#', '').toLowerCase());
            const unique = Array.from(new Set(list)).slice(0, 20);
            setAiTagSuggestions(unique);
        } catch (e) {
            setAiTagSuggestions([]);
        }
    };

    const addTag = (t) => {
        const clean = (t || '').replace('#', '').trim().toLowerCase();
        if (!clean) return;
        if (tags.includes(clean) || tags.length >= 30) return;
        updateTags([...tags, clean]);
        setTagInput('');
    };

    const removeTag = (t) => {
        updateTags(tags.filter(x => x !== t));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addTag(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    const [aiTagsLoading, setAiTagsLoading] = useState(false);

    const generateAiHashtags = async () => {
        setAiTagsLoading(true);
        try {
            const base = topic || caption || 'general content';
            const res = await aiAPI.hashtags({ topic: base, platform: platform || 'instagram', count: 20 });
            const list = (res?.data?.hashtags || []).map(t => t.replace('#', '').toLowerCase());
            const unique = Array.from(new Set(list)).slice(0, 20);
            // Show suggestions as chips; don't auto-append
            setAiTagSuggestions(unique);
        } catch (e) {
            // noop
        } finally {
            setAiTagsLoading(false);
        }
    };

    const fieldClass =
        'w-full rounded-lg border border-[#C8D4CE] bg-[#FAFCFB] px-3 py-2 text-sm text-[#354F52] focus:border-[#84A98C] focus:outline-none focus:ring-2 focus:ring-[#84A98C]/25';
    const labelClass = 'mb-1.5 block text-xs font-medium text-[#52796F]';

    const aiTools = (
        <>
            <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                    <label className={labelClass}>AI suggestions</label>
                    <button
                        type="button"
                        onClick={generateSuggestions}
                        disabled={suggesting}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#52796F] hover:text-[#354F52] disabled:opacity-60"
                    >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {suggesting ? 'Generating…' : 'Generate'}
                    </button>
                </div>
                {suggestions.length === 0 && !suggesting && (
                    <div className="text-xs text-[#94A3B8]">Generate caption ideas with AI.</div>
                )}
                <div className="max-h-28 space-y-1.5 overflow-y-auto break-words whitespace-pre-wrap">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => applySuggestion(s)}
                            className="w-full rounded-lg bg-[#F4F8F6] p-2.5 text-left text-xs text-[#354F52] transition-colors hover:bg-[#E8EDEA]"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {aiTagSuggestions.length > 0 && (
                <div className="mb-3">
                    <div className="mb-2 flex items-center justify-between">
                        <label className={labelClass}>AI hashtag picks</label>
                        <button
                            type="button"
                            onClick={() => setAiTagSuggestions([])}
                            className="text-xs text-[#94A3B8] hover:text-[#52796F]"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {aiTagSuggestions.map((t, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => addTag(t)}
                                className="rounded-full bg-[#EEF3F0] px-2 py-0.5 text-xs text-[#354F52] hover:bg-[#D5DFD9]"
                                title={`Add #${t}`}
                            >
                                #{t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={action.action}
                        className="rounded-full bg-[#F4F8F6] px-2.5 py-1 text-xs text-[#52796F] transition-colors hover:bg-[#E8EDEA]"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </>
    );

    const body = (
        <>
            {!compact && (
                <div className="mb-4">
                    <label className={labelClass}>Optimize for platform</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={fieldClass}>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="twitter">Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                    </select>
                </div>
            )}

            <div className={compact ? 'mb-3' : 'mb-4'}>
                {!compact && <label className={labelClass}>Caption</label>}
                <textarea
                    value={caption}
                    onChange={(e) => handleCaptionChange(e.target.value)}
                    rows={compact ? 6 : 6}
                    placeholder="Write your caption…"
                    className={`${fieldClass} resize-none`}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {compact && (
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="rounded-md border border-[#D5DFD9] bg-white px-2 py-1 text-[0.6875rem] text-[#52796F] focus:border-[#84A98C] focus:outline-none"
                                aria-label="Optimize for platform"
                            >
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="twitter">Twitter</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="tiktok">TikTok</option>
                                <option value="youtube">YouTube</option>
                            </select>
                        )}
                        <span
                            className={`text-xs tabular-nums ${remainingChars < 0 ? 'text-red-600' : remainingChars < 50 ? 'text-amber-600' : 'text-[#52796F]'}`}
                        >
                            {remainingChars} left
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={runAiOptimize}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#52796F] hover:text-[#354F52] disabled:opacity-60"
                    >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {aiLoading ? 'Optimizing…' : 'Optimize'}
                    </button>
                </div>
            </div>

            <div className={compact ? 'mb-3' : 'mb-4'}>
                <div className="mb-2 flex items-center justify-between">
                    <label className={labelClass}>Hashtags ({tags.length}/30)</label>
                    <button
                        type="button"
                        onClick={generateAiHashtags}
                        disabled={aiTagsLoading}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#52796F] hover:text-[#354F52] disabled:opacity-60"
                    >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {aiTagsLoading ? 'Generating…' : 'AI tags'}
                    </button>
                </div>
                <div className="flex min-h-[36px] flex-wrap gap-1.5 rounded-lg border border-[#C8D4CE] bg-[#FAFCFB] p-2">
                    {tags.map((t, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-[#84A98C]/15 px-2 py-0.5 text-xs text-[#354F52]"
                        >
                            #{t}
                            <button
                                type="button"
                                onClick={() => removeTag(t)}
                                className="ml-1 text-[#52796F] hover:text-[#354F52]"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length === 0 ? 'Add hashtags…' : ''}
                        className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-[#94A3B8]"
                    />
                </div>
            </div>

            {compact ? (
                <details className="group rounded-lg border border-[#E8EDEA] bg-[#FAFCFB]">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-medium text-[#52796F] marker:content-none [&::-webkit-details-marker]:hidden">
                        <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[#84A98C]" aria-hidden />
                            AI writing tools
                        </span>
                        <span className="text-[#94A3B8] transition-transform group-open:rotate-180">▾</span>
                    </summary>
                    <div className="border-t border-[#E8EDEA] px-3 py-3">{aiTools}</div>
                </details>
            ) : (
                aiTools
            )}
        </>
    );

    if (embedded) return body;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Caption Editor</h3>
            {body}
        </div>
    );
}
