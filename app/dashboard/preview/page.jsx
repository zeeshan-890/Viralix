export default function PreviewPage() {
    return (<div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Content Preview</h1>
                <p className="text-gray-600">Preview your content before publishing across platforms.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Content</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((item) => (<div key={item} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">🎬</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">Video Content {item}</h4>
                                        <p className="text-sm text-gray-600">Created 2 hours ago</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                Ready
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                3 platforms
                                            </span>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Preview
                                    </button>
                                </div>))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">📤</span>
                                    <div>
                                        <div className="font-medium text-blue-900">Upload New</div>
                                        <div className="text-sm text-blue-700">Add content to preview</div>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">📝</span>
                                    <div>
                                        <div className="font-medium text-green-900">Edit Draft</div>
                                        <div className="text-sm text-green-700">Modify existing content</div>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">🎯</span>
                                    <div>
                                        <div className="font-medium text-purple-900">AI Optimize</div>
                                        <div className="text-sm text-purple-700">Enhance with AI</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">🎵</span>
                                    <span className="text-sm">TikTok</span>
                                </div>
                                <input type="checkbox" checked className="rounded" readOnly/>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">📺</span>
                                    <span className="text-sm">YouTube</span>
                                </div>
                                <input type="checkbox" checked className="rounded" readOnly/>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">📷</span>
                                    <span className="text-sm">Instagram</span>
                                </div>
                                <input type="checkbox" className="rounded" readOnly/>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">💼</span>
                                    <span className="text-sm">LinkedIn</span>
                                </div>
                                <input type="checkbox" className="rounded" readOnly/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>);
}
