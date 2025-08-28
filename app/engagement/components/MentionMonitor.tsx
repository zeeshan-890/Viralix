'use client'

import { useState } from 'react'

interface Mention {
    id: string
    platform: 'tiktok' | 'youtube' | 'instagram' | 'linkedin'
    author: string
    content: string
    timestamp: string
    type: 'mention' | 'tag' | 'dm'
    read: boolean
}

export default function MentionMonitor() {
    const [filter, setFilter] = useState('all')

    const mentions: Mention[] = [
        {
            id: '1',
            platform: 'instagram',
            author: 'influencer_jane',
            content: 'Just saw @your_account amazing post about productivity! 🚀',
            timestamp: '1 hour ago',
            type: 'mention',
            read: false
        },
        {
            id: '2',
            platform: 'tiktok',
            author: 'creator_mike',
            content: 'Thanks for the inspiration @your_account! Made my own version',
            timestamp: '2 hours ago',
            type: 'mention',
            read: false
        },
        {
            id: '3',
            platform: 'linkedin',
            author: 'business_pro',
            content: 'Hey, loved your recent post. Could we collaborate?',
            timestamp: '3 hours ago',
            type: 'dm',
            read: true
        },
        {
            id: '4',
            platform: 'youtube',
            author: 'subscriber_alex',
            content: 'Can you check out my channel? @your_account',
            timestamp: '5 hours ago',
            type: 'mention',
            read: true
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

    const getTypeIcon = (type: string) => {
        const icons = {
            mention: '@',
            tag: '#',
            dm: '✉️'
        }
        return icons[type as keyof typeof icons]
    }

    const getTypeColor = (type: string) => {
        const colors = {
            mention: 'bg-blue-100 text-blue-800',
            tag: 'bg-green-100 text-green-800',
            dm: 'bg-purple-100 text-purple-800'
        }
        return colors[type as keyof typeof colors]
    }

    const filteredMentions = mentions.filter(mention => {
        if (filter !== 'all' && mention.type !== filter) return false
        return true
    })

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Mentions & Messages</h3>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                    <option value="all">All Types</option>
                    <option value="mention">Mentions</option>
                    <option value="tag">Tags</option>
                    <option value="dm">Direct Messages</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredMentions.map((mention) => (
                    <div key={mention.id} className={`border rounded-lg p-4 transition-colors ${mention.read ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
                        }`}>
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                {getPlatformIcon(mention.platform)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="font-medium text-gray-900">@{mention.author}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(mention.type)}`}>
                                        {getTypeIcon(mention.type)} {mention.type}
                                    </span>
                                    <span className="text-sm text-gray-500">{mention.timestamp}</span>
                                    {!mention.read && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                </div>

                                <p className="text-gray-700 mb-3">{mention.content}</p>

                                <div className="flex space-x-2">
                                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                        Respond
                                    </button>
                                    <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                                        View Profile
                                    </button>
                                    {!mention.read && (
                                        <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                                            Mark as Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMentions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>No mentions found for the selected filter.</p>
                </div>
            )}
        </div>
    )
}
