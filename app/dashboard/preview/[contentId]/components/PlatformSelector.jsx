'use client';
import { useAccounts } from '@/hooks/useAccounts';

export default function PlatformSelector({ value = [], onChange }) {
    const { accounts, isLoading } = useAccounts();

    const targets = accounts.map(acc => ({
        name: acc.platform,
        accountId: acc.platformAccountId,
        label: `${acc.platform === 'facebook' ? 'Facebook' : acc.platform === 'instagram' ? 'Instagram' : acc.platform === 'youtube' ? 'YouTube' : 'TikTok'} — ${acc.accountName}`,
        key: `${acc.platform}:${acc.platformAccountId}`,
        icon: getPlatformIcon(acc.platform)
    }));

    function getPlatformIcon(platform) {
        switch (platform) {
            case 'facebook': return '📘';
            case 'instagram': return '📷';
            case 'tiktok': return '🎵';
            case 'youtube': return '📺';
            default: return '📱';
        }
    }

    const toggle = (t) => {
        const exists = value.some(p => p.name === t.name && p.accountId === t.accountId);
        const next = exists ? value.filter(p => !(p.name === t.name && p.accountId === t.accountId)) : [...value, { name: t.name, accountId: t.accountId }];
        onChange(next);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Platforms</h3>
            {isLoading ? (
                <div className="text-sm text-gray-500">Loading connected accounts…</div>
            ) : targets.length === 0 ? (
                <div className="text-sm text-gray-500">No connected social accounts found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {targets.map(t => {
                        const selected = value.some(p => p.name === t.name && p.accountId === t.accountId);
                        return (
                            <button key={t.key} onClick={() => toggle(t)} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                                <div className="flex items-center space-x-2">
                                    <span>{t.icon}</span>
                                    <span className="text-sm font-medium">{t.label}</span>
                                </div>
                                {selected && <span className="text-xs">Selected</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
