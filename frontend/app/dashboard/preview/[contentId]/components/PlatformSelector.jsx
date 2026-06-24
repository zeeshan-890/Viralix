'use client';
import { useAccounts } from '@/hooks/useAccounts';

import Image from 'next/image';

export default function PlatformSelector({ value = [], onChange, embedded = false }) {
    const { accounts, isLoading } = useAccounts();

    const targets = accounts.map(acc => ({
        name: acc.platform,
        accountId: acc.platformAccountId,
        label: `${acc.platform === 'facebook' ? 'Facebook' : acc.platform === 'instagram' ? 'Instagram' : acc.platform === 'youtube' ? 'YouTube' : 'TikTok'} — ${acc.accountName}`,
        key: `${acc.platform}:${acc.platformAccountId}`,
        icon: getPlatformIcon(acc.platform)
    }));

    function getPlatformIcon(platform) {
        const icons = {
            tiktok: '/tiktok.png',
            youtube: '/youtube.png',
            instagram: '/instagram.png',
            facebook: '/facebook.png',
        };

        if (icons[platform]) {
            return (
                <Image
                    src={icons[platform]}
                    alt={platform}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                />
            );
        }

        switch (platform) {
            case 'facebook': return '📘'; // Fallback if file missing (though standard keys above cover it)
            default: return '📱';
        }
    }

    const toggle = (t) => {
        const exists = value.some(p => p.name === t.name && p.accountId === t.accountId);
        const next = exists ? value.filter(p => !(p.name === t.name && p.accountId === t.accountId)) : [...value, { name: t.name, accountId: t.accountId }];
        onChange(next);
    };

    const body = isLoading ? (
        <div className="text-sm text-[#52796F]">Loading connected accounts…</div>
    ) : targets.length === 0 ? (
        <div className="text-sm text-[#52796F]">No connected social accounts found.</div>
    ) : (
        <div className="grid grid-cols-1 gap-1.5">
            {targets.map((t) => {
                const selected = value.some((p) => p.name === t.name && p.accountId === t.accountId);
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => toggle(t)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                            selected
                                ? 'border-[#84A98C] bg-[#84A98C]/10 text-[#354F52]'
                                : 'border-[var(--viralix-border)] bg-[var(--viralix-surface)] hover:border-[#84A98C]/50 hover:bg-[var(--viralix-bg)]'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span>{t.icon}</span>
                            <span className="text-sm font-medium">{t.label}</span>
                        </div>
                        {selected && <span className="text-[0.625rem] font-semibold uppercase text-[#52796F]">On</span>}
                    </button>
                );
            })}
        </div>
    );

    if (embedded) return body;

    return (
        <div className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] p-6">
            <h3 className="mb-4 text-lg font-semibold">Platforms</h3>
            {body}
        </div>
    );
}
