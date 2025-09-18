'use client';
import { useState, useEffect, useMemo } from 'react';
export default function AnalyticsCharts() {
    var _a;
    const [timeRange, setTimeRange] = useState('7d');
    const [activeChart, setActiveChart] = useState('views');
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
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
    // Stable mock data for demonstration - using useMemo to prevent regeneration
    const mockData = useMemo(() => {
        if (!isClient)
            return [];
        const data = [];
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        // Use a seed for consistent data generation
        const seed = 12345;
        let random = seed;
        const seededRandom = () => {
            random = (random * 9301 + 49297) % 233280;
            return random / 233280;
        };
        for (let i = 0; i < days; i++) {
            const date = new Date(2025, 7, 17); // Fixed date: August 17, 2025
            date.setDate(date.getDate() + i);
            data.push({
                date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`,
                value: Math.floor(seededRandom() * 1000) + 500
            });
        }
        return data;
    }, [timeRange, isClient]);
    const maxValue = mockData.length > 0 ? Math.max(...mockData.map(d => d.value)) : 1000;
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
                {isClient ? (<>
                        <div className="flex items-end justify-between h-64 border-b border-gray-200">
                            {mockData.slice(0, 20).map((point, index) => (<div key={`${point.date}-${index}`} className="flex flex-col items-center flex-1">
                                    <div className="w-full max-w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" style={{
                    height: `${(point.value / maxValue) * 200}px`,
                    minHeight: '4px'
                }} title={`${point.date}: ${point.value}`}/>
                                </div>))}
                        </div>

                        {/* Chart Labels */}
                        <div className="flex justify-between mt-2 text-xs text-gray-600">
                            <span>{((_a = mockData[0]) === null || _a === void 0 ? void 0 : _a.date) || ''}</span>
                            <span>Today</span>
                        </div>
                    </>) : (<div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                        <div className="text-gray-500">Loading chart...</div>
                    </div>)}
            </div>

            {/* Chart Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                        {isClient && mockData.length > 0 ? mockData.reduce((sum, d) => sum + d.value, 0).toLocaleString() : '---'}
                    </div>
                    <div className="text-sm text-gray-600">Total {activeChart}</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                        {isClient && mockData.length > 0 ? Math.round(mockData.reduce((sum, d) => sum + d.value, 0) / mockData.length).toLocaleString() : '---'}
                    </div>
                    <div className="text-sm text-gray-600">Average</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                        {isClient ? `+${Math.round(15 + 5)}%` : '+---%'}
                    </div>
                    <div className="text-sm text-gray-600">Growth</div>
                </div>
            </div>
        </div>);
}
