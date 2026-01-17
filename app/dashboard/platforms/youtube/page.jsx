'use client';
import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { analyticsAPI, youtubeAPI } from '@/lib/api';
import PlatformPageLayout from '../components/PlatformPageLayout';

export default function YouTubePage() {
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const ytAccounts = accounts.filter(a => a.platform === 'youtube');

    useEffect(() => {
        if (!accountsLoading) {
            loadData();
        }
    }, [accountsLoading, accounts]);

    const loadData = async () => {
        if (ytAccounts.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Load platform analytics
            const analyticsRes = await analyticsAPI.getPlatformMetrics('youtube');
            const analyticsData = analyticsRes.data || {};

            // Calculate metrics from posts
            let totalViews = 0, totalLikes = 0, totalComments = 0;
            (analyticsData.posts || []).forEach(post => {
                post.platforms?.forEach(p => {
                    if (p.name === 'youtube' && p.engagement) {
                        totalViews += p.engagement.views || 0;
                        totalLikes += p.engagement.likes || 0;
                        totalComments += p.engagement.comments || 0;
                    }
                });
            });

            setMetrics({
                totalViews,
                totalLikes,
                totalComments,
                totalPosts: analyticsData.metrics?.totalPosts || 0
            });

            // Load videos for connected accounts
            const contentItems = [];
            for (const acc of ytAccounts) {
                try {
                    const videosRes = await youtubeAPI.videos(acc.platformAccountId, { limit: 12 });
                    const videos = videosRes.data?.videos || [];
                    videos.forEach(video => {
                        contentItems.push({
                            id: video.id,
                            title: video.snippet?.title || 'YouTube Video',
                            thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
                            type: 'video',
                            views: parseInt(video.statistics?.viewCount || 0),
                            likes: parseInt(video.statistics?.likeCount || 0),
                            accountId: acc.platformAccountId
                        });
                    });
                } catch (e) {
                    console.warn('Failed to load YouTube videos:', e.message);
                }
            }
            setContent(contentItems);
        } catch (e) {
            console.error('Failed to load YouTube data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await analyticsAPI.refresh();
            await loadData();
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <PlatformPageLayout
            platform="youtube"
            accounts={ytAccounts}
            metrics={metrics}
            content={content}
            loading={loading || accountsLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        >
            {/* YouTube-specific section for channel info */}
            {ytAccounts.length > 0 && ytAccounts[0].metadata && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Channel Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-red-50 rounded-xl">
                            <p className="text-2xl font-bold text-red-600">
                                {ytAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Subscribers</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {metrics.totalViews?.toLocaleString() || 0}
                            </p>
                            <p className="text-sm text-gray-600">Total Views</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {metrics.totalPosts || 0}
                            </p>
                            <p className="text-sm text-gray-600">Videos</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {metrics.totalLikes?.toLocaleString() || 0}
                            </p>
                            <p className="text-sm text-gray-600">Total Likes</p>
                        </div>
                    </div>
                </div>
            )}
        </PlatformPageLayout>
    );
}
