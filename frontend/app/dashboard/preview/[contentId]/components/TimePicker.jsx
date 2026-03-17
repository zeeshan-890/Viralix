'use client';
import { useState, useEffect } from 'react';
import { facebookAPI, instagramAPI } from '@/lib/api';

// Helper to normalize platforms from the post into minimal shape { name, accountId }
function normalizePostPlatforms(platforms) {
    if (!Array.isArray(platforms)) return [];
    return platforms
        .filter(p => p && p.name && p.accountId)
        .map(p => ({ name: p.name, accountId: p.accountId }));
}

export default function TimePicker({ post, onChange }) {
    const [selectedDate, setSelectedDate] = useState(post?.scheduledDate || '');
    const [selectedTime, setSelectedTime] = useState(post?.scheduledTime || '');
    const [selectedPlatforms, setSelectedPlatforms] = useState(normalizePostPlatforms(post?.platforms));
    const [scheduleType, setScheduleType] = useState(post?.scheduleType || 'now');
    const [availableTargets, setAvailableTargets] = useState([]); // [{ key, name, accountId, label, icon }]
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [targetsError, setTargetsError] = useState('');

    useEffect(() => {
        if (!post) return; // Avoid running with undefined and causing loops

        // Only update local state if values actually changed
        const nextDate = post.scheduledDate || '';
        const nextTime = post.scheduledTime || '';
        const nextPlatforms = normalizePostPlatforms(post.platforms);
        const nextType = post.scheduleType || 'now';

        setSelectedDate(prev => (prev !== nextDate ? nextDate : prev));
        setSelectedTime(prev => (prev !== nextTime ? nextTime : prev));
        setSelectedPlatforms(prev => (JSON.stringify(prev) !== JSON.stringify(nextPlatforms) ? nextPlatforms : prev));
        setScheduleType(prev => (prev !== nextType ? nextType : prev));
    }, [post?.scheduledDate, post?.scheduledTime, post?.scheduleType, JSON.stringify(normalizePostPlatforms(post?.platforms))]);

    // Load connected accounts (Facebook pages and Instagram business accounts)
    useEffect(() => {
        let cancelled = false;
        async function loadTargets() {
            try {
                setLoadingTargets(true);
                setTargetsError('');
                const [fbRes, igRes] = await Promise.allSettled([
                    facebookAPI.status(),
                    instagramAPI.status(),
                ]);
                const targets = [];
                if (fbRes.status === 'fulfilled') {
                    const pages = fbRes.value?.data?.pages || [];
                    for (const p of pages) {
                        targets.push({
                            key: `facebook:${p.id}`,
                            name: 'facebook',
                            accountId: p.id,
                            label: `Facebook — ${p.name}`,
                            icon: '📘',
                        });
                    }
                }
                if (igRes.status === 'fulfilled') {
                    const accounts = igRes.value?.data?.accounts || [];
                    for (const a of accounts) {
                        targets.push({
                            key: `instagram:${a.igUserId}`,
                            name: 'instagram',
                            accountId: a.igUserId,
                            label: `Instagram — ${a.pageName || a.igUserId}`,
                            icon: '📷',
                        });
                    }
                }
                if (!cancelled) setAvailableTargets(targets);
            } catch (e) {
                if (!cancelled) setTargetsError('Failed to load connected accounts');
            } finally {
                if (!cancelled) setLoadingTargets(false);
            }
        }
        loadTargets();
        return () => {
            cancelled = true;
        };
    }, []);

    const computeScheduledIso = (date, time, type) => {
        if (type === 'later' && date && time) {
            try {
                const iso = new Date(`${date}T${time}:00`).toISOString();
                return iso;
            } catch {
                return null;
            }
        }
        return null;
    };

    const updateSchedule = (updates) => {
        if (!onChange) return;
        const next = {
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            platforms: selectedPlatforms,
            scheduleType,
            ...updates
        };
        // Compute scheduledDate (ISO) when scheduling for later
        const computed = computeScheduledIso(next.scheduledDate, next.scheduledTime, next.scheduleType);
        if (next.scheduleType === 'later') next.scheduledDate = computed;
        else next.scheduledDate = null;
        onChange(next);
    };
    // Optional future: real AI-recommended times; for now, simple placeholders by platform name
    const optimalTimes = [
        { platform: 'instagram', time: 'Wed 11:00 AM', engagement: '88%' },
        { platform: 'facebook', time: 'Wed 1:00 PM', engagement: '86%' },
    ];

    const isSelected = (t) => selectedPlatforms.some(p => p.name === t.name && p.accountId === t.accountId);
    const toggleTarget = (t) => {
        const exists = selectedPlatforms.some(p => p.name === t.name && p.accountId === t.accountId);
        const next = exists
            ? selectedPlatforms.filter(p => !(p.name === t.name && p.accountId === t.accountId))
            : [...selectedPlatforms, { name: t.name, accountId: t.accountId }];
        setSelectedPlatforms(next);
        updateSchedule({ platforms: next });
    };

    const handleScheduleTypeChange = (type) => {
        setScheduleType(type);
        updateSchedule({ scheduleType: type });
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        updateSchedule({ scheduledDate: date });
    };

    const handleTimeChange = (time) => {
        setSelectedTime(time);
        updateSchedule({ scheduledTime: time });
    };

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
                            onChange={(e) => handleScheduleTypeChange(e.target.value)}
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
                            onChange={(e) => handleScheduleTypeChange(e.target.value)}
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
                            onChange={(e) => handleScheduleTypeChange(e.target.value)}
                            className="mr-2"
                        />
                        <span className="text-sm">AI Optimal Time ✨</span>
                    </label>
                </div>
            </div>

            {/* Platform Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Platforms ({selectedPlatforms.length} selected)
                </label>
                {targetsError && (
                    <div className="mb-2 text-sm text-red-600">{targetsError}</div>
                )}
                {loadingTargets ? (
                    <div className="text-sm text-gray-500">Loading connected accounts...</div>
                ) : availableTargets.length === 0 ? (
                    <div className="text-sm text-gray-500">No connected Facebook pages or Instagram accounts found. Connect accounts in Settings.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {availableTargets.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => toggleTarget(t)}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected(t)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>{t.icon}</span>
                                    <span className="text-sm font-medium">{t.label}</span>
                                </div>
                                {isSelected(t) && <span className="text-xs">Selected</span>}
                            </button>
                        ))}
                    </div>
                )}
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
                            onChange={(e) => handleDateChange(e.target.value)}
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
                            onChange={(e) => handleTimeChange(e.target.value)}
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
                            .filter(time => selectedPlatforms.some(p => p.name === time.platform))
                            .map((time, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-green-900 capitalize">{time.platform}</div>
                                        <div className="text-sm text-green-700">{time.time}</div>
                                    </div>
                                    <div className="text-sm font-medium text-green-800">
                                        {time.engagement} engagement
                                    </div>
                                </div>
                            ))}
                        {selectedPlatforms.length > 0 && !optimalTimes.some(time => selectedPlatforms.some(p => p.name === time.platform)) && (
                            <div className="p-3 bg-gray-50 rounded-lg text-center text-gray-600">
                                No optimal time data available for selected platforms
                            </div>
                        )}
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

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-4">
                <button
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={selectedPlatforms.length === 0}
                    type="button"
                >
                    {scheduleType === 'now' ? 'Post Now' : 'Schedule Post'}
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" type="button">
                    Save Draft
                </button>
            </div>
        </div>
    );
}
