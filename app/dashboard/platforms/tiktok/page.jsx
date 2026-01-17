'use client';
import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { analyticsAPI, tiktokAPI } from '@/lib/api';
import PlatformPageLayout from '../components/PlatformPageLayout';

export default function TikTokPage() {
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const ttAccounts = accounts.filter(a => a.platform === 'tiktok');

    useEffect(() => {
        if (!accountsLoading) {
            loadData();
        }
    }, [accountsLoading, accounts]);

    const loadData = async () => {
        if (ttAccounts.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Load platform analytics
            const analyticsRes = await analyticsAPI.getPlatformMetrics('tiktok');
            const analyticsData = analyticsRes.data || {};

            // Calculate metrics from posts
            let totalViews = 0, totalLikes = 0, totalComments = 0;
            (analyticsData.posts || []).forEach(post => {
                post.platforms?.forEach(p => {
                    if (p.name === 'tiktok' && p.engagement) {
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
            for (const acc of ttAccounts) {
                try {
                    const videosRes = await tiktokAPI.videos(acc.platformAccountId, { limit: 12 });
                    const videos = videosRes.data?.videos || [];
                    videos.forEach(video => {
                        contentItems.push({
                            id: video.id,
                            title: video.title || 'TikTok Video',
                            thumbnail: video.cover_image_url,
                            type: 'video',
                            views: video.view_count || 0,
                            likes: video.like_count || 0,
                            accountId: acc.platformAccountId
                        });
                    });
                } catch (e) {
                    console.warn('Failed to load TikTok videos:', e.message);
                }
            }
            setContent(contentItems);
        } catch (e) {
            console.error('Failed to load TikTok data:', e);
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
            platform="tiktok"
            accounts={ttAccounts}
            metrics={metrics}
            content={content}
            loading={loading || accountsLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        />
    );
}
