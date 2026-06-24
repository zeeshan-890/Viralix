'use client';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccounts } from '@/hooks/useAccounts';
import { platformSyncAPI } from '@/lib/api';
import notify from '@/lib/notify';
import { Plus } from 'lucide-react';
import PlatformPageLayout from '../components/PlatformPageLayout';
import CreateInstagramPost from './components/CreateInstagramPost';
import { platformButtonClass } from '@/config/platforms';
import { cn } from '@/lib/utils';

function InstagramPageContent() {
    const searchParams = useSearchParams();
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const igAccounts = accounts.filter((a) => a.platform === 'instagram');

    useEffect(() => {
        if (!accountsLoading) {
            loadData();
        }
    }, [accountsLoading, accounts]);

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const username = searchParams.get('username');
        const create = searchParams.get('create');

        if (success) {
            notify.success(username ? `Connected @${username}` : 'Instagram account connected');
            setShowCreateModal(true);
            window.history.replaceState({}, '', '/dashboard/platforms/instagram');
        } else if (error) {
            notify.error(decodeURIComponent(error));
            window.history.replaceState({}, '', '/dashboard/platforms/instagram');
        } else if (create === '1') {
            setShowCreateModal(true);
            window.history.replaceState({}, '', '/dashboard/platforms/instagram');
        }
    }, [searchParams]);

    const loadData = async () => {
        if (igAccounts.length === 0) {
            setLoading(false);
            return;
        }

        try {
            const response = await platformSyncAPI.getContent('instagram', { limit: 50 });
            const data = response.data || {};

            setMetrics({
                totalViews: data.metrics?.totalViews || 0,
                totalLikes: data.metrics?.totalLikes || 0,
                totalComments: data.metrics?.totalComments || 0,
                totalPosts: data.metrics?.count || 0,
            });

            const contentItems = (data.content || []).map((item) => ({
                id: item.platformContentId,
                title: item.title || 'Instagram Post',
                thumbnail: item.thumbnail || item.mediaUrl,
                type: item.mediaType || 'image',
                views: item.views || 0,
                likes: item.likes || 0,
                comments: item.comments || 0,
                permalink: item.permalink,
            }));

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
            await platformSyncAPI.sync('instagram');
            await loadData();
        } catch (e) {
            console.error('Sync failed:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handlePostSuccess = () => {
        handleRefresh();
    };

    return (
        <>
            <PlatformPageLayout
                platform="instagram"
                accounts={igAccounts}
                metrics={metrics}
                content={content}
                loading={loading || accountsLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            >
                <div className="mb-6 flex flex-wrap gap-3">
                    {igAccounts.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className={cn(
                                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]',
                                platformButtonClass('instagram')
                            )}
                        >
                            <Plus className="w-5 h-5" />
                            Create Instagram Post
                        </button>
                    ) : (
                        <Link
                            href="/dashboard/connect-accounts/instagram-oauth"
                            className={cn(
                                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all',
                                platformButtonClass('instagram')
                            )}
                        >
                            <Plus className="w-5 h-5" />
                            Connect Instagram
                        </Link>
                    )}
                </div>
            </PlatformPageLayout>

            <CreateInstagramPost
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handlePostSuccess}
            />
        </>
    );
}

export default function InstagramPage() {
    return (
        <Suspense fallback={null}>
            <InstagramPageContent />
        </Suspense>
    );
}
