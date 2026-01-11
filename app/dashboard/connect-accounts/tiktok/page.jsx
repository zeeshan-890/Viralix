"use client";
import { useCallback, useEffect, useState } from "react";
import { tiktokAPI } from "@/lib/api";
import Link from "next/link";
import { Music2, Video, CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw, Trash2, Eye, Heart, MessageCircle, Share2, Users } from "lucide-react";

export default function TikTokManagePage() {
    const [status, setStatus] = useState({ connected: false, accounts: [] });
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountDetails, setAccountDetails] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadStatus = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await tiktokAPI.status();
            setStatus(data);
            // Auto-select first account if available
            if (data.accounts?.length > 0 && !selectedAccount) {
                setSelectedAccount(data.accounts[0]);
            }
        } catch (e) {
            console.error('Failed to load TikTok status:', e);
            setMessage({ type: 'error', text: 'Failed to load TikTok accounts' });
        } finally {
            setLoading(false);
        }
    }, [selectedAccount]);

    const loadAccountDetails = useCallback(async (accountId) => {
        if (!accountId) return;
        setLoadingDetails(true);
        try {
            const { data } = await tiktokAPI.account(accountId);
            setAccountDetails(data);
        } catch (e) {
            console.error('Failed to load account details:', e);
            // Don't show error, profile endpoint might not be fully implemented
        }

        // Load videos
        try {
            const { data: videoData } = await tiktokAPI.videos(accountId);
            setVideos(videoData.videos || []);
        } catch (e) {
            console.error('Failed to load videos:', e);
        }
        setLoadingDetails(false);
    }, []);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    useEffect(() => {
        if (selectedAccount?.accountId) {
            loadAccountDetails(selectedAccount.accountId);
        }
    }, [selectedAccount, loadAccountDetails]);

    const handleRefreshToken = async (accountId) => {
        setRefreshing(true);
        try {
            await tiktokAPI.refresh(accountId);
            setMessage({ type: 'success', text: 'Token refreshed successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            loadStatus();
        } catch (e) {
            console.error('Failed to refresh token:', e);
            setMessage({ type: 'error', text: 'Failed to refresh token. Please reconnect.' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleDisconnect = async (accountId) => {
        if (!confirm('Are you sure you want to disconnect this TikTok account?')) return;
        try {
            await tiktokAPI.disconnect(accountId);
            setMessage({ type: 'success', text: 'Account disconnected successfully' });
            setSelectedAccount(null);
            setAccountDetails(null);
            setVideos([]);
            loadStatus();
        } catch (e) {
            console.error('Failed to disconnect:', e);
            setMessage({ type: 'error', text: 'Failed to disconnect account' });
        }
    };

    const handleConnect = async () => {
        try {
            const { data } = await tiktokAPI.connect();
            if (data?.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (e) {
            console.error('Failed to start connection:', e);
            setMessage({ type: 'error', text: 'Failed to start TikTok connection' });
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/connect-accounts"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Connect Accounts
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-black">
                        <Music2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>TikTok Accounts</h1>
                        <p className="text-gray-600">Manage your connected TikTok accounts</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                        {message.text}
                    </span>
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#84A98C' }} />
                    <p className="text-gray-600">Loading TikTok accounts...</p>
                </div>
            ) : !status.connected || status.accounts?.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Music2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: '#354F52' }}>No TikTok Accounts Connected</h2>
                    <p className="text-gray-600 mb-6">Connect your TikTok account to start publishing videos</p>
                    <button
                        onClick={handleConnect}
                        className="px-6 py-3 rounded-lg text-white font-medium shadow-md hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
                        style={{ backgroundColor: '#000' }}
                    >
                        <Music2 className="w-5 h-5" />
                        Connect TikTok Account
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Account List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-4">Connected Accounts</h3>
                            <div className="space-y-2">
                                {status.accounts.map(account => (
                                    <button
                                        key={account.accountId}
                                        onClick={() => setSelectedAccount(account)}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedAccount?.accountId === account.accountId
                                                ? 'border-black bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                                                <Music2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {account.accountName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {account.isExpired ? (
                                                        <span className="text-amber-600">Token Expired</span>
                                                    ) : (
                                                        <span className="text-green-600">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleConnect}
                                className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Music2 className="w-4 h-4" />
                                Add Another Account
                            </button>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="lg:col-span-2">
                        {selectedAccount ? (
                            <div className="space-y-6">
                                {/* Profile Card */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
                                                {accountDetails?.profile?.avatarUrl ? (
                                                    <img
                                                        src={accountDetails.profile.avatarUrl}
                                                        alt={selectedAccount.accountName}
                                                        className="w-16 h-16 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <Music2 className="w-8 h-8 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold" style={{ color: '#354F52' }}>
                                                    {accountDetails?.profile?.displayName || selectedAccount.accountName}
                                                </h2>
                                                {accountDetails?.profile?.username && (
                                                    <p className="text-gray-600">@{accountDetails.profile.username}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    {selectedAccount.isExpired ? (
                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                            Token Expired
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                                                            Connected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRefreshToken(selectedAccount.accountId)}
                                                disabled={refreshing}
                                                className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                                Refresh
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(selectedAccount.accountId)}
                                                className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Disconnect
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {accountDetails?.profile && (
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                                    {formatNumber(accountDetails.profile.followerCount)}
                                                </div>
                                                <div className="text-xs text-gray-600">Followers</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                                    {formatNumber(accountDetails.profile.followingCount)}
                                                </div>
                                                <div className="text-xs text-gray-600">Following</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                                    {formatNumber(accountDetails.profile.likesCount)}
                                                </div>
                                                <div className="text-xs text-gray-600">Likes</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <div className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                                    {formatNumber(accountDetails.profile.videoCount)}
                                                </div>
                                                <div className="text-xs text-gray-600">Videos</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Videos */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Recent Videos
                                    </h3>

                                    {loadingDetails ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                                        </div>
                                    ) : videos.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Video className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>No videos found</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {videos.slice(0, 6).map(video => (
                                                <a
                                                    key={video.id}
                                                    href={video.share_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden"
                                                >
                                                    {video.cover_image_url && (
                                                        <img
                                                            src={video.cover_image_url}
                                                            alt={video.title || 'TikTok video'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                        <div className="text-white text-xs space-y-1">
                                                            <div className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                {formatNumber(video.view_count)}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Heart className="w-3 h-3" />
                                                                {formatNumber(video.like_count)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Info Box */}
                                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                                    <div className="flex items-start gap-2">
                                        <Video className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Publishing to TikTok</p>
                                            <p>Videos published through Viralix will be posted as private by default until your TikTok app is reviewed. You can change the privacy setting in the TikTok app after posting.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Music2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600">Select an account to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
