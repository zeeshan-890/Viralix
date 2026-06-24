'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { tiktokAPI } from '@/lib/api';
import PostAnalyticsHeader from '@/components/analytics/shared/PostAnalyticsHeader';
import EngagementMetricGrid, { EngagementBreakdownPanel } from '@/components/analytics/shared/EngagementMetrics';
import { Heart, MessageCircle, Share2, Eye, Video, AlertCircle } from 'lucide-react';

export default function TikTokPostDetailPage() {
    const params = useParams();
    const { id } = params;

    const [postData, setPostData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        fetchInsights();
    }, [id]);

    const fetchInsights = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const res = await tiktokAPI.getVideoInsights(id);
            setPostData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load post insights');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <PostAnalyticsHeader platform="tiktok" title="Post analytics" live={false} />
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Error loading insights</h3>
                    <p>{error}</p>
                    <button type="button" onClick={() => fetchInsights()} className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50">
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const metrics = postData?.metrics || {};
    const views = metrics.views || 0;

    const metricCards = [
        { label: 'Views', value: views, icon: Eye, iconBg: 'bg-gray-100 text-gray-800' },
        { label: 'Likes', value: metrics.likes, icon: Heart, iconBg: 'bg-pink-50 text-pink-600', rate: views ? ((metrics.likes / views) * 100).toFixed(2) : 0 },
        { label: 'Comments', value: metrics.comments, icon: MessageCircle, iconBg: 'bg-blue-50 text-blue-600', rate: views ? ((metrics.comments / views) * 100).toFixed(2) : 0 },
        { label: 'Shares', value: metrics.shares, icon: Share2, iconBg: 'bg-green-50 text-green-600', rate: views ? ((metrics.shares / views) * 100).toFixed(2) : 0 },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <PostAnalyticsHeader
                platform="tiktok"
                title="TikTok post analytics"
                subtitle={formatDate(postData.createdTime)}
                permalink={postData.permalink}
                onRefresh={() => fetchInsights(true)}
                refreshing={refreshing}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="dash-card rounded-2xl border border-[var(--viralix-border)] overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900">Preview</h2>
                            <Video className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="relative aspect-[9/16] bg-black">
                            {postData.thumbnail ? (
                                <img src={postData.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">No preview</div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-50">
                            <p className="text-sm text-gray-700 line-clamp-4">{postData.description || postData.title || 'No caption'}</p>
                        </div>
                    </div>

                    <div className="dash-card rounded-2xl border border-[var(--viralix-border)] p-5 text-sm space-y-3">
                        <h3 className="font-semibold text-gray-900">Post details</h3>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Type</span>
                            <span className="font-medium">Video</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Published</span>
                            <span className="font-medium text-right">{formatDate(postData.createdTime)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Video ID</span>
                            <span className="font-mono text-xs text-gray-400 truncate max-w-[140px]">{postData.id}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <EngagementMetricGrid metrics={metricCards} columns={4} />
                    <EngagementBreakdownPanel
                        views={views}
                        likes={metrics.likes}
                        comments={metrics.comments}
                        shares={metrics.shares}
                    />
                </div>
            </div>
        </div>
    );
}
