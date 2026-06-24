'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostAnalyticsHeader from '@/components/analytics/shared/PostAnalyticsHeader';
import EngagementMetricGrid, { EngagementBreakdownPanel } from '@/components/analytics/shared/EngagementMetrics';
import { Heart, MessageCircle, Eye, Bookmark, Share2, Play, Sparkles, Zap, Tag, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { instagramAPI } from '@/lib/api';

export default function InstagramPostDetailPage() {
    const params = useParams();
    const mediaId = params.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [autoReplyRule, setAutoReplyRule] = useState(null);
    const [ruleLoading, setRuleLoading] = useState(false);

    useEffect(() => {
        if (mediaId) {
            loadInsights();
            loadAutoReplyRule();
        }
    }, [mediaId]);

    const loadInsights = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            const response = await instagramAPI.getMediaInsights(mediaId);
            setData(response.data);
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
                <div className="analytics-panel p-12 text-center">
                    <div className="animate-spin w-10 h-10 border-2 border-[var(--viralix-border)] border-t-[#E4405F] rounded-full mx-auto mb-4" />
                    <p className="text-[var(--viralix-muted)]">Loading post analytics…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <PostAnalyticsHeader platform="instagram" title="Post analytics" live={false} />
                <div className="analytics-panel p-12 text-center border-red-200">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to load insights</h2>
                    <p className="text-[var(--viralix-muted)]">{error}</p>
                </div>
            </div>
        );
    }

    const { media, engagement, comments } = data || {};
    const isVideo = media?.mediaType === 'VIDEO' || media?.mediaType === 'REELS';
    const views = engagement?.views || engagement?.plays || 0;

    const metricCards = [
        ...(isVideo ? [{ label: 'Views', value: views, icon: Eye, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' }] : []),
        { label: 'Likes', value: engagement?.likes, icon: Heart, iconBg: 'bg-pink-50', iconColor: 'text-pink-600', rate: views ? ((engagement?.likes / views) * 100).toFixed(2) : null },
        { label: 'Comments', value: engagement?.comments, icon: MessageCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', rate: views ? ((engagement?.comments / views) * 100).toFixed(2) : null },
        { label: 'Saves', value: engagement?.saves, icon: Bookmark, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
        { label: 'Shares', value: engagement?.shares, icon: Share2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    ];

    return (
        <div className="max-w-6xl mx-auto pb-6">
            <PostAnalyticsHeader
                platform="instagram"
                title="Instagram post analytics"
                subtitle={`@${media?.username} · ${formatDate(media?.timestamp)}`}
                permalink={media?.permalink}
                onRefresh={() => loadInsights(true)}
                refreshing={refreshing}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                <div className="analytics-panel overflow-hidden">
                    <div className="relative aspect-square bg-[#1a1a1a]">
                        {isVideo && media?.mediaUrl ? (
                            <video src={media.mediaUrl} poster={media.thumbnailUrl} controls className="w-full h-full object-contain" />
                        ) : media?.mediaUrl ? (
                            <img src={media.mediaUrl} alt={media.caption || 'Instagram post'} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">📷</div>
                        )}
                        {isVideo && (
                            <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                <Play className="w-4 h-4" />
                                {media?.mediaType === 'REELS' ? 'Reel' : 'Video'}
                            </div>
                        )}
                    </div>
                    {media?.caption && (
                        <div className="p-4 border-t border-[var(--viralix-border)]">
                            <p className="text-[var(--viralix-accent)] text-sm leading-relaxed whitespace-pre-wrap">{media.caption}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                    <EngagementMetricGrid metrics={metricCards} columns={isVideo ? 3 : 2} />
                    <EngagementBreakdownPanel
                        views={views}
                        likes={engagement?.likes}
                        comments={engagement?.comments}
                        shares={engagement?.shares}
                        saves={engagement?.saves}
                        reach={engagement?.reach}
                        totalInteractions={engagement?.totalInteractions}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                {/* Auto-Reply Rules Section */}
                <div className="analytics-panel p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--viralix-border)]">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-[var(--viralix-accent)]">Auto-Reply DM</h2>
                                <p className="text-xs text-[var(--viralix-muted)]">Automated responses for this post</p>
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
                <div className="analytics-panel p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-[var(--viralix-accent)] mb-4 pb-3 border-b border-[var(--viralix-border)]">
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
    );
}

