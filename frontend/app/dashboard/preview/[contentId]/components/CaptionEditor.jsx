'use client';
import { useState, useEffect } from 'react';
import { aiAPI } from '@/lib/api';

export default function CaptionEditor({ content = '', onChange, topic = '', onHashtags }) {
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

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Caption Editor</h3>

            {/* Platform Selector */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optimize for Platform
                </label>
                <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                </select>
            </div>

            {/* Caption Textarea */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                </label>
                <textarea
                    value={caption}
                    onChange={(e) => handleCaptionChange(e.target.value)}
                    rows={6}
                    placeholder="Write your caption here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${remainingChars < 0 ? 'text-red-600' : remainingChars < 50 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {remainingChars} characters remaining
                    </span>
                    <button onClick={runAiOptimize} disabled={aiLoading} className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-60">
                        {aiLoading ? 'Optimizing…' : '✨ AI Optimize'}
                    </button>
                </div>
            </div>

            {/* AI Caption Suggestions */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                        AI Suggestions
                    </label>
                    <button onClick={generateSuggestions} disabled={suggesting} className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-60">
                        {suggesting ? 'Generating…' : '✨ Generate Suggestions'}
                    </button>
                </div>
                {suggestions.length === 0 && !suggesting && (
                    <div className="text-xs text-gray-500">No suggestions yet. Click Generate to get ideas.</div>
                )}
                <div className="space-y-2 max-h-40 overflow-y-auto break-words whitespace-pre-wrap">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => applySuggestion(s)}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm break-words"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Hashtag Suggestions (click to append to caption end) */}
            {aiTagSuggestions.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">AI Hashtag Suggestions</label>
                        <button onClick={() => setAiTagSuggestions([])} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {aiTagSuggestions.map((t, idx) => (
                            <button
                                key={idx}
                                onClick={() => addTag(t)}
                                className="px-2 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-800"
                                title={`Add #${t}`}
                            >
                                #{t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hashtags (merged into caption; appended at end) */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                        Hashtags ({tags.length}/30)
                    </label>
                    <button onClick={generateAiHashtags} disabled={aiTagsLoading} className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-60">
                        {aiTagsLoading ? 'Generating…' : '✨ Generate with AI'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 border border-gray-300 rounded-lg">
                    {tags.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            #{t}
                            <button onClick={() => removeTag(t)} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length === 0 ? 'Type hashtags...' : ''}
                        className="flex-1 min-w-[120px] outline-none"
                    />
                </div>
                <p className="text-xs text-gray-500">Hashtags are appended to the end of the caption automatically.</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.action}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
