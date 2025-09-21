export default function PlatformMetrics({ analytics }) {
    const platformBreakdown = analytics?.platformBreakdown || {};

    const platforms = Object.keys(platformBreakdown).map(platformName => {
        const data = platformBreakdown[platformName];
        const engagement = data.engagement || {};
        const totalEngagement = (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0);
        const engagementRate = engagement.views > 0 ? ((totalEngagement / engagement.views) * 100).toFixed(1) : '0.0';

        const platformConfig = {
            facebook: { icon: '💻', color: 'bg-blue-600 text-white' },
            instagram: { icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
            twitter: { icon: '🐦', color: 'bg-blue-400 text-white' },
            linkedin: { icon: '💼', color: 'bg-blue-700 text-white' },
            tiktok: { icon: '🎵', color: 'bg-black text-white' },
            youtube: { icon: '📺', color: 'bg-red-600 text-white' }
        };

        const config = platformConfig[platformName] || { icon: '📱', color: 'bg-gray-600 text-white' };

        return {
            name: platformName.charAt(0).toUpperCase() + platformName.slice(1),
            icon: config.icon,
            color: config.color,
            posts: data.posts || 0,
            published: data.published || 0,
            scheduled: data.scheduled || 0,
            failed: data.failed || 0,
            engagement: `${engagementRate}%`,
            views: engagement.views || 0,
            likes: engagement.likes || 0,
            comments: engagement.comments || 0,
            shares: engagement.shares || 0
        };
    });

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>

            {platforms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No platform data available</p>
                    <p className="text-sm">Connect platforms and publish posts to see metrics</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {platforms.map((platform) => (<div key={platform.name} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-xl`}>
                            {platform.icon}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{platform.name}</h4>
                                <div className="flex space-x-2 text-xs">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                        {platform.published} published
                                    </span>
                                    {platform.scheduled > 0 && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                            {platform.scheduled} scheduled
                                        </span>
                                    )}
                                    {platform.failed > 0 && (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                                            {platform.failed} failed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600">Posts</div>
                                    <div className="font-medium">{platform.posts}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Engagement</div>
                                    <div className="font-medium">{platform.engagement}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Views</div>
                                    <div className="font-medium">{formatNumber(platform.views)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Likes</div>
                                    <div className="font-medium">{formatNumber(platform.likes)}</div>
                                </div>
                            </div>
                        </div>
                    </div>))}
                </div>
            )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Status Overview</h3>

            {platforms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📈</div>
                    <p>No post data available</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Status Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl mb-1">✅</div>
                            <div className="text-lg font-bold text-green-700">
                                {platforms.reduce((sum, p) => sum + p.published, 0)}
                            </div>
                            <div className="text-sm text-green-600">Published</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl mb-1">📅</div>
                            <div className="text-lg font-bold text-blue-700">
                                {platforms.reduce((sum, p) => sum + p.scheduled, 0)}
                            </div>
                            <div className="text-sm text-blue-600">Scheduled</div>
                        </div>
                    </div>

                    {/* Platform Breakdown */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Platform Breakdown</h4>
                        {platforms.map(platform => (
                            <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{platform.icon}</span>
                                    <span className="font-medium">{platform.name}</span>
                                </div>
                                <div className="flex space-x-2 text-xs">
                                    <span className="px-2 py-1 bg-white rounded border">
                                        {platform.posts} total
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                        {platform.published} live
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>);
}
