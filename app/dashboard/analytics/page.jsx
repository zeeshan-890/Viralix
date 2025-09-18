import AnalyticsCharts from './components/AnalyticsCharts';
import PlatformMetrics from './components/PlatformMetrics';
import ContentPerformance from './components/ContentPerformance';
export default function AnalyticsPage() {
    return (<div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Track your content performance across all platforms.</p>
            </div>

            <div className="space-y-8">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Views</p>
                                <p className="text-2xl font-bold text-gray-900">2.4M</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-full">
                                <span className="text-xl">👁️</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <span className="text-sm font-medium text-green-600">+12%</span>
                            <span className="text-sm text-gray-600 ml-2">from last month</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Engagement</p>
                                <p className="text-2xl font-bold text-gray-900">8.2%</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-full">
                                <span className="text-xl">❤️</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <span className="text-sm font-medium text-green-600">+5%</span>
                            <span className="text-sm text-gray-600 ml-2">from last month</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Followers</p>
                                <p className="text-2xl font-bold text-gray-900">45.2K</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-full">
                                <span className="text-xl">👥</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <span className="text-sm font-medium text-green-600">+18%</span>
                            <span className="text-sm text-gray-600 ml-2">from last month</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Posts</p>
                                <p className="text-2xl font-bold text-gray-900">24</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-full">
                                <span className="text-xl">📝</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <span className="text-sm font-medium text-red-600">-3%</span>
                            <span className="text-sm text-gray-600 ml-2">from last month</span>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <AnalyticsCharts />

                {/* Platform Metrics */}
                <PlatformMetrics />

                {/* Content Performance */}
                <ContentPerformance />
            </div>
        </div>);
}
