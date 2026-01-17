'use client';
import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { platformSyncAPI, facebookAPI } from '@/lib/api';
import PlatformPageLayout from '../components/PlatformPageLayout';
import Link from 'next/link';

export default function FacebookPage() {
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pages, setPages] = useState([]);

    const fbAccounts = accounts.filter(a => a.platform === 'facebook');

    useEffect(() => {
        if (!accountsLoading) {
            loadData();
        }
    }, [accountsLoading, accounts]);

    const loadData = async () => {
        if (fbAccounts.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Load content from database
            const response = await platformSyncAPI.getContent('facebook', { limit: 50 });
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
                title: item.title || 'Facebook Post',
                thumbnail: item.thumbnail,
                type: item.mediaType || 'image',
                views: item.views || 0,
                likes: item.likes || 0,
                comments: item.comments || 0,
                shares: item.shares || 0,
                permalink: item.permalink
            }));

            setContent(contentItems);

            // Also load Facebook pages info
            try {
                const statusRes = await facebookAPI.status();
                setPages(statusRes.data?.pages || []);
            } catch (e) {
                console.warn('Failed to load Facebook pages:', e.message);
            }
        } catch (e) {
            console.error('Failed to load Facebook data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Sync from platform to database
            await platformSyncAPI.sync('facebook');
            // Reload data from database
            await loadData();
        } catch (e) {
            console.error('Sync failed:', e);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <PlatformPageLayout
            platform="facebook"
            accounts={fbAccounts}
            metrics={metrics}
            content={content}
            loading={loading || accountsLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
        >
            {/* Facebook Pages Section */}
            {pages.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Connected Pages</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pages.map((page) => (
                            <div key={page.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">📄</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate" style={{ color: '#354F52' }}>{page.name}</h3>
                                    <p className="text-sm text-gray-500">{page.category || 'Page'}</p>
                                </div>
                                {page.fan_count && (
                                    <div className="text-right">
                                        <p className="font-semibold text-blue-600">{page.fan_count.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">fans</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instagram Business Connection Info */}
            {fbAccounts.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
                            <span className="text-white text-xl">📸</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-1" style={{ color: '#354F52' }}>Instagram Business Integration</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Your Facebook connection enables Instagram Business publishing. Link your Instagram account to your Facebook Page for full access.
                            </p>
                            <Link
                                href="/dashboard/platforms/instagram"
                                className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                            >
                                Manage Instagram →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </PlatformPageLayout>
    );
}
