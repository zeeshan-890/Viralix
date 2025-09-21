"use client";
import { useCallback, useEffect, useState } from "react";
import { facebookAPI } from "@/lib/api";
import Link from "next/link";

export default function ConnectAccountsPage() {
    const [status, setStatus] = useState({ connected: false, account: null, pages: [] });
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await facebookAPI.status();
            setStatus(data);
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        function onMessage(e) {
            if (e.data?.provider === 'facebook' && e.data?.status === 'success') {
                setConnecting(false);
                load();
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [load]);

    const connectFacebook = () => {
        setConnecting(true);
        const w = 600, h = 700;
        const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
        const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        window.open(`${base}/facebook/oauth/start`, 'fbconnect', `popup=yes,width=${w},height=${h},top=${y},left=${x}`);
    };

    const disconnectFacebook = async () => {
        await facebookAPI.disconnect();
        load();
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Connect Accounts</h1>
                <p className="text-gray-600">Link your social media platforms to AutoReach AI.</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">Facebook</h2>
                        <p className="text-sm text-gray-600">Connect to fetch Pages and publish as your Page.</p>
                    </div>
                    {!status.connected ? (
                        <button onClick={connectFacebook} disabled={connecting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {connecting ? 'Connecting…' : 'Connect Facebook'}
                        </button>
                    ) : (
                        <button onClick={disconnectFacebook} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                            Disconnect
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-sm text-gray-500 mt-4">Loading…</div>
                ) : status.connected ? (
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-600">Connected account</div>
                            <div className="text-base font-medium">{status.account?.name} (ID: {status.account?.id})</div>
                            <Link href="/dashboard/connect-accounts/facebook" className="text-sm text-blue-600 hover:underline">Manage</Link>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 mb-2">Pages</div>
                            {status.pages?.length ? (
                                <ul className="space-y-2">
                                    {status.pages.map(p => (
                                        <li key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                                            <div>
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.category}</div>
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Connected</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500">No pages found for this account.</div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">Instagram</h2>
                        <p className="text-sm text-gray-600">Manage Instagram via your connected Facebook Pages.</p>
                    </div>
                    <Link href="/dashboard/connect-accounts/instagram" className="px-4 py-2 rounded-lg border hover:bg-gray-50">Open</Link>
                </div>
                <div className="mt-4 text-sm text-gray-500">Instagram requires a Business/Creator account linked to a Facebook Page.</div>
            </div>
        </div>
    );
}
