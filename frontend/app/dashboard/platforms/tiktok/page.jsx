'use client';
import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { platformSyncAPI } from '@/lib/api';
import PlatformPageLayout from '../components/PlatformPageLayout';
import CreateTikTokPost from './components/CreateTikTokPost';
import { Plus } from 'lucide-react';

export default function TikTokPage() {
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

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
            // Load content from database
            const response = await platformSyncAPI.getContent('tiktok', { limit: 50 });
            const data = response.data || {};

            setMetrics({
                totalViews: data.metrics?.totalViews || 0,
                totalLikes: data.metrics?.totalLikes || 0,
                totalComments: data.metrics?.totalComments || 0,
                totalShares: data.metrics?.totalShares || 0,
                totalPosts: data.metrics?.count || 0
            });

            // Transform content for display
            const contentItems = (data.content || []).map(item => ({
                id: item.platformContentId,
                title: item.title || 'TikTok Video',
                thumbnail: item.thumbnail,
                type: 'video',
                views: item.views || 0,
                likes: item.likes || 0,
                comments: item.comments || 0,
                shares: item.shares || 0,
                permalink: item.permalink
            }));

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
            // Sync from platform to database
            await platformSyncAPI.sync('tiktok');
            // Reload data from database
            await loadData();
        } catch (e) {
            console.error('Sync failed:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handlePostSuccess = () => {
        // Refresh data after successful post
        handleRefresh();
    };

    return (
        <>
            <PlatformPageLayout
                platform="tiktok"
                accounts={ttAccounts}
                metrics={metrics}
                content={content}
                loading={loading || accountsLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            >
                {/* Create Post Button */}
                {ttAccounts.length > 0 && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white rounded-xl font-medium hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Create TikTok Post
                        </button>
                    </div>
                )}
            </PlatformPageLayout>

            {/* Create Post Modal */}
            <CreateTikTokPost
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                accounts={ttAccounts}
                onSuccess={handlePostSuccess}
            />
        </>
    );
}

