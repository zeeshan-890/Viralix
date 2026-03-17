'use client';
import { useEffect, useState } from 'react';
import { analyticsAPI } from '@/lib/api';
import AnalyticsCharts from './components/AnalyticsCharts';
import PlatformMetrics from './components/PlatformMetrics';
import ContentPerformance from './components/ContentPerformance';
import BestTimesToPost from './components/BestTimesToPost';
import SentimentAnalysis from './components/SentimentAnalysis';
import LinkShortener from './components/LinkShortener';
import KeywordAlerts from './components/KeywordAlerts';
import CompetitorAnalysis from './components/CompetitorAnalysis';
import HashtagResearch from './components/HashtagResearch';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            // Best-effort refresh so views/followers are populated
            try { await analyticsAPI.refresh(); } catch (_) { }
            const response = await analyticsAPI.getOverview();
            setAnalytics(response.data);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const calculateChange = () => null; // Placeholder until previous period data is supported

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await analyticsAPI.refresh();
            await loadAnalytics();
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        );
    }

    const overview = analytics?.overview || {};

    return (<div>
        <div className="mb-8 flex items-start justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Track your content performance across all platforms.</p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className={`px-4 py-2 rounded-lg border ${refreshing ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'} flex items-center space-x-2`}>
                <span>🔄</span>
                <span>{refreshing ? 'Refreshing…' : 'Refresh Analytics'}</span>
            </button>
        </div>

        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Views</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(overview.totalViews || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                            <span className="text-xl">👁️</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {overview.engagementRate || 0}%
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full">
                            <span className="text-xl">❤️</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Likes</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(overview.totalLikes || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full">
                            <span className="text-xl">👍</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Followers</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(overview.totalFollowers || 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-full">
                            <span className="text-xl">👥</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Best Time to Post (Feature 1) */}
            <BestTimesToPost />

            {/* Charts Section */}
            <AnalyticsCharts analytics={analytics} />

            {/* Comment Sentiment (Feature 2) */}
            <SentimentAnalysis />

            {/* Social Listening (Feature 5) */}
            <KeywordAlerts />

            {/* Competitor Analysis (Feature 10) */}
            <CompetitorAnalysis />

            {/* Hashtag Research Tool */}
            <HashtagResearch />

            {/* Platform Metrics */}
            <PlatformMetrics analytics={analytics} />

            {/* Link Shortener (Feature 4) */}
            <LinkShortener />

            {/* Content Performance */}
            <ContentPerformance />
        </div>
    </div>);
}

