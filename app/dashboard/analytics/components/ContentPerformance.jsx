'use client';
import { useEffect, useState } from 'react';
import { analyticsAPI } from '@/lib/api';

export default function ContentPerformance() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contentData, setContentData] = useState([]);
    const [sortBy, setSortBy] = useState('totalEngagement');
    const [filterPlatform, setFilterPlatform] = useState('all');

    useEffect(() => {
        loadContentPerformance();
    }, []);

    const loadContentPerformance = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await analyticsAPI.getContentPerformance({ limit: 20 });
            setContentData(response.data?.topPerformingPosts || []);
        } catch (err) {
            setError('Failed to load content performance data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const platforms = [
        { value: 'all', label: 'All Platforms' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'instagram', label: 'Instagram' }
    ];

    const sortOptions = [
        { value: 'totalEngagement', label: 'Total Engagement' },
        { value: 'totalViews', label: 'Views' },
        { value: 'engagementRate', label: 'Engagement Rate' },
        { value: 'publishedAt', label: 'Publish Date' }
    ];

    const getPlatformIcon = (platform) => {
        const icons = {
            facebook: '📘',
            instagram: '📷',
            twitter: '🐦',
            linkedin: '💼'
        };
        return icons[platform] || '📱';
    };

    const getPlatformColor = (platform) => {
        const colors = {
            facebook: 'bg-blue-600 text-white',
            instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
            twitter: 'bg-blue-400 text-white',
            linkedin: 'bg-blue-700 text-white'
        };
        return colors[platform] || 'bg-gray-500 text-white';
    };

    const filteredData = contentData
        .filter(item => {
            if (filterPlatform === 'all') return true;
            return item.platforms?.some(p => p.name === filterPlatform);
        })
        .sort((a, b) => {
            if (sortBy === 'publishedAt') {
                return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
            }
            return (b.metrics?.[sortBy] || 0) - (a.metrics?.[sortBy] || 0);
        });

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center py-8">
                    <div className="text-gray-500">Loading content performance...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (<div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Content Performance</h3>

            <div className="flex space-x-3">
                {/* Platform Filter */}
                <select
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {platforms.map(platform => (
                        <option key={platform.value} value={platform.value}>
                            {platform.label}
                        </option>
                    ))}
                </select>

                {/* Sort Options */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            Sort by {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Content List */}
        {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium mb-2">No content data available</h3>
                <p>Publish some posts to see performance analytics here</p>
            </div>
        ) : (
            <div className="space-y-4">
                {filteredData.map((content) => (
                    <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                {content.media?.[0]?.type === 'video' ? '🎥' : content.media?.[0] ? '📷' : '📝'}
                            </div>

                            {/* Content Info */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{content.title}</h4>
                                    <div className="flex space-x-1">
                                        {content.platforms?.map((platform, idx) => (
                                            <span
                                                key={idx}
                                                className={`px-2 py-1 rounded-full text-xs ${getPlatformColor(platform.name)}`}
                                            >
                                                {getPlatformIcon(platform.name)} {platform.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {content.media?.[0]?.type || 'text'} •
                                    {content.publishedAt ? ` Published ${new Date(content.publishedAt).toLocaleDateString()}` : ' Draft'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    {content.content}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-5 gap-4 text-center">
                                <div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {formatNumber(content.metrics?.totalViews || 0)}
                                    </div>
                                    <div className="text-xs text-gray-600">Views</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {formatNumber(content.metrics?.totalEngagement || 0)}
                                    </div>
                                    <div className="text-xs text-gray-600">Engagement</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {formatNumber(content.metrics?.totalLikes || 0)}
                                    </div>
                                    <div className="text-xs text-gray-600">Likes</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-green-600">
                                        {content.metrics?.engagementRate || 0}%
                                    </div>
                                    <div className="text-xs text-gray-600">Rate</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {content.metrics?.platformCount || 0}
                                    </div>
                                    <div className="text-xs text-gray-600">Platforms</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Performance Summary */}
        {filteredData.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(filteredData.reduce((sum, item) => sum + (item.metrics?.totalViews || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Views</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(filteredData.reduce((sum, item) => sum + (item.metrics?.totalEngagement || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Engagement</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {filteredData.length > 0
                                ? (filteredData.reduce((sum, item) => sum + (item.metrics?.engagementRate || 0), 0) / filteredData.length).toFixed(1)
                                : 0
                            }%
                        </div>
                        <div className="text-sm text-gray-600">Avg Engagement</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {filteredData.length}
                        </div>
                        <div className="text-sm text-gray-600">Published Posts</div>
                    </div>
                </div>
            </div>
        )}
    </div>);
}
