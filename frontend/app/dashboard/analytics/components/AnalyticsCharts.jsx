'use client';
import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/lib/api';
export default function AnalyticsCharts() {
    const [timeRange, setTimeRange] = useState('7d');
    const [activeChart, setActiveChart] = useState('views');
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        loadTimeline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);
    async function loadTimeline() {
        setLoading(true);
        setError('');
        try {
            const res = await analyticsAPI.getPerformance({ period: timeRange });
            setTimeline(res.data?.timeline || []);
        } catch (e) {
            setError('Failed to load timeline');
        } finally {
            setLoading(false);
        }
    }
    const timeRanges = [
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
        { value: '1y', label: '1 Year' },
    ];
    const chartTypes = [
        { value: 'views', label: 'Views', icon: '👁️' },
        { value: 'engagement', label: 'Engagement', icon: '❤️' },
        { value: 'followers', label: 'Followers', icon: '👥' },
        { value: 'reach', label: 'Reach', icon: '📊' },
    ];
    const maxValue = timeline.length > 0 ? Math.max(...timeline.map(d => d[activeChart] || 0)) : 0;
    return (<div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>

            {/* Time Range Selector */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {timeRanges.map((range) => (<button key={range.value} onClick={() => setTimeRange(range.value)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timeRange === range.value
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'}`}>
                    {range.label}
                </button>))}
            </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex space-x-4 mb-6">
            {chartTypes.map((chart) => (<button key={chart.value} onClick={() => setActiveChart(chart.value)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${activeChart === chart.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'}`}>
                <span>{chart.icon}</span>
                <span className="font-medium">{chart.label}</span>
            </button>))}
        </div>

        {/* Simple Chart Visualization */}
        <div className="relative">
            {loading ? (
                <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                    <div className="text-gray-500">Loading chart...</div>
                </div>
            ) : error ? (
                <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                    <div className="text-red-600 text-sm">{error}</div>
                </div>
            ) : (
                <>
                    <div className="flex items-end justify-between h-64 border-b border-gray-200">
                        {timeline.map((point, index) => (
                            <div key={`${point.date}-${index}`} className="flex flex-col items-center flex-1">
                                <div className="w-full max-w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" style={{
                                    height: `${maxValue > 0 ? ((point[activeChart] || 0) / maxValue) * 200 : 0}px`,
                                    minHeight: '4px'
                                }} title={`${point.date}: ${point[activeChart] || 0}`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>{timeline[0]?.date || ''}</span>
                        <span>{timeline[timeline.length - 1]?.date || ''}</span>
                    </div>
                </>
            )}
        </div>

        {/* Chart Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                    {timeline.length > 0 ? timeline.reduce((sum, d) => sum + (d[activeChart] || 0), 0).toLocaleString() : '---'}
                </div>
                <div className="text-sm text-gray-600">Total {activeChart}</div>
            </div>
            <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                    {timeline.length > 0 ? Math.round(timeline.reduce((sum, d) => sum + (d[activeChart] || 0), 0) / timeline.length).toLocaleString() : '---'}
                </div>
                <div className="text-sm text-gray-600">Average</div>
            </div>
            <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                    {(() => {
                        if (timeline.length < 2) return '—';
                        const first = timeline[0][activeChart] || 0;
                        const last = timeline[timeline.length - 1][activeChart] || 0;
                        if (first <= 0) return last > 0 ? '+100%' : '0%';
                        const pct = ((last - first) / first) * 100;
                        const sign = pct > 0 ? '+' : '';
                        return `${sign}${pct.toFixed(1)}%`;
                    })()}
                </div>
                <div className="text-sm text-gray-600">Growth</div>
            </div>
        </div>
    </div>);
}
