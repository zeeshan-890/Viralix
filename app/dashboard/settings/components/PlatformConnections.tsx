'use client'

import { useState } from 'react'

export default function PlatformConnections() {
    const [connections, setConnections] = useState([
        { platform: 'TikTok', connected: true, account: '@johndoe', icon: '🎵' },
        { platform: 'YouTube', connected: true, account: 'John Doe Channel', icon: '📺' },
        { platform: 'Instagram', connected: false, account: '', icon: '📷' },
        { platform: 'LinkedIn', connected: true, account: 'John Doe', icon: '💼' },
    ])

    const toggleConnection = (index: number) => {
        setConnections(prev =>
            prev.map((conn, i) =>
                i === index ? { ...conn, connected: !conn.connected } : conn
            )
        )
    }

    return (
        <div id="platforms" className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Connections</h3>

            <div className="space-y-4">
                {connections.map((connection, index) => (
                    <div key={connection.platform} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                                {connection.icon}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{connection.platform}</h4>
                                <p className="text-sm text-gray-600">
                                    {connection.connected
                                        ? `Connected as ${connection.account}`
                                        : 'Not connected'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {connection.connected && (
                                <>
                                    <button className="text-sm text-blue-600 hover:text-blue-800">
                                        Manage
                                    </button>
                                    <button className="text-sm text-red-600 hover:text-red-800">
                                        Disconnect
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => toggleConnection(index)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${connection.connected
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {connection.connected ? 'Connected' : 'Connect'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Connection Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How to Connect Platforms</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Click "Connect" next to any platform</li>
                    <li>• You&apos;ll be redirected to authorize AutoReach AI</li>
                    <li>• Once connected, you can schedule posts to that platform</li>
                    <li>• You can disconnect anytime from this page</li>
                </ul>
            </div>

            {/* API Settings */}
            <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">API Settings</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                        </label>
                        <div className="flex">
                            <input
                                type="password"
                                value="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                            />
                            <button className="px-4 py-2 bg-gray-600 text-white rounded-r-lg hover:bg-gray-700 transition-colors">
                                Copy
                            </button>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Generate New Key
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            View Documentation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
