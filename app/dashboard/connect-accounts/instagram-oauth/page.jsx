'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';

// const API_URL = 'https://viralix-b3ff86cb412f.herokuapp.com' ;
const API_URL = 'https://viralix-b3ff86cb412f.herokuapp.com';

export default function InstagramOAuthPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadInstagramStatus();

        // Check for OAuth callback status
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');
        const username = params.get('username');

        if (success) {
            const successMsg = username
                ? `Instagram account @${username} connected successfully!`
                : 'Instagram account connected successfully!';
            setMessage({ type: 'success', text: successMsg });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (error) {
            let errorMsg = decodeURIComponent(error);

            // Make error messages more user-friendly
            if (errorMsg.includes('long_lived_token_failed')) {
                errorMsg = 'Connected successfully! Your account is ready to use. (Note: Using short-term token - will auto-refresh)';
                setMessage({ type: 'success', text: errorMsg });
            } else if (errorMsg.includes('token_exchange_failed')) {
                errorMsg = 'Authentication failed. Please try connecting again.';
                setMessage({ type: 'error', text: errorMsg });
            } else if (errorMsg.includes('user_not_found')) {
                errorMsg = 'Session expired. Please log in again.';
                setMessage({ type: 'error', text: errorMsg });
            } else if (errorMsg.includes('missing_code_or_state')) {
                errorMsg = 'Invalid authentication response. Please try again.';
                setMessage({ type: 'error', text: errorMsg });
            } else {
                setMessage({ type: 'error', text: errorMsg });
            }

            setTimeout(() => setMessage({ type: '', text: '' }), 7000);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const loadInstagramStatus = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/api/instagram-oauth/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAccounts(response.data.accounts || []);
        } catch (error) {
            console.error('Failed to load Instagram status:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to load Instagram accounts'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/api/instagram-oauth/connect`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Redirect to Instagram OAuth
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Failed to initiate Instagram connection:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to connect Instagram'
            });
            setConnecting(false);
        }
    };

    const handleDisconnect = async (accountId) => {
        if (!confirm('Are you sure you want to disconnect this Instagram account?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`${API_URL}/api/instagram-oauth/disconnect/${accountId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Instagram account disconnected' });
            loadInstagramStatus();
        } catch (error) {
            console.error('Failed to disconnect Instagram:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to disconnect Instagram'
            });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isTokenExpiringSoon = (expiryDate) => {
        const daysUntilExpiry = (new Date(expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry < 7;
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                        <Image src="/instagram.png" alt="Instagram" width={24} height={24} className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>
                            Connect Instagram
                        </h1>
                        <p className="text-gray-600">Direct Instagram OAuth integration</p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This uses Instagram Basic Display API with direct OAuth.
                        No Facebook page linking required. Your Instagram account must be a Creator or Business account.
                    </p>
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

            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#84A98C' }} />
                    <p className="text-gray-600">Loading Instagram accounts...</p>
                </div>
            ) : (
                <>
                    {/* Connected Accounts */}
                    {accounts.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4" style={{ color: '#354F52' }}>
                                Connected Accounts
                            </h2>
                            <div className="space-y-4">
                                {accounts.map((account) => (
                                    <div
                                        key={account.accountId}
                                        className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                                                <Image src="/instagram.png" alt="Instagram" width={24} height={24} className="w-6 h-6 object-contain" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold" style={{ color: '#354F52' }}>
                                                        @{account.username}
                                                    </h3>
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                                                        {account.accountType}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Connected on {formatDate(account.connectedAt)}
                                                </p>
                                                {isTokenExpiringSoon(account.tokenExpiry) && (
                                                    <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                                                        <RefreshCw className="w-3 h-3" />
                                                        Token expires soon - will auto-refresh
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(account.accountId)}
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
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                            <Image src="/instagram.png" alt="Instagram" width={32} height={32} className="w-8 h-8 object-contain" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2" style={{ color: '#354F52' }}>
                            {accounts.length > 0 ? 'Connect Another Account' : 'Connect Your Instagram Account'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Authorize Viralix to access your Instagram profile and media
                        </p>

                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#84A98C' }}
                        >
                            {connecting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Image src="/instagram.png" alt="Info" width={20} height={20} className="w-5 h-5 object-contain brightness-0 invert" />
                                    Connect Instagram
                                    <ExternalLink className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Required Instagram Account Type:</strong>
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Creator Account</li>
                                <li>• Business Account</li>
                                <li>• Professional Account</li>
                            </ul>
                            <a
                                href="https://help.instagram.com/502981923235522"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm mt-3 inline-flex items-center gap-1 hover:underline"
                                style={{ color: '#84A98C' }}
                            >
                                Learn how to switch to a Professional account
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
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
