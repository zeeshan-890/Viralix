'use client';
import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { analyticsAPI, instagramAPI } from '@/lib/api';
import PlatformPageLayout from '../components/PlatformPageLayout';

export default function InstagramPage() {
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const igAccounts = accounts.filter(a => a.platform === 'instagram');

    useEffect(() => {
        if (!accountsLoading) {
            loadData();
        }
    }, [accountsLoading, accounts]);

    const loadData = async () => {
        if (igAccounts.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Load platform analytics
            const analyticsRes = await analyticsAPI.getPlatformMetrics('instagram');
            const analyticsData = analyticsRes.data || {};

            // Calculate metrics from posts
            let totalViews = 0, totalLikes = 0, totalComments = 0;
            (analyticsData.posts || []).forEach(post => {
                post.platforms?.forEach(p => {
                    if (p.name === 'instagram' && p.engagement) {
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

            // Load content feed for connected accounts
            const contentItems = [];
            for (const acc of igAccounts) {
                try {
                    const feedRes = await instagramAPI.feed(acc.platformAccountId, 12);
                    const feedData = feedRes.data?.data || [];
                    feedData.forEach(item => {
                        contentItems.push({
                            id: item.id,
                            title: item.caption?.substring(0, 50) || 'Instagram Post',
                            thumbnail: item.media_url || item.thumbnail_url,
                            type: item.media_type === 'VIDEO' ? 'video' : 'image',
                            views: 0,
                            likes: item.like_count || 0,
                            accountId: acc.platformAccountId
                        });
                    });
                } catch (e) {
                    console.warn('Failed to load Instagram feed:', e.message);
                }
            }
            setContent(contentItems);
        } catch (e) {
            console.error('Failed to load Instagram data:', e);
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
            platform="instagram"
            accounts={igAccounts}
            metrics={metrics}
            content={content}
            loading={loading || accountsLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        />
    );
}
