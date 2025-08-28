'use client'

import { useState } from 'react'

interface PlatformTabsProps {
    contentId: string
}

export default function PlatformTabs({ contentId }: PlatformTabsProps) {
    const [activeTab, setActiveTab] = useState('tiktok')

    const platforms = [
        { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
        { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-600' },
        { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
    ]

    const renderPreview = () => {
        switch (activeTab) {
            case 'tiktok':
                return (
                    <div className="bg-black rounded-lg aspect-[9/16] max-w-sm mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white text-center">
                                <div className="text-6xl mb-4">🎥</div>
                                <p className="text-lg">TikTok Preview</p>
                                <p className="text-sm opacity-75">Content ID: {contentId}</p>
                            </div>
                        </div>
                        {/* TikTok UI Elements */}
                        <div className="absolute right-4 bottom-20 space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">❤️</div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">💬</div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">📤</div>
                        </div>
                    </div>
                )
            case 'youtube':
                return (
                    <div className="bg-black rounded-lg aspect-video relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white text-center">
                                <div className="text-6xl mb-4">▶️</div>
                                <p className="text-lg">YouTube Preview</p>
                                <p className="text-sm opacity-75">Content ID: {contentId}</p>
                            </div>
                        </div>
                    </div>
                )
            case 'instagram':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-md mx-auto">
                        {/* Instagram Header */}
                        <div className="flex items-center p-3 border-b border-gray-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="ml-2 font-semibold">your_account</span>
                        </div>
                        {/* Instagram Content */}
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📷</div>
                                <p className="text-lg">Instagram Preview</p>
                                <p className="text-sm text-gray-600">Content ID: {contentId}</p>
                            </div>
                        </div>
                        {/* Instagram Actions */}
                        <div className="p-3">
                            <div className="flex space-x-4 mb-2">
                                <span className="text-xl">❤️</span>
                                <span className="text-xl">💬</span>
                                <span className="text-xl">📤</span>
                            </div>
                            <p className="text-sm"><strong>your_account</strong> Caption will appear here...</p>
                        </div>
                    </div>
                )
            case 'linkedin':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-lg mx-auto">
                        {/* LinkedIn Header */}
                        <div className="flex items-center p-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                YN
                            </div>
                            <div className="ml-3">
                                <p className="font-semibold">Your Name</p>
                                <p className="text-sm text-gray-600">Professional Title</p>
                            </div>
                        </div>
                        {/* LinkedIn Content */}
                        <div className="p-4">
                            <p className="mb-4">Your LinkedIn post content will appear here...</p>
                            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">💼</div>
                                    <p className="text-lg">LinkedIn Preview</p>
                                    <p className="text-sm text-gray-600">Content ID: {contentId}</p>
                                </div>
                            </div>
                        </div>
                        {/* LinkedIn Actions */}
                        <div className="px-4 pb-4 flex justify-between border-t border-gray-200 pt-3">
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                                <span>👍</span><span>Like</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                                <span>💬</span><span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                                <span>📤</span><span>Share</span>
                            </button>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Preview</h3>

            {/* Platform Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                {platforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => setActiveTab(platform.id)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${activeTab === platform.id
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span>{platform.icon}</span>
                        <span className="font-medium">{platform.name}</span>
                    </button>
                ))}
            </div>

            {/* Preview Content */}
            <div className="min-h-[400px] flex items-center justify-center">
                {renderPreview()}
            </div>
        </div>
    )
}
