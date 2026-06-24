'use client';
import { useAccounts } from '@/hooks/useAccounts';
import { cn } from '@/lib/utils';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { getPlatform } from '@/config/platforms';

export default function PlatformSelector({ value = [], onChange, embedded = false }) {
    const { accounts, isLoading } = useAccounts();

    const targets = accounts.map((acc) => ({
        name: acc.platform,
        accountId: acc.platformAccountId,
        label: `${getPlatform(acc.platform)?.label || acc.platform} — ${acc.accountName}`,
        key: `${acc.platform}:${acc.platformAccountId}`,
    }));

    const toggle = (t) => {
        const exists = value.some((p) => p.name === t.name && p.accountId === t.accountId);
        const next = exists
            ? value.filter((p) => !(p.name === t.name && p.accountId === t.accountId))
            : [...value, { name: t.name, accountId: t.accountId }];
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
                const platformCfg = getPlatform(t.name);
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => toggle(t)}
                        className={cn(
                            'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                            selected
                                ? cn('shadow-sm', platformCfg?.selectedBorder, platformCfg?.selectedBg)
                                : 'border-[var(--viralix-border)] bg-[var(--viralix-surface)] hover:bg-[var(--viralix-bg)]'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <PlatformBadge platform={t.name} size="sm" />
                            <span className="text-sm font-medium">{t.label}</span>
                        </div>
                        {selected && (
                            <span className="text-[0.625rem] font-semibold uppercase" style={{ color: platformCfg?.color }}>
                                On
                            </span>
                        )}
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
