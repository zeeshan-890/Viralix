import PlatformBadge from '@/components/ui/PlatformBadge';
import { getPlatform } from '@/config/platforms';
import { cn } from '@/lib/utils';

export default function PlatformMetrics({ analytics }) {
    const platformBreakdown = analytics?.platformBreakdown || {};

    const platforms = Object.keys(platformBreakdown).map((platformName) => {
        const data = platformBreakdown[platformName];
        const engagement = data.engagement || {};
        const totalEngagement = (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0);
        const engagementRate = engagement.views > 0 ? ((totalEngagement / engagement.views) * 100).toFixed(1) : '0.0';
        const cfg = getPlatform(platformName);

        return {
            id: platformName,
            name: cfg?.label || platformName.charAt(0).toUpperCase() + platformName.slice(1),
            posts: data.posts || 0,
            published: data.published || 0,
            scheduled: data.scheduled || 0,
            failed: data.failed || 0,
            engagement: `${engagementRate}%`,
            views: engagement.views || 0,
            likes: engagement.likes || 0,
            comments: engagement.comments || 0,
            shares: engagement.shares || 0,
            cfg,
        };
    });

    if (platforms.length === 0) {
        return (
            <div className="dash-card rounded-xl border border-[var(--viralix-border)] p-8 text-center">
                <p className="text-gray-500">No platform data available yet</p>
                <p className="text-sm text-gray-400 mt-2">Connect accounts and publish content to see metrics</p>
            </div>
        );
    }

    return (
        <div className="dash-card rounded-xl border border-[var(--viralix-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)]">
                <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Platform Performance</h3>
                <p className="text-sm text-gray-600">Engagement breakdown by platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {platforms.map((platform) => (
                    <div
                        key={platform.id}
                        className={cn(
                            'rounded-xl border p-5 transition-all hover:shadow-md',
                            platform.cfg?.selectedBorder || 'border-[var(--viralix-border)]',
                            platform.cfg?.lightBg || 'bg-[var(--viralix-surface)]'
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <PlatformBadge platform={platform.id} size="lg" />
                                <div>
                                    <h4 className="font-semibold" style={{ color: '#354F52' }}>{platform.name}</h4>
                                    <p className="text-sm text-gray-500">{platform.posts} total posts</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold" style={{ color: platform.cfg?.color || '#354F52' }}>
                                    {platform.engagement}
                                </p>
                                <p className="text-xs text-gray-500">engagement rate</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-lg font-semibold" style={{ color: '#354F52' }}>{platform.published}</p>
                                <p className="text-xs text-gray-500">Published</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-lg font-semibold text-blue-600">{platform.scheduled}</p>
                                <p className="text-xs text-gray-500">Scheduled</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-lg font-semibold text-red-600">{platform.failed}</p>
                                <p className="text-xs text-gray-500">Failed</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2">
                                <p className="text-lg font-semibold" style={{ color: '#354F52' }}>{platform.views.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Views</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/50 flex justify-between text-sm">
                            <span className="text-gray-600">❤️ {platform.likes.toLocaleString()} likes</span>
                            <span className="text-gray-600">💬 {platform.comments.toLocaleString()} comments</span>
                            <span className="text-gray-600">🔄 {platform.shares.toLocaleString()} shares</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
