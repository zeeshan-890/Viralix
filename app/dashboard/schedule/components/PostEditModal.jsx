'use client';
import { useState } from 'react';
export default function PostEditModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    // This would typically be controlled by props or context
    const openModal = (post) => {
        setSelectedPost(post);
        setIsOpen(true);
    };
    const closeModal = () => {
        setIsOpen(false);
        setSelectedPost(null);
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeModal}/>

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Scheduled Post</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Post Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Post Preview</h3>
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                🎥
                            </div>
                            <div>
                                <p className="font-medium">Morning Motivation Video</p>
                                <p className="text-sm text-gray-600">Video • 2.4 MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>
                        <input type="text" defaultValue="Morning Motivation Video" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Caption
                        </label>
                        <textarea rows={4} defaultValue="Start your day with positive energy! 🌅 Here are 3 simple tips to boost your morning motivation... #motivation #morningvibes #productivity" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>

                    {/* Platforms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platforms
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
            { id: 'tiktok', name: 'TikTok', icon: '🎵', selected: true },
            { id: 'youtube', name: 'YouTube', icon: '📺', selected: false },
            { id: 'instagram', name: 'Instagram', icon: '📷', selected: true },
            { id: 'linkedin', name: 'LinkedIn', icon: '💼', selected: false },
        ].map((platform) => (<label key={platform.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="checkbox" defaultChecked={platform.selected} className="rounded"/>
                                    <span>{platform.icon}</span>
                                    <span className="font-medium">{platform.name}</span>
                                </label>))}
                        </div>
                    </div>

                    {/* Schedule Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input type="date" defaultValue="2024-01-15" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time
                            </label>
                            <input type="time" defaultValue="09:00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="scheduled">Scheduled</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                    <button onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Delete Post
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>);
}
