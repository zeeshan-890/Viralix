'use client';

import { formatNumber } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';

function PanelLabel({ children }) {
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--viralix-muted)]">{children}</p>;
}

export default function PlatformBreakdown({ analytics }) {
    const breakdown = analytics?.platformBreakdown || {};
    const platforms = Object.entries(breakdown).map(([name, data]) => {
        const eng = data.engagement || {};
        const totalEng = (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
        const rate = eng.views > 0 ? ((totalEng / eng.views) * 100).toFixed(1) : '0.0';
        return { name, data, eng, rate };
    });

    if (!platforms.length) {
        return (
            <div className="dash-card rounded-xl border border-[var(--viralix-border)] p-6 text-center text-sm text-[var(--viralix-muted)] shadow-sm">
                Connect platforms to see breakdown
            </div>
        );
    }

    return (
        <div className="dash-card overflow-hidden rounded-xl border border-[var(--viralix-border)]">
            <div className="border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-4 py-2.5 sm:px-5">
                <PanelLabel>By platform</PanelLabel>
            </div>
            <ul className="divide-y divide-[var(--viralix-border)]">
                {platforms.map(({ name, data, eng, rate }) => {
                    const cfg = PLATFORM_CONFIG[name];
                    const Icon = cfg?.icon;
                    return (
                        <li key={name} className="px-4 py-3 transition-colors hover:bg-[var(--viralix-bg)] sm:px-5">
                            <div className="flex items-center gap-3">
                                {cfg && Icon && (
                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: cfg.bg }}
                                    >
                                        <Icon className="h-4 w-4" style={{ color: cfg.color }} aria-hidden />
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold capitalize text-[var(--viralix-accent)]">{name}</p>
                                    <p className="text-xs text-[var(--viralix-muted)]">
                                        {data.published || 0} live · {data.scheduled || 0} scheduled
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold tabular-nums text-[var(--viralix-accent)]">{rate}%</p>
                                    <p className="text-[0.625rem] text-[#94A3B8]">eng. rate</p>
                                </div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                {[
                                    { label: 'Views', value: eng.views },
                                    { label: 'Likes', value: eng.likes },
                                    { label: 'Comments', value: eng.comments },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-lg bg-[var(--viralix-inset)] px-2 py-1.5">
                                        <p className="text-xs font-semibold tabular-nums text-[var(--viralix-accent)]">{formatNumber(value || 0)}</p>
                                        <p className="text-[0.5625rem] uppercase text-[#94A3B8]">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
