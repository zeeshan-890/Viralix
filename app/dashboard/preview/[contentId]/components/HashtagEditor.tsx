'use client'

import { useState } from 'react'

export default function HashtagEditor() {
    const [hashtags, setHashtags] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')

    const trendingHashtags = [
        { tag: 'viral', popularity: 95 },
        { tag: 'trending', popularity: 89 },
        { tag: 'fyp', popularity: 92 },
        { tag: 'contentcreator', popularity: 87 },
        { tag: 'socialmedia', popularity: 85 },
        { tag: 'marketing', popularity: 83 },
        { tag: 'business', popularity: 80 },
        { tag: 'entrepreneur', popularity: 78 }
    ]

    const addHashtag = (tag: string) => {
        const cleanTag = tag.replace('#', '').trim()
        if (cleanTag && !hashtags.includes(cleanTag) && hashtags.length < 30) {
            setHashtags([...hashtags, cleanTag])
            setInputValue('')
        }
    }

    const removeHashtag = (tagToRemove: string) => {
        setHashtags(hashtags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            addHashtag(inputValue)
        } else if (e.key === 'Backspace' && !inputValue && hashtags.length > 0) {
            removeHashtag(hashtags[hashtags.length - 1])
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Hashtag Editor</h3>

            {/* Current Hashtags */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Hashtags ({hashtags.length}/30)
                </label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 border border-gray-300 rounded-lg">
                    {hashtags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                            #{tag}
                            <button
                                onClick={() => removeHashtag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={hashtags.length === 0 ? "Type hashtags..." : ""}
                        className="flex-1 min-w-[100px] outline-none"
                    />
                </div>
            </div>

            {/* AI Hashtag Suggestions */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                        AI Suggested Hashtags
                    </label>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                        ✨ Generate More
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {trendingHashtags
                        .filter(item => !hashtags.includes(item.tag))
                        .slice(0, 6)
                        .map((item) => (
                            <button
                                key={item.tag}
                                onClick={() => addHashtag(item.tag)}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                            >
                                <span>#{item.tag}</span>
                                <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${item.popularity > 90 ? 'bg-green-500' :
                                            item.popularity > 80 ? 'bg-yellow-500' : 'bg-gray-400'
                                        }`}></div>
                                    <span className="text-xs text-gray-600">{item.popularity}%</span>
                                </div>
                            </button>
                        ))}
                </div>
            </div>

            {/* Hashtag Analytics */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                    Hashtag Performance
                </label>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">8</div>
                        <div className="text-xs text-green-600">High Reach</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-700">4</div>
                        <div className="text-xs text-yellow-600">Medium Reach</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-700">2</div>
                        <div className="text-xs text-red-600">Low Competition</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
