'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tiktokAPI } from '@/lib/api';
import { ArrowLeft, BarChart3, Heart, MessageCircle, Share2, Eye, Video, AlertCircle } from 'lucide-react';

export default function TikTokPostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [postData, setPostData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        fetchInsights();
    }, [id]);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await tiktokAPI.getVideoInsights(id);
            setPostData(res.data);
        } catch (err) {
            console.error('Failed to fetch TikTok insights:', err);
            setError(err.response?.data?.message || 'Failed to load post insights');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-black mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to TikTok
                </button>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Insights</h3>
                    <p>{error}</p>
                    <button
                        onClick={fetchInsights}
                        className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const metrics = postData?.metrics || {};

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to TikTok
                </button>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Data
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Preview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900">Post Preview</h2>
                            <Video className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="relative aspect-[9/16] bg-black group">
                            {postData.thumbnail ? (
                                <img
                                    src={postData.thumbnail}
                                    alt="Video thumbnail"
                                    className="w-full h-full object-cover opacity-80"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    No preview available
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <a
                                    href={postData.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all transform hover:scale-105"
                                >
                                    <Video className="w-8 h-8 text-white" />
                                </a>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-50">
                            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                {postData.description || postData.title || 'No description'}
                            </p>
                            <a
                                href={postData.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                View on TikTok
                                <Share2 className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Post Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Post Information</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">Type</span>
                                <span className="font-medium">Video</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">Published</span>
                                <span className="font-medium text-right">{formatDate(postData.createdTime)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">ID</span>
                                <span className="font-mono text-xs text-gray-400">{postData.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-black/5 rounded-lg text-black">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Views</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.views)}</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Likes</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.likes)}</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Comments</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.comments)}</div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Shares</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.shares)}</div>
                        </div>
                    </div>

                    {/* Engagement Overview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Engagement Overview</h3>
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Engagement Rate */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Engagement Rate</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {((metrics.likes + metrics.comments + metrics.shares) / (metrics.views || 1) * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                                        style={{ width: `${Math.min(((metrics.likes + metrics.comments + metrics.shares) / (metrics.views || 1) * 100), 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Calculated based on likes, comments, and shares relative to views.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Like Rate</p>
                                    <p className="font-semibold text-gray-900">{(metrics.likes / (metrics.views || 1) * 100).toFixed(2)}%</p>
                                </div>
                                <div className="text-center border-l border-r border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Comment Rate</p>
                                    <p className="font-semibold text-gray-900">{(metrics.comments / (metrics.views || 1) * 100).toFixed(2)}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Share Rate</p>
                                    <p className="font-semibold text-gray-900">{(metrics.shares / (metrics.views || 1) * 100).toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
