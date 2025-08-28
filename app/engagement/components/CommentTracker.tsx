'use client'

import { useState } from 'react'

interface Comment {
    id: string
    platform: 'tiktok' | 'youtube' | 'instagram' | 'linkedin'
    author: string
    content: string
    timestamp: string
    postTitle: string
    sentiment: 'positive' | 'negative' | 'neutral'
    replied: boolean
}

export default function CommentTracker() {
    const [filter, setFilter] = useState('all')
    const [selectedPlatform, setSelectedPlatform] = useState('all')

    const comments: Comment[] = [
        {
            id: '1',
            platform: 'tiktok',
            author: 'user123',
            content: 'This is amazing! Love the content 🔥',
            timestamp: '2 min ago',
            postTitle: 'Morning Motivation Tips',
            sentiment: 'positive',
            replied: false
        },
        {
            id: '2',
            platform: 'youtube',
            author: 'viewer456',
            content: 'Could you make a tutorial on this topic?',
            timestamp: '5 min ago',
            postTitle: 'Productivity Hacks',
            sentiment: 'neutral',
            replied: false
        },
        {
            id: '3',
            platform: 'instagram',
            author: 'follower789',
            content: 'Not sure about this approach...',
            timestamp: '10 min ago',
            postTitle: 'Behind the Scenes',
            sentiment: 'negative',
            replied: false
        },
        {
            id: '4',
            platform: 'linkedin',
            author: 'professional01',
            content: 'Great insights! Thanks for sharing.',
            timestamp: '15 min ago',
            postTitle: 'Industry Insights',
            sentiment: 'positive',
            replied: true
        }
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

    const getSentimentColor = (sentiment: string) => {
        const colors = {
            positive: 'text-green-600 bg-green-50',
            negative: 'text-red-600 bg-red-50',
            neutral: 'text-gray-600 bg-gray-50'
        }
        return colors[sentiment as keyof typeof colors]
    }

    const filteredComments = comments.filter(comment => {
        if (filter !== 'all' && (filter === 'unread' ? comment.replied : !comment.replied)) return false
        if (selectedPlatform !== 'all' && comment.platform !== selectedPlatform) return false
        return true
    })

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Comments</h3>

                <div className="flex space-x-3">
                    <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="all">All Platforms</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram</option>
                        <option value="linkedin">LinkedIn</option>
                    </select>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="all">All Comments</option>
                        <option value="unread">Unread</option>
                        <option value="replied">Replied</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredComments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                {getPlatformIcon(comment.platform)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900">@{comment.author}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(comment.sentiment)}`}>
                                        {comment.sentiment}
                                    </span>
                                    <span className="text-sm text-gray-500">{comment.timestamp}</span>
                                </div>

                                <p className="text-gray-700 mb-2">{comment.content}</p>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">on "{comment.postTitle}"</span>

                                    <div className="flex space-x-2">
                                        {!comment.replied && (
                                            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                                Reply
                                            </button>
                                        )}
                                        <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                                            View Post
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredComments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No comments found for the selected filters.</p>
                </div>
            )}
        </div>
    )
}
