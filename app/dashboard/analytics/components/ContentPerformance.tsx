'use client'

import { useState } from 'react'

export default function ContentPerformance() {
    const [sortBy, setSortBy] = useState('views')
    const [filterPlatform, setFilterPlatform] = useState('all')

    const contentData = [
        {
            id: 1,
            title: 'Morning Motivation Tips',
            platform: 'tiktok',
            type: 'video',
            publishDate: '2024-01-15',
            views: 45200,
            likes: 3200,
            comments: 180,
            shares: 89,
            engagement: 7.8,
            thumbnail: '🎥'
        },
        {
            id: 2,
            title: 'Productivity Hacks for Entrepreneurs',
            platform: 'youtube',
            type: 'video',
            publishDate: '2024-01-14',
            views: 28900,
            likes: 1200,
            comments: 150,
            shares: 45,
            engagement: 4.8,
            thumbnail: '📺'
        },
        {
            id: 3,
            title: 'Behind the Scenes: Office Tour',
            platform: 'instagram',
            type: 'reel',
            publishDate: '2024-01-13',
            views: 15600,
            likes: 890,
            comments: 65,
            shares: 32,
            engagement: 6.3,
            thumbnail: '📷'
        },
        {
            id: 4,
            title: 'Industry Insights: Future of AI',
            platform: 'linkedin',
            type: 'post',
            publishDate: '2024-01-12',
            views: 8400,
            likes: 156,
            comments: 23,
            shares: 18,
            engagement: 2.3,
            thumbnail: '💼'
        },
        {
            id: 5,
            title: 'Quick Tutorial: Video Editing',
            platform: 'tiktok',
            type: 'video',
            publishDate: '2024-01-11',
            views: 52000,
            likes: 4100,
            comments: 220,
            shares: 156,
            engagement: 8.6,
            thumbnail: '🎥'
        }
    ]

    const platforms = [
        { value: 'all', label: 'All Platforms' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'linkedin', label: 'LinkedIn' }
    ]

    const sortOptions = [
        { value: 'views', label: 'Views' },
        { value: 'likes', label: 'Likes' },
        { value: 'engagement', label: 'Engagement' },
        { value: 'publishDate', label: 'Date' }
    ]

    const getPlatformIcon = (platform: string) => {
        const icons = {
            tiktok: '🎵',
            youtube: '📺',
            instagram: '📷',
            linkedin: '💼'
        }
        return icons[platform as keyof typeof icons] || '📱'
    }

    const getPlatformColor = (platform: string) => {
        const colors = {
            tiktok: 'bg-black text-white',
            youtube: 'bg-red-600 text-white',
            instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
            linkedin: 'bg-blue-600 text-white'
        }
        return colors[platform as keyof typeof colors] || 'bg-gray-500 text-white'
    }

    const filteredData = contentData
        .filter(item => filterPlatform === 'all' || item.platform === filterPlatform)
        .sort((a, b) => {
            if (sortBy === 'publishDate') {
                return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
            }
            return (b as any)[sortBy] - (a as any)[sortBy]
        })

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M'
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K'
        }
        return num.toString()
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Content Performance</h3>

                <div className="flex space-x-3">
                    {/* Platform Filter */}
                    <select
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {platforms.map(platform => (
                            <option key={platform.value} value={platform.value}>
                                {platform.label}
                            </option>
                        ))}
                    </select>

                    {/* Sort Options */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                Sort by {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-4">
                {filteredData.map((content) => (
                    <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                {content.thumbnail}
                            </div>

                            {/* Content Info */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{content.title}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getPlatformColor(content.platform)}`}>
                                        {getPlatformIcon(content.platform)} {content.platform}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {content.type} • Published {new Date(content.publishDate).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-5 gap-4 text-center">
                                <div>
                                    <div className="text-lg font-bold text-gray-900">{formatNumber(content.views)}</div>
                                    <div className="text-xs text-gray-600">Views</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-900">{formatNumber(content.likes)}</div>
                                    <div className="text-xs text-gray-600">Likes</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-900">{content.comments}</div>
                                    <div className="text-xs text-gray-600">Comments</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-900">{content.shares}</div>
                                    <div className="text-xs text-gray-600">Shares</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-green-600">{content.engagement}%</div>
                                    <div className="text-xs text-gray-600">Engagement</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                    📊
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                    📝
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                    🔗
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(filteredData.reduce((sum, item) => sum + item.views, 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Views</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(filteredData.reduce((sum, item) => sum + item.likes, 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Likes</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {(filteredData.reduce((sum, item) => sum + item.engagement, 0) / filteredData.length).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Engagement</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {filteredData.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Posts</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
