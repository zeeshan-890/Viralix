'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { postsAPI, analyticsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import PlatformTabs from './components/PlatformTabs';
import CaptionEditor from './components/CaptionEditor';
import TimePicker from './components/TimePicker';
import MediaEditor from './components/MediaEditor';
import PlatformSelector from './components/PlatformSelector';
import {
    ArrowLeft, Save, Calendar, Send, Eye, Heart, MessageCircle, Share2,
    RefreshCw, Clock, CheckCircle2, AlertCircle, Loader2, BarChart3
} from 'lucide-react';

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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#2a3e2e' }}>Preview Content</h1>
                        <p className="text-gray-600 mt-1">Loading your content...</p>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#84A98C' }} />
                    <p className="text-gray-600">Loading preview...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#2a3e2e' }}>Preview Content</h1>
                        <p className="text-gray-600 mt-1">Content not found</p>
                    </div>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>{error || 'Post not found'}</div>
                </div>
                <button
                    onClick={() => router.push('/dashboard/preview')}
                    className="flex items-center gap-2 px-6 py-3 border-2 rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#84A98C', color: '#52796F' }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Preview
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            {/* Header Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => router.push('/dashboard/preview')}
                            className="p-2 rounded-xl border-2 hover:scale-105 transition-all shadow-sm hover:shadow-md flex-shrink-0"
                            style={{ borderColor: '#84A98C', background: 'white' }}
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: '#52796F' }} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: '#2a3e2e' }}>
                                {post.title || 'Untitled Post'}
                            </h1>
                            <p className="text-sm text-gray-500">Content preview & editor</p>
                        </div>
                    </div>

                    {/* Status Badge & Stats */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 text-xs sm:text-sm">
                            <div className="text-center">
                                <div className="text-xs text-gray-600">Platforms</div>
                                <div className="text-base font-bold" style={{ color: '#2a3e2e' }}>
                                    {post.platforms?.length || 0}
                                </div>
                            </div>
                            <div className="w-px h-6 bg-gray-300"></div>
                            <div className="text-center">
                                <div className="text-xs text-green-600">Published</div>
                                <div className="text-base font-bold text-green-700">
                                    {publishedPlatforms.length}
                                </div>
                            </div>
                        </div>
                        {(() => {
                            const status = post.isPublished ? 'published' : post.isScheduled ? 'scheduled' : post.isDraft ? 'draft' : 'unknown';
                            const styles = {
                                draft: { bg: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)', text: 'white' },
                                scheduled: { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', text: 'white' },
                                published: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', text: 'white' },
                                unknown: { bg: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)', text: 'white' }
                            };
                            const icon = status === 'published' ? <CheckCircle2 className="w-4 h-4" /> :
                                status === 'scheduled' ? <Clock className="w-4 h-4" /> : <Eye className="w-4 h-4" />;
                            return (
                                <span className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-lg whitespace-nowrap"
                                    style={{ background: styles[status].bg, color: styles[status].text }}>
                                    {icon}
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 p-5 rounded-xl flex items-start gap-3 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <div className="font-bold mb-1">Error</div>
                        <div className="text-sm">{error}</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Main Preview Area - Takes 3 columns */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Platform Preview Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: '#2a3e2e' }}>Platform Preview</h2>
                                    <p className="text-sm text-gray-600 mt-0.5">See how your content appears</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                        <PlatformTabs post={post} />
                    </div>

                    {/* Platform Status Cards */}
                    {post.platforms && post.platforms.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                    <span className="text-white text-sm">📊</span>
                                </div>
                                Platform Status
                            </h3>
                            <div className="grid gap-4">
                                {post.platforms.map((p, idx) => (
                                    <div key={idx} className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-lg">
                                        <div className="absolute top-0 right-0 w-32 h-32 opacity-5"
                                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}></div>
                                        <div className="relative p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md ${p.name === 'facebook' ? 'bg-blue-500' :
                                                        p.name === 'instagram' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' :
                                                            p.name === 'twitter' ? 'bg-sky-400' :
                                                                p.name === 'linkedin' ? 'bg-blue-700' : 'bg-gray-400'
                                                        }`}>
                                                        {p.name === 'facebook' ? '📘' :
                                                            p.name === 'instagram' ? '📷' :
                                                                p.name === 'twitter' ? '🐦' :
                                                                    p.name === 'linkedin' ? '💼' : '📱'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg capitalize" style={{ color: '#2a3e2e' }}>{p.name}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span>ID:</span>
                                                            <code className="bg-gray-100 px-2 py-0.5 rounded">{p.accountId?.slice(0, 12)}...</code>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shadow-md ${p.status === 'published' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                                    p.status === 'scheduled' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                                                        p.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                                            'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                                    }`}>
                                                    {p.status || 'unknown'}
                                                </span>
                                            </div>
                                            {p.errorMessage && (
                                                <div className="mt-3 flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                                                    <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-red-800 text-sm mb-1">Publishing Error</div>
                                                        <div className="text-xs text-red-700">{p.errorMessage}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Takes 2 columns */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Post Title Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                <span className="text-white text-sm">✏️</span>
                            </div>
                            Post Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#2a3e2e' }}>
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={post.title || ''}
                                    onChange={(e) => updatePost({ title: e.target.value })}
                                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none transition-all focus:shadow-lg"
                                    style={{ borderColor: post.title ? '#84A98C' : '', background: '#fafafa' }}
                                    placeholder="Enter post title..."
                                    disabled={allPublished}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media Editor
                    {!allPublished && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100"
                                style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                        <span className="text-white text-sm">🎬</span>
                                    </div>
                                    Media
                                </h3>
                            </div>
                            <MediaEditor
                                post={post}
                                onChange={(media) => updatePost({ media })}
                            />
                        </div>
                    )} */}

                    {/* Platform Selector */}
                    {!allPublished && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100"
                                style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                        <span className="text-white text-sm">🌐</span>
                                    </div>
                                    Select Platforms
                                </h3>
                            </div>
                            <PlatformSelector
                                value={(post.platforms || []).filter(p => p.status !== 'published').map(p => ({ name: p.name, accountId: p.accountId }))}
                                onChange={(list) => {
                                    const published = (post.platforms || []).filter(p => p.status === 'published');
                                    const next = [
                                        ...published,
                                        ...list.map(p => ({ name: p.name, accountId: p.accountId, status: 'draft' })),
                                    ];
                                    updatePost({ platforms: next });
                                }}
                            />
                        </div>
                    )}

                    {/* Caption Editor */}
                    {!allPublished && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100"
                                style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                        <span className="text-white text-sm">#️⃣</span>
                                    </div>
                                    Caption & Hashtags
                                </h3>
                            </div>
                            <CaptionEditor
                                content={post.content || ''}
                                topic={post.title || post.content || ''}
                                onChange={(content) => updatePost({ content })}
                                onHashtags={(hashtags) => updatePost({ hashtags })}
                            />
                        </div>
                    )}

                    {/* Schedule Time */}
                    {!allPublished && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100"
                                style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    Schedule
                                </h3>
                            </div>
                            <TimePicker
                                post={post}
                                onChange={(updates) => updatePost(updates)}
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!allPublished && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                Actions
                            </h3>
                            {publishedPlatforms.length > 0 && remainingPlatforms.length > 0 && (
                                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="text-xs text-blue-800 leading-relaxed">
                                            Some platforms are already published. Actions will apply to unpublished platforms only.
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3">
                                <button
                                    onClick={schedulePost}
                                    disabled={saving || !post?.scheduledDate || !(Array.isArray(post?.platforms) && post.platforms.length > 0)}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-4 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold"
                                    style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Scheduling...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-5 h-5" />
                                            {publishedPlatforms.length > 0 ? 'Schedule Remaining' : 'Schedule Post'}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={publishNow}
                                    disabled={publishing || !(Array.isArray(post?.platforms) && post.platforms.length > 0)}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold"
                                >
                                    {publishing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            {publishedPlatforms.length > 0 ? 'Publish Remaining' : 'Publish Now'}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={saveDraft}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-4 border-2 rounded-xl hover:bg-gray-50 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderColor: '#84A98C', color: '#52796F' }}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save as Draft
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    {publishedPlatforms.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2a3e2e' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                        <BarChart3 className="w-4 h-4 text-white" />
                                    </div>
                                    Insights
                                </h3>
                                <button
                                    onClick={refreshMetrics}
                                    disabled={refreshing}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold shadow-sm hover:shadow-md"
                                    style={{ borderColor: '#84A98C', color: '#52796F' }}
                                >
                                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    {refreshing ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>
                            <div className="space-y-4">
                                {publishedPlatforms.map((p, idx) => {
                                    const e = p.engagement || {};
                                    return (
                                        <div key={idx} className="border-2 border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-all hover:shadow-lg bg-gradient-to-br from-white to-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md ${p.name === 'facebook' ? 'bg-blue-500' :
                                                        p.name === 'instagram' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' :
                                                            p.name === 'twitter' ? 'bg-sky-400' :
                                                                p.name === 'linkedin' ? 'bg-blue-700' : 'bg-gray-400'
                                                        }`}>
                                                        {p.name === 'facebook' ? '📘' :
                                                            p.name === 'instagram' ? '📷' :
                                                                p.name === 'twitter' ? '🐦' :
                                                                    p.name === 'linkedin' ? '💼' : '📱'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold capitalize" style={{ color: '#2a3e2e' }}>{p.name}</div>
                                                        {p.publishedAt && (
                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(p.publishedAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:scale-105 transition-transform">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                                                            <Eye className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="text-xs text-blue-700 font-bold">Views</div>
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-800">{e.views?.toLocaleString() ?? 0}</div>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 hover:scale-105 transition-transform">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                                                            <Heart className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="text-xs text-red-700 font-bold">Likes</div>
                                                    </div>
                                                    <div className="text-2xl font-bold text-red-800">{e.likes?.toLocaleString() ?? 0}</div>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:scale-105 transition-transform">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
                                                            <MessageCircle className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="text-xs text-green-700 font-bold">Comments</div>
                                                    </div>
                                                    <div className="text-2xl font-bold text-green-800">{e.comments?.toLocaleString() ?? 0}</div>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:scale-105 transition-transform">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center">
                                                            <Share2 className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="text-xs text-purple-700 font-bold">Shares</div>
                                                    </div>
                                                    <div className="text-2xl font-bold text-purple-800">{e.shares?.toLocaleString() ?? 0}</div>
                                                </div>
                                            </div>
                                            {e.lastUpdated && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-1">
                                                    <RefreshCw className="w-3 h-3" />
                                                    Last updated: {new Date(e.lastUpdated).toLocaleString()}
                                                </div>
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
