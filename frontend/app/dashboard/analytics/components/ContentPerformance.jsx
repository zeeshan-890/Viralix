'use client';

import PlatformIcon from '@/components/ui/PlatformIcon';
import { getPlatform } from '@/config/platforms';

function PlatformIconCell({ platform, size = 16 }) {
    if (!getPlatform(platform)) return <span className="text-sm">📱</span>;
    return <PlatformIcon platform={platform} size={size} className="inline-block" />;
}

export default function ContentPerformance({ analytics }) {
    const topContent = analytics?.topContent || [];

    const platformIcon = (platform) => <PlatformIconCell platform={platform} />;

    if (!topContent.length) {
        return (
            <div className="dash-card rounded-xl border border-[var(--viralix-border)] p-8 text-center text-gray-500">
                No content performance data yet
            </div>
        );
    }

    return (
        <div className="dash-card rounded-xl border border-[var(--viralix-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)]">
                <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Top Performing Content</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--viralix-bg)] text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Content</th>
                            <th className="px-6 py-3">Platform</th>
                            <th className="px-6 py-3 text-right">Views</th>
                            <th className="px-6 py-3 text-right">Engagement</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--viralix-border)]">
                        {topContent.map((item, i) => (
                            <tr key={i} className="hover:bg-[var(--viralix-bg)]">
                                <td className="px-6 py-4 font-medium text-[var(--viralix-accent)]">{item.title || 'Untitled'}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-2 capitalize">
                                        {platformIcon(item.platform)}
                                        {getPlatform(item.platform)?.label || item.platform}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right tabular-nums">{(item.views || 0).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right tabular-nums">{(item.engagement || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
