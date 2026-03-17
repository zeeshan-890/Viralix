'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Eye, Bookmark, Share2, Users, ExternalLink, Play, Sparkles, Zap, Tag, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { instagramAPI } from '@/lib/api';

export default function InstagramPostDetailPage() {
    const params = useParams();
    const mediaId = params.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoReplyRule, setAutoReplyRule] = useState(null);
    const [ruleLoading, setRuleLoading] = useState(false);

    useEffect(() => {
        if (mediaId) {
            loadInsights();
            loadAutoReplyRule();
        }
    }, [mediaId]);

    const loadInsights = async () => {
        try {
            setLoading(true);
            const response = await instagramAPI.getMediaInsights(mediaId);
            setData(response.data);
        } catch (e) {
            console.error('Failed to load insights:', e);
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadAutoReplyRule = async () => {
        try {
            setRuleLoading(true);
            const response = await instagramAPI.getAutoReplyRule(mediaId);
            setAutoReplyRule(response.data?.rule || null);
        } catch (e) {
            // No rule found is not an error
            console.log('No auto-reply rule for this post');
            setAutoReplyRule(null);
        } finally {
            setRuleLoading(false);
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
                <Link href="/dashboard/platforms/instagram" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Instagram
                </Link>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#E4405F' }}></div>
                    <p className="text-gray-500">Loading post insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/platforms/instagram" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Instagram
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

    const { media, engagement, comments } = data || {};
    const isVideo = media?.mediaType === 'VIDEO' || media?.mediaType === 'REELS';

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/dashboard/platforms/instagram" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Instagram
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center border border-gray-100">
                            <Image src="/instagram.png" alt="Instagram" width={28} height={28} className="object-contain" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: '#354F52' }}>Post Insights</h1>
                            <p className="text-sm text-gray-500">@{media?.username} • {formatDate(media?.timestamp)}</p>
                        </div>
                    </div>
                    <a
                        href={media?.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View on Instagram
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Media Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="relative aspect-square bg-gray-900">
                        {isVideo && media?.mediaUrl ? (
                            <video
                                src={media.mediaUrl}
                                poster={media.thumbnailUrl}
                                controls
                                className="w-full h-full object-contain"
                            >
                                Your browser does not support video playback.
                            </video>
                        ) : media?.mediaUrl ? (
                            <Image
                                src={media.mediaUrl}
                                alt={media.caption || 'Instagram post'}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl">📷</span>
                            </div>
                        )}
                        {isVideo && (
                            <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                <Play className="w-4 h-4" />
                                {media?.mediaType === 'REELS' ? 'Reel' : 'Video'}
                            </div>
                        )}
                    </div>
                    {media?.caption && (
                        <div className="p-4 border-t border-gray-100">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{media.caption}</p>
                        </div>
                    )}
                </div>

                {/* Insights Panel */}
                <div className="space-y-6">
                    {/* Engagement Stats */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Engagement</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Views - show for videos/reels */}
                            {isVideo && (
                                <div className="p-4 bg-purple-50 rounded-xl flex items-center gap-3 col-span-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-purple-600">{formatNumber(engagement?.views || engagement?.plays)}</p>
                                        <p className="text-xs text-gray-600">Views</p>
                                    </div>
                                </div>
                            )}
                            <div className="p-4 bg-pink-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-pink-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-pink-600">{formatNumber(engagement?.likes)}</p>
                                    <p className="text-xs text-gray-600">Likes</p>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{formatNumber(engagement?.comments)}</p>
                                    <p className="text-xs text-gray-600">Comments</p>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Bookmark className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-600">{formatNumber(engagement?.saves)}</p>
                                    <p className="text-xs text-gray-600">Saves</p>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{formatNumber(engagement?.shares)}</p>
                                    <p className="text-xs text-gray-600">Shares</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold" style={{ color: '#354F52' }}>{formatNumber(engagement?.reach)}</p>
                                    <p className="text-xs text-gray-600">Reach</p>
                                </div>
                            </div>
                        </div>
                        {engagement?.totalInteractions > 0 && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                                <p className="text-sm text-gray-600">Total Interactions</p>
                                <p className="text-3xl font-bold" style={{ color: '#E4405F' }}>{formatNumber(engagement?.totalInteractions)}</p>
                            </div>
                        )}
                    </div>

                    {/* Auto-Reply Rules Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold" style={{ color: '#354F52' }}>Auto-Reply DM</h2>
                                <p className="text-xs text-gray-500">Automated responses for this post</p>
                            </div>
                        </div>

                        {ruleLoading ? (
                            <div className="text-center py-6">
                                <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Loading rules...</p>
                            </div>
                        ) : autoReplyRule ? (
                            <div className="space-y-4">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">Status</span>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${autoReplyRule.enabled
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {autoReplyRule.enabled ? (
                                            <><ToggleRight className="w-4 h-4" /> Active</>
                                        ) : (
                                            <><ToggleLeft className="w-4 h-4" /> Paused</>
                                        )}
                                    </span>
                                </div>

                                {/* Trigger Type */}
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-purple-700">Trigger</span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        {autoReplyRule.triggerType === 'keyword'
                                            ? 'When comment contains specific keywords'
                                            : 'On any comment'}
                                    </p>
                                </div>

                                {/* Keywords */}
                                {autoReplyRule.triggerType === 'keyword' && autoReplyRule.keywords?.length > 0 && (
                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">Keywords</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {autoReplyRule.keywords.map((keyword, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Reply Message */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Reply Message</span>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">
                                        "{autoReplyRule.replyContent?.message || 'No message configured'}"
                                    </p>
                                </div>

                                {/* Stats */}
                                {(autoReplyRule.stats?.sent > 0 || autoReplyRule.stats?.failed > 0) && (
                                    <div className="flex gap-4 pt-2">
                                        <div className="flex-1 p-3 bg-green-50 rounded-lg text-center">
                                            <p className="text-xl font-bold text-green-600">{autoReplyRule.stats?.sent || 0}</p>
                                            <p className="text-xs text-gray-600">DMs Sent</p>
                                        </div>
                                        <div className="flex-1 p-3 bg-red-50 rounded-lg text-center">
                                            <p className="text-xl font-bold text-red-600">{autoReplyRule.stats?.failed || 0}</p>
                                            <p className="text-xs text-gray-600">Failed</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="font-medium">No Auto-Reply configured</p>
                                <p className="text-sm">Create a new post with Auto-Reply to see rules here</p>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>
                            Comments ({comments?.length || 0})
                        </h2>
                        {comments && comments.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {comment.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm" style={{ color: '#354F52' }}>@{comment.username}</span>
                                                    <span className="text-xs text-gray-400">{formatDate(comment.timestamp)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.text}</p>
                                                {comment.like_count > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <Heart className="w-3 h-3" /> {comment.like_count} likes
                                                    </p>
                                                )}
                                                {/* Replies */}
                                                {comment.replies?.data?.length > 0 && (
                                                    <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                                                        {comment.replies.data.map((reply) => (
                                                            <div key={reply.id} className="text-sm">
                                                                <span className="font-medium text-pink-600">@{reply.username}</span>
                                                                <span className="text-gray-700 ml-1">{reply.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No comments yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

