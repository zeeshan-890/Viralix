import StatsCard from './dashboard/components/StatsCard'

export default function DashboardPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your content.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Views"
                    value="2.4M"
                    change={12}
                    icon="👁️"
                    color="blue"
                />
                <StatsCard
                    title="Engagement Rate"
                    value="4.8%"
                    change={8}
                    icon="❤️"
                    color="green"
                />
                <StatsCard
                    title="Posts This Month"
                    value="24"
                    change={-5}
                    icon="📝"
                    color="purple"
                />
                <StatsCard
                    title="Scheduled Posts"
                    value="12"
                    icon="📅"
                    color="blue"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📤</span>
                                <div>
                                    <div className="font-medium">Upload Content</div>
                                    <div className="text-sm text-gray-600">Add new videos or images</div>
                                </div>
                            </div>
                        </button>
                        <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📊</span>
                                <div>
                                    <div className="font-medium">View Analytics</div>
                                    <div className="text-sm text-gray-600">Check performance metrics</div>
                                </div>
                            </div>
                        </button>
                        <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📅</span>
                                <div>
                                    <div className="font-medium">Schedule Post</div>
                                    <div className="text-sm text-gray-600">Plan your content calendar</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start">
                                <span className="text-xl mr-2">💡</span>
                                <div>
                                    <div className="font-medium text-blue-900">Best Time to Post</div>
                                    <div className="text-sm text-blue-700">Your audience is most active on Tuesdays at 3 PM</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-start">
                                <span className="text-xl mr-2">📈</span>
                                <div>
                                    <div className="font-medium text-green-900">Trending Hashtag</div>
                                    <div className="text-sm text-green-700">#TechTips is performing 23% better this week</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-start">
                                <span className="text-xl mr-2">🎯</span>
                                <div>
                                    <div className="font-medium text-purple-900">Content Suggestion</div>
                                    <div className="text-sm text-purple-700">Try shorter videos for better TikTok engagement</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
