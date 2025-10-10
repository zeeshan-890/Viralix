"use client";
import { useCallback, useEffect, useState } from "react";
import { facebookAPI } from "@/lib/api";
import Link from "next/link";
import { Facebook, Instagram, CheckCircle2, ExternalLink, Loader2, AlertCircle, HelpCircle, BookOpen } from "lucide-react";
import axios from "axios";

const API_URL = 'https://viralix-b3ff86cb412f.herokuapp.com';

export default function ConnectAccountsPage() {
    const [fbStatus, setFbStatus] = useState({ connected: false, account: null, pages: [] });
    const [igStatus, setIgStatus] = useState({ connected: false, accounts: [] });
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadStatuses = useCallback(async () => {
        setLoading(true);
        try {
            // Load Facebook status
            const { data: fbData } = await facebookAPI.status();
            setFbStatus(fbData);

            // Load Instagram OAuth status
            const token = localStorage.getItem('auth_token');
            const { data: igData } = await axios.get(`${API_URL}/api/instagram-oauth/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIgStatus(igData);
        } catch (e) {
            console.error('Failed to load statuses:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStatuses();

        // Check for URL parameters (success/error messages)
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');

        if (success === 'instagram_connected') {
            setMessage({ type: 'success', text: 'Instagram account connected successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (error) {
            setMessage({ type: 'error', text: decodeURIComponent(error) });
            setTimeout(() => setMessage({ type: '', text: '' }), 7000);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [loadStatuses]);

    useEffect(() => {
        function onMessage(e) {
            if (e.data?.provider === 'facebook' && e.data?.status === 'success') {
                setConnecting(false);
                loadStatuses();
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [loadStatuses]);

    const connectFacebook = async () => {
        setConnecting(true);
        try {
            const { data } = await facebookAPI.startUrl();
            const authUrl = data?.url;
            if (!authUrl) throw new Error('No URL received');
            const w = 600, h = 700;
            const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
            const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
            window.open(authUrl, 'fbconnect', `popup=yes,width=${w},height=${h},top=${y},left=${x}`);
        } catch (e) {
            console.error('Failed to start Facebook OAuth', e);
            setConnecting(false);
        }
    };

    const disconnectFacebook = async () => {
        if (!confirm('Are you sure you want to disconnect Facebook? This will also disconnect any linked Instagram accounts.')) return;
        await facebookAPI.disconnect();
        loadStatuses();
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#354F52' }}>Connect Accounts</h1>
                <p className="text-gray-600">Link your social media platforms to Viralix.</p>
            </div>

            {/* Instagram Publishing Requirements Banner */}
            <div className="mb-8 p-5 rounded-xl border border-amber-200 bg-amber-50 shadow-sm flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-100 border border-amber-200">
                        <BookOpen className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <p className="text-sm text-amber-900 leading-relaxed font-medium">
                            To enable Instagram publishing with the Meta Graph API your Instagram Business/Creator account must be linked to a Facebook Page and authorized with the correct permissions.
                        </p>
                        <p className="mt-2 text-xs text-amber-800">A Basic Display / direct-only token (graph.instagram.com) cannot publish and will show <code>Unsupported request</code> errors.</p>
                    </div>
                </div>
                <div className="md:ml-auto flex items-center gap-3">
                    <Link
                        href="/guide/instagram-linking"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:shadow-md transition"
                        style={{ backgroundColor: '#84A98C' }}
                    >
                        Open Linking Guide
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Success/Error Messages */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
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
                    <p className="text-gray-600">Loading connected accounts...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Facebook Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50">
                                    <Facebook className="w-7 h-7 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#354F52' }}>Facebook</h2>
                                    <p className="text-sm text-gray-600">Connect to manage Pages and publish content</p>
                                </div>
                            </div>
                            {!fbStatus.connected ? (
                                <button
                                    onClick={connectFacebook}
                                    disabled={connecting}
                                    className="px-5 py-2.5 rounded-lg text-white hover:opacity-90 disabled:opacity-50 transition-all font-medium shadow-md flex items-center gap-2"
                                    style={{ backgroundColor: '#84A98C' }}
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Facebook className="w-4 h-4" />
                                            Connect Facebook
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={disconnectFacebook}
                                    className="px-5 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Disconnect
                                </button>
                            )}
                        </div>

                        {fbStatus.connected && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-gray-900">Connected Account</span>
                                    </div>
                                    <div className="text-base font-semibold" style={{ color: '#354F52' }}>
                                        {fbStatus.account?.name}
                                    </div>
                                    <Link
                                        href="/dashboard/connect-accounts/facebook"
                                        className="text-sm font-medium hover:underline ml-auto"
                                        style={{ color: '#84A98C' }}
                                    >
                                        Manage Pages →
                                    </Link>
                                </div>

                                {fbStatus.pages?.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-3">
                                            Connected Pages ({fbStatus.pages.length})
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {fbStatus.pages.slice(0, 4).map(p => (
                                                <div key={p.id} className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.category}</div>
                                                    </div>
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200 ml-2">
                                                        Active
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {fbStatus.pages.length > 4 && (
                                            <Link
                                                href="/dashboard/connect-accounts/facebook"
                                                className="text-sm font-medium hover:underline mt-3 inline-block"
                                                style={{ color: '#84A98C' }}
                                            >
                                                View all {fbStatus.pages.length} pages →
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {!fbStatus.connected && (
                            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#F7FAF8' }}>
                                <p className="text-sm text-gray-600">
                                    Connect your Facebook account to manage Pages and publish content directly from Viralix.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Instagram Direct OAuth Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
                                    <Instagram className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-semibold" style={{ color: '#354F52' }}>Instagram</h2>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                                            Direct OAuth
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Direct token connection (read capabilities). For publishing follow the guide below.</p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/connect-accounts/instagram-oauth"
                                className="px-5 py-2.5 rounded-lg text-white hover:opacity-90 transition-all font-medium shadow-md flex items-center gap-2"
                                style={{ backgroundColor: '#84A98C' }}
                            >
                                <Instagram className="w-4 h-4" />
                                {igStatus.connected ? 'Manage' : 'Connect Instagram'}
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>

                        {igStatus.connected && igStatus.accounts.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                        Connected Accounts ({igStatus.accounts.length})
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {igStatus.accounts.slice(0, 3).map(account => (
                                        <div key={account.accountId} className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#84A98C' }}>
                                                    <Instagram className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">@{account.username}</div>
                                                    <div className="text-xs text-gray-500">{account.accountType} Account</div>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                                                Active
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
                            <div className="flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    This direct connection is limited. To actually publish posts/reels you must link your IG account to a Facebook Page first. <Link href="/guide/instagram-linking" className="underline font-medium">See Linking Guide</Link>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Instagram via Facebook (Legacy) */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm opacity-75">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gray-100">
                                    <Instagram className="w-7 h-7 text-gray-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-semibold text-gray-600">Instagram via Facebook</h2>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                                            Legacy
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Manage Instagram through Facebook Pages</p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/connect-accounts/instagram"
                                className="px-5 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors font-medium text-gray-700"
                            >
                                View Legacy
                            </Link>
                        </div>

                        <div className="mt-4 p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Legacy method requiring Facebook page linked to Instagram Business account.
                                We recommend using the Direct OAuth method above instead.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
