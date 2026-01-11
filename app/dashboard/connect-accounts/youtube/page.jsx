'use client';
import { useState, useEffect } from 'react';
import { Youtube, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { youtubeAPI } from '@/lib/api';
import { useAccounts } from '@/hooks/useAccounts';

export default function YouTubeManagePage() {
    const { accounts, isLoading, disconnect } = useAccounts();
    const [message, setMessage] = useState({ type: '', text: '' });
    const [connecting, setConnecting] = useState(false);

    const ytAccounts = accounts.filter(a => a.platform === 'youtube');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');

        if (success === 'youtube_connected') {
            setMessage({ type: 'success', text: 'YouTube channel connected successfully!' });
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } else if (error) {
            setMessage({ type: 'error', text: decodeURIComponent(error) });
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => setMessage({ type: '', text: '' }), 7000);
        }
    }, []);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const { data } = await youtubeAPI.connect();
            if (data?.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to connect YouTube' });
            setConnecting(false);
        }
    };

    const handleDisconnect = async (accountId) => {
        if (!confirm('Are you sure you want to disconnect this YouTube channel?')) return;
        try {
            await disconnect({ platform: 'youtube', accountId });
            setMessage({ type: 'success', text: 'YouTube channel disconnected' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to disconnect' });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-600">
                        <Youtube className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>
                            YouTube Channels
                        </h1>
                        <p className="text-gray-600">Manage your connected YouTube channels</p>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                        {message.text}
                    </span>
                </div>
            )}

            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#84A98C' }} />
                    <p className="text-gray-600">Loading YouTube channels...</p>
                </div>
            ) : (
                <>
                    {/* Connected Accounts */}
                    {ytAccounts.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4" style={{ color: '#354F52' }}>
                                Connected Channels
                            </h2>
                            <div className="space-y-4">
                                {ytAccounts.map((account) => (
                                    <div
                                        key={account.platformAccountId || account._id}
                                        className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 text-white">
                                                <Youtube className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold" style={{ color: '#354F52' }}>
                                                    {account.accountName}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Connected on {formatDate(account.connectedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(account.platformAccountId)}
                                            className="px-4 py-2 text-sm font-medium text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Connect New Account */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-600">
                            <Youtube className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2" style={{ color: '#354F52' }}>
                            {ytAccounts.length > 0 ? 'Connect Another Channel' : 'Connect Your YouTube Channel'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Authorize Viralix to upload videos to your YouTube channel
                        </p>

                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-all disabled:opacity-50 bg-red-600"
                        >
                            {connecting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Youtube className="w-5 h-5" />
                                    Connect YouTube
                                    <ExternalLink className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Back to Connect Accounts */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/dashboard/connect-accounts"
                            className="text-sm font-medium hover:underline"
                            style={{ color: '#84A98C' }}
                        >
                            ← Back to Connect Accounts
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
