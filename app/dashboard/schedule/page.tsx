import CalendarView from './components/CalendarView'
import PostEditModal from './components/PostEditModal'

export default function SchedulePage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Content Schedule</h1>
                <p className="text-gray-600">Manage your scheduled posts and content calendar.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-3">
                    <CalendarView />
                </div>

                {/* Schedule Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">This Week</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Scheduled Posts</span>
                                <span className="font-semibold">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Published</span>
                                <span className="font-semibold text-green-600">8</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Drafts</span>
                                <span className="font-semibold text-yellow-600">4</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">➕</span>
                                    <div>
                                        <div className="font-medium text-blue-900">New Post</div>
                                        <div className="text-sm text-blue-700">Create new content</div>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">📋</span>
                                    <div>
                                        <div className="font-medium text-green-900">Bulk Schedule</div>
                                        <div className="text-sm text-green-700">Schedule multiple posts</div>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">🤖</span>
                                    <div>
                                        <div className="font-medium text-purple-900">AI Schedule</div>
                                        <div className="text-sm text-purple-700">Auto-optimize timing</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Platform Status</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">🎵</span>
                                    <span className="text-sm">TikTok</span>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">📺</span>
                                    <span className="text-sm">YouTube</span>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">📷</span>
                                    <span className="text-sm">Instagram</span>
                                </div>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">💼</span>
                                    <span className="text-sm">LinkedIn</span>
                                </div>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Modal Component */}
            <PostEditModal />
        </div>
    )
}
