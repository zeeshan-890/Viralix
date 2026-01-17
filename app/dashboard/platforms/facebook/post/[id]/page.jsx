'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Share2, ExternalLink, Play, Eye, MousePointer2, Users } from 'lucide-react';
import { facebookAPI } from '@/lib/api';

export default function FacebookPostDetailPage() {
    const params = useParams();
    const postId = params.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (postId) {
            loadInsights();
        }
    }, [postId]);

    const loadInsights = async () => {
        try {
            setLoading(true);
            const response = await facebookAPI.getPostInsights(postId);
            setData(response.data);
        } catch (e) {
            console.error('Failed to load insights:', e);
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/platforms/facebook" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Facebook
                </Link>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#1877F2' }}></div>
                    <p className="text-gray-500">Loading post insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/platforms/facebook" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Facebook
                </Link>
                <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load insights</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    const { post, engagement, comments } = data || {};
    const isVideo = post?.mediaType === 'video' || post?.isReel;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/dashboard/platforms/facebook" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Facebook
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-gray-100">
                            <Image src="/facebook.png" alt="Facebook" width={28} height={28} className="object-contain" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: '#354F52' }}>Post Insights</h1>
                            <p className="text-sm text-gray-500">{formatDate(post?.createdTime)}</p>
                        </div>
                    </div>
                    {post?.permalink && (
                        <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Facebook
                        </a>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Media Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="relative aspect-square bg-gray-900">
                        {post?.picture ? (
                            <Image
                                src={post.picture}
                                alt={post.message || 'Facebook post'}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl">📄</span>
                            </div>
                        )}
                        {isVideo && (
                            <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                <Play className="w-4 h-4" />
                                {post?.isReel ? 'Reel' : 'Video'}
                            </div>
                        )}
                    </div>
                    {post?.message && (
                        <div className="p-4 border-t border-gray-100">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.message}</p>
                        </div>
                    )}
                </div>

                {/* Insights Panel */}
                <div className="space-y-6">
                    {/* Engagement Stats */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Engagement</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{formatNumber(engagement?.reactions)}</p>
                                    <p className="text-xs text-gray-600">Reactions</p>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{formatNumber(engagement?.comments)}</p>
                                    <p className="text-xs text-gray-600">Comments</p>
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">{formatNumber(engagement?.shares)}</p>
                                    <p className="text-xs text-gray-600">Shares</p>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <MousePointer2 className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-600">{formatNumber(engagement?.clicks)}</p>
                                    <p className="text-xs text-gray-600">Clicks</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold" style={{ color: '#354F52' }}>{formatNumber(engagement?.impressions)}</p>
                                    <p className="text-xs text-gray-600">Impressions</p>
                                </div>
                            </div>
                            <div className="p-4 bg-teal-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-teal-600">{formatNumber(engagement?.reach)}</p>
                                    <p className="text-xs text-gray-600">Unique Reach</p>
                                </div>
                            </div>
                        </div>

                        {engagement?.videoViews > 0 && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-red-50 to-orange-50">
                                <p className="text-sm text-gray-600">Video Views</p>
                                <p className="text-3xl font-bold text-red-600">{formatNumber(engagement?.videoViews)}</p>
                            </div>
                        )}
                    </div>


                    {/* Total Engagement */}
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
                        <p className="text-sm text-gray-600">Total Engagement</p>
                        <p className="text-3xl font-bold" style={{ color: '#1877F2' }}>
                            {formatNumber((engagement?.reactions || 0) + (engagement?.comments || 0) + (engagement?.shares || 0))}
                        </p>
                    </div>
                </div>

                {/* Post Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Post Information</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Type</span>
                            <span className="font-medium" style={{ color: '#354F52' }}>
                                {isVideo ? (post?.isReel ? 'Reel' : 'Video') : 'Image/Text'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Published</span>
                            <span className="font-medium" style={{ color: '#354F52' }}>{formatDate(post?.createdTime)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Status</span>
                            <span className="font-medium text-green-600 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live Data
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
