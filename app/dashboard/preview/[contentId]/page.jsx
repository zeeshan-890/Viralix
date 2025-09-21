'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { postsAPI, analyticsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import PlatformTabs from './components/PlatformTabs';
import CaptionEditor from './components/CaptionEditor';
import HashtagEditor from './components/HashtagEditor';
import TimePicker from './components/TimePicker';

export default function PreviewPage({ params }) {
    const router = useRouter();
    // Next.js 15: params is a Promise; unwrap with React.use
    const { contentId } = React.use(params);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!contentId) return;
        loadPost();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentId]);

    const loadPost = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await postsAPI.getPost(contentId);
            setPost(response.data);
        } catch (err) {
            setError('Failed to load post');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updatePost = async (updates) => {
        if (!post) return;

        setSaving(true);
        try {
            const response = await postsAPI.updatePost(post._id, updates);
            setPost(response.data);
        } catch (err) {
            console.error('Failed to update post:', err);
        } finally {
            setSaving(false);
        }
    };

    const schedulePost = async () => {
        if (!post) return;

        setSaving(true);
        try {
            // Mark as scheduled; backend uses scheduledDate and platforms shape
            await postsAPI.updatePost(post._id, { isScheduled: true });
            router.push('/dashboard/schedule');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to schedule post');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        if (!post) return;

        setSaving(true);
        try {
            await postsAPI.updatePost(post._id, { status: 'draft' });
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save draft');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const publishNow = async () => {
        if (!post) return;
        setPublishing(true);
        setError('');
        try {
            const res = await postsAPI.publishNow(post._id);
            // Reload post to show updated platform statuses and any error messages
            await loadPost();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to publish now');
            console.error(err);
        } finally {
            setPublishing(false);
        }
    };

    const refreshMetrics = async () => {
        setRefreshing(true);
        try {
            await analyticsAPI.refresh();
            await loadPost();
        } catch (err) {
            // Non-blocking
        } finally {
            setRefreshing(false);
        }
    };

    // Derived status
    const platforms = post?.platforms || [];
    const publishedPlatforms = useMemo(() => platforms.filter(p => p.status === 'published'), [platforms]);
    const remainingPlatforms = useMemo(() => platforms.filter(p => p.status !== 'published'), [platforms]);
    const allPublished = publishedPlatforms.length > 0 && remainingPlatforms.length === 0;

    if (loading) {
        return (
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Preview Content</h1>
                    <p className="text-gray-600">Loading content...</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-8 text-gray-500">Loading preview...</div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Preview Content</h1>
                    <p className="text-gray-600">Content not found</p>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error || 'Post not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Preview Content</h1>
                <p className="text-gray-600">
                    Preview how "{post.title || 'Untitled Post'}" will look across different platforms.
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Area */}
                <div className="lg:col-span-2">
                    <PlatformTabs post={post} />
                </div>

                {/* Editing Panel */}
                <div className="space-y-6">
                    {/* Platform Status & Diagnostics */}
                    {post.platforms && post.platforms.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-3">Platforms</h3>
                            <div className="space-y-2">
                                {post.platforms.map((p, idx) => (
                                    <div key={idx} className="flex items-start justify-between p-3 rounded border border-gray-100">
                                        <div>
                                            <div className="text-sm font-medium capitalize">{p.name}</div>
                                            <div className="text-xs text-gray-500">Account: {p.accountId}</div>
                                            {p.errorMessage && (
                                                <div className="mt-1 text-xs text-red-600">Error: {p.errorMessage}</div>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-800' : p.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {p.status || 'unknown'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Post Info */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Post Information</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={post.title || ''}
                                    onChange={(e) => updatePost({ title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter post title..."
                                    disabled={allPublished}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <div className="flex items-center space-x-2">
                                    {(() => {
                                        const status = post.isPublished ? 'published' : post.isScheduled ? 'scheduled' : post.isDraft ? 'draft' : 'unknown';
                                        const cls = status === 'draft'
                                            ? 'bg-gray-100 text-gray-800'
                                            : status === 'scheduled'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : status === 'published'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800';
                                        const label = status.charAt(0).toUpperCase() + status.slice(1);
                                        return <span className={`px-3 py-1 text-sm rounded-full ${cls}`}>{label}</span>;
                                    })()}
                                    {post.platforms && (
                                        <span className="text-sm text-gray-600">
                                            {post.platforms.length} platform{post.platforms.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Caption Editor (disabled if all published) */}
                    {!allPublished && (
                        <CaptionEditor
                            content={post.content || ''}
                            onChange={(content) => updatePost({ content })}
                        />
                    )}

                    {/* Hashtag Editor (disabled if all published) */}
                    {!allPublished && (
                        <HashtagEditor
                            hashtags={post.hashtags || []}
                            onChange={(hashtags) => updatePost({ hashtags })}
                        />
                    )}

                    {/* Schedule Time (hidden if all published) */}
                    {!allPublished && (
                        <TimePicker
                            post={post}
                            onChange={(updates) => updatePost(updates)}
                        />
                    )}

                    {/* Action Buttons */}
                    {!allPublished && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>
                            {publishedPlatforms.length > 0 && remainingPlatforms.length > 0 && (
                                <div className="mb-3 text-sm text-gray-600">
                                    Some platforms are already published. Actions will apply to unpublished platforms only.
                                </div>
                            )}
                            <div className="space-y-3">
                                <button
                                    onClick={schedulePost}
                                    disabled={saving || !post?.scheduledDate || !(Array.isArray(post?.platforms) && post.platforms.length > 0)}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Scheduling...' : (publishedPlatforms.length > 0 ? 'Schedule Remaining Platforms' : 'Schedule Post')}
                                </button>
                                <button
                                    onClick={publishNow}
                                    disabled={publishing || !(Array.isArray(post?.platforms) && post.platforms.length > 0)}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {publishing ? 'Publishing...' : (publishedPlatforms.length > 0 ? 'Publish Remaining Now' : 'Publish Now')}
                                </button>
                                <button
                                    onClick={saveDraft}
                                    disabled={saving}
                                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save as Draft'}
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/preview')}
                                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Back to Preview
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Insights when fully or partially published */}
                    {publishedPlatforms.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Insights</h3>
                                <button
                                    onClick={refreshMetrics}
                                    disabled={refreshing}
                                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-60"
                                >
                                    {refreshing ? 'Refreshing…' : 'Refresh'}
                                </button>
                            </div>
                            <div className="space-y-3">
                                {publishedPlatforms.map((p, idx) => {
                                    const e = p.engagement || {};
                                    return (
                                        <div key={idx} className="border border-gray-100 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium capitalize">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.publishedAt ? new Date(p.publishedAt).toLocaleString() : ''}</div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                                <div className="bg-gray-50 rounded p-2">
                                                    <div className="text-gray-500">Views</div>
                                                    <div className="font-semibold">{e.views ?? 0}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded p-2">
                                                    <div className="text-gray-500">Likes</div>
                                                    <div className="font-semibold">{e.likes ?? 0}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded p-2">
                                                    <div className="text-gray-500">Comments</div>
                                                    <div className="font-semibold">{e.comments ?? 0}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded p-2">
                                                    <div className="text-gray-500">Shares</div>
                                                    <div className="font-semibold">{e.shares ?? 0}</div>
                                                </div>
                                            </div>
                                            {e.lastUpdated && (
                                                <div className="mt-1 text-xs text-gray-500">Updated {new Date(e.lastUpdated).toLocaleString()}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
