'use client';
import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/lib/api';

export default function BestTimesToPost() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [platform, setPlatform] = useState('');
    const [days, setDays] = useState(90);

    useEffect(() => {
        loadBestTimes();
    }, [platform, days]);

    const loadBestTimes = async () => {
        setLoading(true);
        try {
            const params = { days };
            if (platform) params.platform = platform;
            const res = await analyticsAPI.getBestTimes(params);
            setData(res.data);
        } catch (err) {
            console.error('Best times error:', err);
        } finally {
            setLoading(false);
        }
    };

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Get max engagement for color scaling 
    const getMaxEngagement = () => {
        if (!data?.heatmap) return 1;
        let max = 0;
        Object.values(data.heatmap).forEach(hours => {
            Object.values(hours).forEach(v => { if (v > max) max = v; });
        });
        return max || 1;
    };

    const getHeatColor = (value) => {
        const max = getMaxEngagement();
        const intensity = value / max;
        if (intensity === 0) return 'bg-gray-50';
        if (intensity < 0.25) return 'bg-green-100';
        if (intensity < 0.5) return 'bg-green-200';
        if (intensity < 0.75) return 'bg-green-400';
        return 'bg-green-600';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        ⏰ Best Time to Post
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Analyzed from {data?.totalAnalyzedPosts || 0} posts over the last {days} days
                    </p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="text-sm border rounded-lg px-3 py-1.5 bg-white"
                    >
                        <option value="">All Platforms</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                    </select>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="text-sm border rounded-lg px-3 py-1.5 bg-white"
                    >
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                        <option value={180}>180 days</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
            ) : !data?.topSlots?.length ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <span className="text-3xl mb-2">📊</span>
                    <p>Not enough published post data yet.</p>
                    <p className="text-xs mt-1">Keep publishing to unlock insights!</p>
                </div>
            ) : (
                <>
                    {/* Top Time Slots */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">🏆 Top Time Slots</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {data.topSlots.map((slot, i) => (
                                <div key={i} className={`p-3 rounded-lg border ${i === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                        <span className="text-sm font-semibold text-gray-900">{slot.dayName}</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">{slot.timeLabel}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Avg. {slot.avgEngagement} engagement · {slot.totalPosts} posts
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Engagement Heatmap */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">🗓️ Engagement Heatmap</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr>
                                        <th className="w-16 text-left text-gray-500 font-normal py-1"></th>
                                        {Array.from({ length: 24 }, (_, h) => (
                                            <th key={h} className="text-center text-gray-400 font-normal py-1 px-0.5">
                                                {h % 3 === 0 ? `${h}` : ''}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayNames.map((day, di) => (
                                        <tr key={day}>
                                            <td className="text-gray-600 font-medium py-0.5 pr-2">{dayLabels[di]}</td>
                                            {Array.from({ length: 24 }, (_, h) => {
                                                const val = data.heatmap?.[day]?.[h] || 0;
                                                return (
                                                    <td key={h} className="px-0.5 py-0.5">
                                                        <div
                                                            className={`w-full h-5 rounded-sm ${getHeatColor(val)} cursor-pointer`}
                                                            title={`${day} ${h}:00 — Avg engagement: ${val.toFixed(1)}`}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 justify-end">
                                <span>Less</span>
                                <div className="w-4 h-3 bg-gray-50 rounded-sm border" />
                                <div className="w-4 h-3 bg-green-100 rounded-sm" />
                                <div className="w-4 h-3 bg-green-200 rounded-sm" />
                                <div className="w-4 h-3 bg-green-400 rounded-sm" />
                                <div className="w-4 h-3 bg-green-600 rounded-sm" />
                                <span>More</span>
                            </div>
                        </div>
                    </div>

                    {/* Per-Platform Best Times */}
                    {data.platformBreakdown && Object.keys(data.platformBreakdown).length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">📱 Per-Platform Best Slot</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(data.platformBreakdown).map(([p, info]) => (
                                    <div key={p} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                        <p className="text-sm font-medium text-gray-900 capitalize">{p}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Best: {info.topDay} at {info.topHour}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Avg engagement: {info.bestEngagement}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
