"use client";
import { useCallback, useEffect, useState } from "react";
import { facebookAPI } from "@/lib/api";
import Link from "next/link";

export default function FacebookDetailPage() {
    const [status, setStatus] = useState({ connected: false, account: null, pages: [], defaultPageId: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await facebookAPI.status();
            setStatus(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const refreshPages = async () => {
        setSaving(true);
        try {
            await facebookAPI.refresh();
            await load();
        } finally {
            setSaving(false);
        }
    };

    const setDefault = async (pageId) => {
        setSaving(true);
        try {
            await facebookAPI.setDefaultPage(pageId);
            await load();
        } finally {
            setSaving(false);
        }
    };

    const reconnect = () => {
        const w = 600, h = 700;
        const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
        const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        window.open(`${base}/facebook/oauth/start`, 'fbconnect', `popup=yes,width=${w},height=${h},top=${y},left=${x}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Facebook Connection</h1>
                    <p className="text-gray-600">Manage your connected Facebook account and pages.</p>
                </div>
                <Link href="/dashboard/connect-accounts" className="text-sm text-blue-600 hover:underline">Back</Link>
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Loading…</div>
            ) : !status.connected ? (
                <div className="text-sm text-gray-500">Facebook is not connected.</div>
            ) : (
                <div className="bg-white border rounded-lg p-6 space-y-4">
                    <div>
                        <div className="text-sm text-gray-600">Connected account</div>
                        <div className="text-base font-medium">{status.account?.name} (ID: {status.account?.id})</div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={refreshPages} disabled={saving} className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50">Refresh Pages</button>
                        <button onClick={reconnect} className="px-3 py-2 rounded border hover:bg-gray-50">Reconnect & Reauthorize</button>
                    </div>

                    <div>
                        <div className="text-sm text-gray-600 mb-2">Pages</div>
                        {status.pages?.length ? (
                            <ul className="space-y-2">
                                {status.pages.map(p => (
                                    <li key={p.id} className="flex items-center justify-between border rounded p-3">
                                        <div>
                                            <Link href={`/dashboard/connect-accounts/facebook/${p.id}`} className="font-medium text-blue-600 hover:underline">
                                                {p.name}
                                            </Link>
                                            <div className="text-xs text-gray-500">{p.category}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {status.defaultPageId === p.id ? (
                                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Default</span>
                                            ) : (
                                                <button onClick={() => setDefault(p.id)} disabled={saving} className="text-xs px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50">Set Default</button>
                                            )}
                                            <Link href={`/dashboard/connect-accounts/facebook/${p.id}`} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">Open</Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-500 space-y-2">
                                <div>No pages found for this Facebook account.</div>
                                <ul className="list-disc list-inside text-gray-600">
                                    <li>Make sure this Facebook profile is an admin/editor of a Page.</li>
                                    <li>Click “Reconnect & Reauthorize” and allow the Pages permissions.</li>
                                    <li>If your app is in Development mode, add this FB profile as a tester in the Meta app.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
