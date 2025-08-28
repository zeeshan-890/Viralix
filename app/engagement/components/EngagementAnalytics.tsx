export default function EngagementAnalytics() {
    const stats = [
        { label: 'Response Rate', value: '94%', change: '+12%', positive: true },
        { label: 'Avg Response Time', value: '2.3h', change: '-0.5h', positive: true },
        { label: 'Engagement Score', value: '8.7/10', change: '+0.3', positive: true },
        { label: 'Unread Messages', value: '23', change: '+5', positive: false }
    ]

    const recentActivity = [
        { action: 'Replied to comment', platform: 'tiktok', time: '5 min ago' },
        { action: 'Marked mention as read', platform: 'instagram', time: '12 min ago' },
        { action: 'Sent DM response', platform: 'linkedin', time: '25 min ago' },
        { action: 'Tagged in story', platform: 'instagram', time: '1 hour ago' }
    ]

    const getPlatformIcon = (platform: string) => {
        const icons = {
            tiktok: '🎵',
            youtube: '📺',
            instagram: '📷',
            linkedin: '💼'
        }
        return icons[platform as keyof typeof icons]
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Stats</h3>

            <div className="space-y-4 mb-6">
                {stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{stat.label}</span>
                        <div className="text-right">
                            <div className="font-semibold text-gray-900">{stat.value}</div>
                            <div className={`text-xs ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                    {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 text-sm">
                            <span className="text-lg">{getPlatformIcon(activity.platform)}</span>
                            <span className="flex-1 text-gray-700">{activity.action}</span>
                            <span className="text-gray-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Full Report
            </button>
        </div>
    )
}
