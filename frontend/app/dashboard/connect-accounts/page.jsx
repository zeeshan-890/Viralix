"use client";
import { useCallback, useEffect, useState } from "react";
import { facebookAPI, tiktokAPI, youtubeAPI } from "@/lib/api";
import notify from "@/lib/notify";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, AlertCircle, HelpCircle, BookOpen } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { platformButtonClass } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import TikTokPublishingStatus from '@/components/tiktok/TikTokPublishingStatus';
import TikTokAccountTypeBadge from '@/components/tiktok/TikTokAccountTypeBadge';
import { cn } from '@/lib/utils';

export default function ConnectAccountsPage() {
    const { accounts, isLoading, disconnect } = useAccounts();
    const [connecting, setConnecting] = useState(false);
    const [connectingTikTok, setConnectingTikTok] = useState(false);
    const [connectingYouTube, setConnectingYouTube] = useState(false);

    // Derive statuses from unified accounts list
    // All platforms now come from the unified useAccounts() hook
    const fbAccounts = accounts.filter(a => a.platform === 'facebook');
    const igAccounts = accounts.filter(a => a.platform === 'instagram');
    const ttAccounts = accounts.filter(a => a.platform === 'tiktok');
    const ytAccounts = accounts.filter(a => a.platform === 'youtube');

    // Derive Facebook status from unified accounts (for backward compatibility with UI)
    const [fbStatus, setFbStatus] = useState({ connected: false, account: null, pages: [] });

    useEffect(() => {
        // Derive FB status from unified accounts
        const fbAccts = accounts.filter(a => a.platform === 'facebook');
        if (fbAccts.length > 0) {
            const fb = fbAccts[0];
            setFbStatus({
                connected: true,
                account: { id: fb.platformAccountId, name: fb.accountName },
                pages: [] // Pages are stored in user.settings, fetched separately if needed
            });
        } else {
            setFbStatus({ connected: false, account: null, pages: [] });
        }
    }, [accounts]);

    // Handle URL params for success/error
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');

        if (success) {
            let text = 'Account connected successfully!';
            if (success === 'instagram_connected') text = 'Instagram account connected successfully!';
            if (success === 'tiktok_connected') text = 'TikTok account connected successfully!';
            if (success === 'youtube_connected') text = 'YouTube channel connected successfully!';

            notify.success(text);
            window.history.replaceState({}, '', window.location.pathname);
        } else if (error) {
            notify.error(decodeURIComponent(error));
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleDisconnect = async (platform, accountId) => {
        if (!confirm(`Are you sure you want to disconnect this ${platform} account?`)) return;
        try {
            await disconnect({ platform, accountId });
            notify.success(`${platform} account disconnected.`);
        } catch (e) {
            notify.error('Failed to disconnect.');
        }
    };

    const connectFacebook = async () => {
        setConnecting(true);
        try {
            const { data } = await facebookAPI.startUrl();
            if (data?.url) {
                const w = 600, h = 700;
                const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
                const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
                window.open(data.url, 'fbconnect', `popup=yes,width=${w},height=${h},top=${y},left=${x}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setConnecting(false);
        }
    };

    const disconnectFacebook = async () => {
        if (!confirm('Are you sure you want to disconnect Facebook?')) return;
        await facebookAPI.disconnect();
        const { data } = await facebookAPI.status();
        setFbStatus(data);
    };

    const connectTikTok = async () => {
        setConnectingTikTok(true);
        try {
            const { data } = await tiktokAPI.connect();
            if (data?.authUrl) window.location.href = data.authUrl;
        } catch (e) {
            notify.error('Failed to connect TikTok.');
            setConnectingTikTok(false);
        }
    };

    const connectYouTube = async () => {
        setConnectingYouTube(true);
        try {
            const { data } = await youtubeAPI.connect();
            if (data?.authUrl) window.location.href = data.authUrl;
        } catch (e) {
            notify.error('Failed to connect YouTube.');
            setConnectingYouTube(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#354F52' }}>Connect Accounts</h1>
                <p className="text-gray-600">Link your social media platforms to Viralix.</p>
            </div>

            {/* Banner */}
            <div className="mb-8 p-5 rounded-xl border border-amber-200 bg-amber-50 shadow-sm flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-100 border border-amber-200">
                        <BookOpen className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <p className="text-sm text-amber-900 leading-relaxed font-medium">
                            To enable Instagram publishing with the Meta Graph API your Instagram Business/Creator account must be linked to a Facebook Page.
                        </p>
                    </div>
                </div>
                <div className="md:ml-auto flex items-center gap-3">
                    <Link
                        href="/guide/instagram-linking"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:shadow-md transition"
                        style={{ backgroundColor: '#84A98C' }}
                    >
                        Open Guide <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-12 text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#84A98C' }} />
                    <p className="text-gray-600">Loading accounts...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Facebook */}
                    <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[var(--viralix-surface)] border border-[var(--viralix-border)] shadow-sm">
                                    <PlatformIcon platform="facebook" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#354F52' }}>Facebook</h2>
                                    <p className="text-sm text-gray-600">Connect to manage Pages</p>
                                </div>
                            </div>
                            {!fbStatus.connected ? (
                                <button onClick={connectFacebook} disabled={connecting} className={cn('px-5 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-2', platformButtonClass('facebook'))}>
                                    {connecting ? <Loader2 className="animate-spin w-4 h-4" /> : <PlatformIcon platform="facebook" size={16} inverted />} Connect
                                </button>
                            ) : (
                                <button onClick={disconnectFacebook} className="px-5 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-50 font-medium">Disconnect</button>
                            )}
                        </div>
                        {fbStatus.connected && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                    <CheckCircle2 className="w-5 h-5" /> <span className="font-medium text-gray-900">{fbStatus.account?.name}</span>
                                </div>
                                <div className="text-sm text-gray-500">{fbStatus.pages?.length} Pages Connected</div>
                            </div>
                        )}
                    </div>

                    {/* Instagram */}
                    <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[var(--viralix-surface)] border border-[var(--viralix-border)] shadow-sm">
                                    <PlatformIcon platform="instagram" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#354F52' }}>Instagram</h2>
                                    <p className="text-sm text-gray-600">Direct OAuth Connection</p>
                                </div>
                            </div>
                            <Link href="/dashboard/connect-accounts/instagram-oauth" className={cn('px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2', platformButtonClass('instagram'))}>
                                <PlatformIcon platform="instagram" size={16} inverted /> {igAccounts.length > 0 ? 'Manage' : 'Connect'}
                            </Link>
                        </div>
                        {igAccounts.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                {igAccounts.map(acc => (
                                    <div key={acc.platformAccountId || acc._id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--viralix-surface)] border border-[var(--viralix-border)] flex items-center justify-center">
                                                <PlatformIcon platform="instagram" size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium">@{acc.accountName || acc.metadata?.username || 'Instagram Account'}</div>
                                                <div className="text-xs text-gray-500">{acc.metadata?.accountType || 'Business'}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDisconnect('instagram', acc.platformAccountId)} className="text-xs text-red-600 hover:text-red-800">Disconnect</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TikTok */}
                    <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[var(--viralix-surface)] border border-[var(--viralix-border)] shadow-sm">
                                    <PlatformIcon platform="tiktok" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#354F52' }}>TikTok</h2>
                                    <p className="text-sm text-gray-600">Share video content</p>
                                </div>
                            </div>
                            {!ttAccounts.length ? (
                                <button onClick={connectTikTok} disabled={connectingTikTok} className={cn('px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2', platformButtonClass('tiktok'))}>
                                    {connectingTikTok ? <Loader2 className="animate-spin w-4 h-4" /> : <PlatformIcon platform="tiktok" size={16} inverted />} Connect
                                </button>
                            ) : (
                                <Link href="/dashboard/connect-accounts/tiktok" className={cn('px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2', platformButtonClass('tiktok'))}>
                                    Manage
                                </Link>
                            )}
                        </div>
                        {ttAccounts.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                {ttAccounts.map(acc => (
                                    <div key={acc.platformAccountId} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                                <PlatformIcon platform="tiktok" size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate">{acc.accountName}</div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <TikTokAccountTypeBadge accountId={acc.platformAccountId} size="sm" />
                                                    <TikTokPublishingStatus
                                                        accountId={acc.platformAccountId}
                                                        tokenExpired={acc.isExpired}
                                                        variant="compact"
                                                        className="hidden sm:block"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDisconnect('tiktok', acc.platformAccountId)} className="text-xs text-red-600 hover:text-red-800 shrink-0">Disconnect</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* YouTube */}
                    <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[var(--viralix-surface)] border border-[var(--viralix-border)] shadow-sm">
                                    <PlatformIcon platform="youtube" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#354F52' }}>YouTube</h2>
                                    <p className="text-sm text-gray-600">Share video content</p>
                                </div>
                            </div>
                            {!ytAccounts.length ? (
                                <button onClick={connectYouTube} disabled={connectingYouTube} className={cn('px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2', platformButtonClass('youtube'))}>
                                    {connectingYouTube ? <Loader2 className="animate-spin w-4 h-4" /> : <PlatformIcon platform="youtube" size={16} inverted />} Connect
                                </button>
                            ) : (
                                <Link href="/dashboard/connect-accounts/youtube" className="px-5 py-2.5 rounded-lg border-2 border-gray-200 hover:bg-gray-50 font-medium flex items-center gap-2">
                                    <PlatformIcon platform="youtube" size={16} />
                                    Manage
                                </Link>
                            )}
                        </div>
                        {ytAccounts.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                {ytAccounts.map(acc => (
                                    <div key={acc.platformAccountId} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                                <PlatformIcon platform="youtube" size={20} />
                                            </div>
                                            <div className="font-medium">{acc.accountName}</div>
                                        </div>
                                        <button onClick={() => handleDisconnect('youtube', acc.platformAccountId)} className="text-xs text-red-600 hover:text-red-800">Disconnect</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
