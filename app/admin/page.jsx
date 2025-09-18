export default function AdminDashboard() {
    return (<div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage users, monitor system performance, and oversee platform operations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Server Status</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">CPU Usage</span>
                            <span className="text-blue-600 font-medium">23%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Memory</span>
                            <span className="text-blue-600 font-medium">45%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Active Users</span>
                            <span className="text-blue-600 font-medium">1,234</span>
                        </div>
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">User Management</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Users</span>
                            <span className="text-blue-600 font-medium">2,847</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Active Today</span>
                            <span className="text-green-600 font-medium">1,234</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">New Signups</span>
                            <span className="text-blue-600 font-medium">23</span>
                        </div>
                        <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Manage Users
                        </button>
                    </div>
                </div>

                {/* Platform Status */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Platform Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="mr-2">🎵</span>
                                <span className="text-gray-600">TikTok API</span>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="mr-2">📺</span>
                                <span className="text-gray-600">YouTube API</span>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="mr-2">📷</span>
                                <span className="text-gray-600">Instagram API</span>
                            </div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="mr-2">💼</span>
                                <span className="text-gray-600">LinkedIn API</span>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🚨</span>
                            <div>
                                <div className="font-medium text-red-900">Emergency Stop</div>
                                <div className="text-sm text-red-700">Halt all posting activities</div>
                            </div>
                        </div>
                    </button>
                    <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">📊</span>
                            <div>
                                <div className="font-medium text-blue-900">Generate Report</div>
                                <div className="text-sm text-blue-700">System performance report</div>
                            </div>
                        </div>
                    </button>
                    <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🔧</span>
                            <div>
                                <div className="font-medium text-green-900">System Maintenance</div>
                                <div className="text-sm text-green-700">Schedule maintenance</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>);
}
