'use client'

import { useState, KeyboardEvent } from 'react'

export default function TagsInput() {
    const [tags, setTags] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag])
            setInputValue('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(inputValue)
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1])
        }
    }

    const suggestedTags = [
        'viral', 'trending', 'education', 'entertainment', 'lifestyle',
        'technology', 'business', 'motivation', 'tutorial', 'review'
    ]

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
            </label>

            {/* Tags Display */}
            <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                        #{tag}
                        <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            {/* Input */}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type tags and press Enter..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Suggested Tags */}
            <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                    {suggestedTags
                        .filter(tag => !tags.includes(tag))
                        .slice(0, 5)
                        .map((tag) => (
                            <button
                                key={tag}
                                onClick={() => addTag(tag)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    )
}
