'use client';
import { useState } from 'react';
export default function CaptionEditor() {
    const [caption, setCaption] = useState('');
    const [platform, setPlatform] = useState('tiktok');
    const platformLimits = {
        tiktok: 300,
        youtube: 5000,
        instagram: 2200,
        linkedin: 3000
    };
    const currentLimit = platformLimits[platform];
    const remainingChars = currentLimit - caption.length;
    const aiSuggestions = [
        "🚀 Ready to transform your content strategy? Here's what you need to know...",
        "💡 Pro tip: The secret to viral content isn't what you think it is...",
        "🎯 Want to 10x your engagement? Try this simple trick...",
        "🔥 This is the game-changer your brand has been waiting for..."
    ];
    return (<div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Caption Editor</h3>

            {/* Platform Selector */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optimize for Platform
                </label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                </select>
            </div>

            {/* Caption Textarea */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                </label>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} placeholder="Write your caption here..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"/>
                <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${remainingChars < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {remainingChars} characters remaining
                    </span>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                        ✨ AI Optimize
                    </button>
                </div>
            </div>

            {/* AI Suggestions */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Suggestions
                </label>
                <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (<button key={index} onClick={() => setCaption(suggestion)} className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                            {suggestion}
                        </button>))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors">
                    Add Emoji
                </button>
                <button className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors">
                    Add CTA
                </button>
                <button className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors">
                    Add Question
                </button>
            </div>
        </div>);
}
