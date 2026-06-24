'use client';

import { cn } from '@/lib/utils';

const SUGGESTED = ['viral', 'trending', 'education', 'lifestyle', 'technology', 'marketing', 'tutorial', 'review'];

export default function TagsInput({ tags = [], onChange, embedded = false }) {
    const labelClass = 'mb-1.5 block text-xs font-medium text-[#52796F]';
    const inputClass =
        'w-full rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-3 py-2 text-sm text-[#354F52] focus:border-[#84A98C] focus:outline-none focus:ring-2 focus:ring-[#84A98C]/25';

    const body = (
        <>
            <div className="mb-2 flex min-h-[36px] flex-wrap gap-1.5 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-[#84A98C]/15 px-2 py-0.5 text-xs text-[#354F52]"
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={() => onChange?.(tags.filter((t) => t !== tag))}
                            className="ml-1 text-[#52796F] hover:text-[#354F52]"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
                    className="min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-[#94A3B8]"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim().replace(/^#/, '');
                            if (val && !tags.includes(val)) {
                                onChange?.([...tags, val]);
                                e.currentTarget.value = '';
                            }
                        } else if (e.key === 'Backspace' && !e.currentTarget.value && tags.length) {
                            onChange?.(tags.slice(0, -1));
                        }
                    }}
                />
            </div>
            <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.filter((t) => !tags.includes(t))
                    .slice(0, 6)
                    .map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => onChange?.([...tags, tag])}
                            className="rounded-full bg-[var(--viralix-bg)] px-2 py-0.5 text-[0.6875rem] text-[var(--viralix-muted)] hover:bg-[var(--viralix-border)]"
                        >
                            #{tag}
                        </button>
                    ))}
            </div>
        </>
    );

    if (embedded) {
        return (
            <div>
                <label className={labelClass}>Hashtags</label>
                {body}
            </div>
        );
    }

    return (
        <div>
            <label className={labelClass}>Tags</label>
            {body}
        </div>
    );
}
