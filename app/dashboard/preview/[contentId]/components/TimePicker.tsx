'use client'

import { useState } from 'react'

export default function TimePicker() {
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedTime, setSelectedTime] = useState('')
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [scheduleType, setScheduleType] = useState('now') // 'now', 'later', 'optimal'

    const platforms = [
        { id: 'tiktok', name: 'TikTok', icon: '🎵' },
        { id: 'youtube', name: 'YouTube', icon: '📺' },
        { id: 'instagram', name: 'Instagram', icon: '📷' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    ]

    const optimalTimes = [
        { platform: 'TikTok', time: 'Tue 3:00 PM', engagement: '92%' },
        { platform: 'Instagram', time: 'Wed 11:00 AM', engagement: '88%' },
        { platform: 'YouTube', time: 'Thu 7:00 PM', engagement: '85%' },
        { platform: 'LinkedIn', time: 'Tue 9:00 AM', engagement: '90%' },
    ]

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(id => id !== platformId)
                : [...prev, platformId]
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule Settings</h3>

            {/* Schedule Type */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    When to Post
                </label>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="scheduleType"
                            value="now"
                            checked={scheduleType === 'now'}
                            onChange={(e) => setScheduleType(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">Post Now</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="scheduleType"
                            value="later"
                            checked={scheduleType === 'later'}
                            onChange={(e) => setScheduleType(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">Schedule for Later</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="scheduleType"
                            value="optimal"
                            checked={scheduleType === 'optimal'}
                            onChange={(e) => setScheduleType(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">AI Optimal Time ✨</span>
                    </label>
                </div>
            </div>

            {/* Platform Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {platforms.map((platform) => (
                        <button
                            key={platform.id}
                            onClick={() => togglePlatform(platform.id)}
                            className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${selectedPlatforms.includes(platform.id)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <span>{platform.icon}</span>
                            <span className="text-sm font-medium">{platform.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Date and Time Selection */}
            {scheduleType === 'later' && (
                <div className="mb-4 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time
                        </label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )}

            {/* Optimal Times Display */}
            {scheduleType === 'optimal' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Recommended Times
                    </label>
                    <div className="space-y-2">
                        {optimalTimes
                            .filter(time => selectedPlatforms.includes(time.platform.toLowerCase()))
                            .map((time, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-green-900">{time.platform}</div>
                                        <div className="text-sm text-green-700">{time.time}</div>
                                    </div>
                                    <div className="text-sm font-medium text-green-800">
                                        {time.engagement} engagement
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Timezone Display */}
            <div className="text-xs text-gray-600 mb-4">
                Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>

            {/* Preview Schedule */}
            {(scheduleType === 'later' || scheduleType === 'optimal') && selectedPlatforms.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">Schedule Summary</div>
                    <div className="text-sm text-blue-700">
                        {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
                        {scheduleType === 'later' && selectedDate && selectedTime && (
                            <div>Scheduled for {selectedDate} at {selectedTime}</div>
                        )}
                        {scheduleType === 'optimal' && (
                            <div>Using AI optimal times for maximum engagement</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
