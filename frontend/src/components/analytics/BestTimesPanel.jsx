'use client';

import { useEffect, useState } from 'react';
import { analyticsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Clock, Loader2 } from 'lucide-react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PanelLabel({ children }) {
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">{children}</p>;
}

export default function BestTimesPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await analyticsAPI.getBestTimes({ days: 90 });
                setData(res.data);
            } catch {
                setData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const maxHeat = (() => {
        if (!data?.heatmap) return 1;
        let max = 0;
        Object.values(data.heatmap).forEach((hours) => {
            Object.values(hours).forEach((v) => { if (v > max) max = v; });
        });
        return max || 1;
    })();

    const heatColor = (val) => {
        const intensity = val / maxHeat;
        if (intensity < 0.25) return 'bg-[#84A98C]/15';
        if (intensity < 0.5) return 'bg-[#84A98C]/35';
        if (intensity < 0.75) return 'bg-[#84A98C]/60';
        return 'bg-[#52796F]';
    };

    return (
        <div className="overflow-hidden rounded-xl border border-[#B8C9C0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8EDEA] bg-[#FAFCFB] px-4 py-2.5 sm:px-5">
                <PanelLabel>Best times to post</PanelLabel>
                <Clock className="h-4 w-4 text-[#84A98C]" aria-hidden />
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#52796F]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading…
                </div>
            ) : !data?.topSlots?.length ? (
                <p className="py-12 text-center text-sm text-[#52796F]">Publish more to unlock timing insights</p>
            ) : (
                <div className="p-4 sm:p-5">
                    <div className="mb-4 grid grid-cols-1 gap-2">
                        {data.topSlots.slice(0, 3).map((slot, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex items-center justify-between rounded-lg px-3 py-2.5',
                                    i === 0 ? 'bg-[#84A98C]/15 ring-1 ring-[#84A98C]/30' : 'bg-[#F4F8F6]'
                                )}
                            >
                                <div>
                                    <p className="text-xs font-semibold text-[#354F52]">{slot.dayName}</p>
                                    <p className="text-[0.625rem] text-[#52796F]">{slot.totalPosts} posts analyzed</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-[#354F52]">{slot.timeLabel}</p>
                                    <p className="text-[0.625rem] text-emerald-700">{slot.avgEngagement}% avg</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mb-2 text-[0.625rem] font-medium uppercase tracking-wide text-[#94A3B8]">Engagement heatmap</p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[280px]">
                            <tbody>
                                {DAY_LABELS.map((day, di) => (
                                    <tr key={day}>
                                        <td className="w-8 pr-1 text-[0.625rem] font-medium text-[#52796F]">{day}</td>
                                        {Array.from({ length: 24 }, (_, h) => {
                                            const val = data.heatmap?.[di]?.[h] ?? data.heatmap?.[String(di)]?.[h] ?? 0;
                                            return (
                                                <td key={h} className="p-px">
                                                    <div
                                                        className={cn('h-3 w-full min-w-[6px] rounded-sm', heatColor(val))}
                                                        title={`${day} ${h}:00 — ${val}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
