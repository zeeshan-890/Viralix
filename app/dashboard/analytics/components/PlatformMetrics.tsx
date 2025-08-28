export default function PlatformMetrics() {
    const platforms = [
        {
            name: 'TikTok',
            icon: '🎵',
            followers: '25.4K',
            engagement: '12.8%',
            posts: 45,
            views: '850K',
            growth: '+25%',
            color: 'bg-black text-white'
        },
        {
            name: 'YouTube',
            icon: '📺',
            followers: '12.1K',
            engagement: '6.2%',
            posts: 12,
            views: '420K',
            growth: '+18%',
            color: 'bg-red-600 text-white'
        },
        {
            name: 'Instagram',
            icon: '📷',
            followers: '8.7K',
            engagement: '9.4%',
            posts: 32,
            views: '180K',
            growth: '+15%',
            color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        },
        {
            name: 'LinkedIn',
            icon: '💼',
            followers: '3.2K',
            engagement: '5.1%',
            posts: 18,
            views: '45K',
            growth: '+12%',
            color: 'bg-blue-600 text-white'
        }
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>

                <div className="space-y-4">
                    {platforms.map((platform) => (
                        <div key={platform.name} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-xl`}>
                                {platform.icon}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{platform.name}</h4>
                                    <span className="text-sm font-medium text-green-600">{platform.growth}</span>
                                </div>

                                <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">Followers</div>
                                        <div className="font-medium">{platform.followers}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Engagement</div>
                                        <div className="font-medium">{platform.engagement}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Posts</div>
                                        <div className="font-medium">{platform.posts}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Views</div>
                                        <div className="font-medium">{platform.views}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Demographics</h3>

                {/* Age Groups */}
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Age Groups</h4>
                    <div className="space-y-2">
                        {[
                            { range: '18-24', percentage: 35, color: 'bg-blue-500' },
                            { range: '25-34', percentage: 42, color: 'bg-green-500' },
                            { range: '35-44', percentage: 15, color: 'bg-yellow-500' },
                            { range: '45+', percentage: 8, color: 'bg-red-500' }
                        ].map((group) => (
                            <div key={group.range} className="flex items-center">
                                <div className="w-16 text-sm text-gray-600">{group.range}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mx-3">
                                    <div
                                        className={`${group.color} h-2 rounded-full`}
                                        style={{ width: `${group.percentage}%` }}
                                    />
                                </div>
                                <div className="w-10 text-sm font-medium text-gray-900">{group.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gender */}
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Gender</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl mb-1">👨</div>
                            <div className="text-lg font-bold text-blue-700">45%</div>
                            <div className="text-sm text-blue-600">Male</div>
                        </div>
                        <div className="text-center p-4 bg-pink-50 rounded-lg">
                            <div className="text-2xl mb-1">👩</div>
                            <div className="text-lg font-bold text-pink-700">55%</div>
                            <div className="text-sm text-pink-600">Female</div>
                        </div>
                    </div>
                </div>

                {/* Top Locations */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Top Locations</h4>
                    <div className="space-y-2">
                        {[
                            { country: 'United States', percentage: 40, flag: '🇺🇸' },
                            { country: 'United Kingdom', percentage: 25, flag: '🇬🇧' },
                            { country: 'Canada', percentage: 15, flag: '🇨🇦' },
                            { country: 'Australia', percentage: 12, flag: '🇦🇺' },
                            { country: 'Germany', percentage: 8, flag: '🇩🇪' }
                        ].map((location) => (
                            <div key={location.country} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">{location.flag}</span>
                                    <span className="text-sm text-gray-700">{location.country}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{location.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
