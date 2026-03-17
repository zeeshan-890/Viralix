"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { instagramAPI } from "@/lib/api";

export default function InstagramAccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await instagramAPI.status();
                setAccounts(data.accounts || []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Instagram</h1>
                    <p className="text-gray-600">Instagram accounts linked through your Facebook Pages.</p>
                </div>
                <Link href="/dashboard/connect-accounts" className="text-sm text-blue-600">Back</Link>
            </div>

            <div className="bg-white border rounded p-4">
                <div className="font-medium mb-3">Accounts</div>
                {loading ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                ) : accounts.length ? (
                    <ul className="space-y-2">
                        {accounts.map((a) => (
                            <li key={a.igUserId} className="flex items-center justify-between border rounded p-3">
                                <div>
                                    <div className="font-medium">{a.pageName}</div>
                                    <div className="text-xs text-gray-500">IG User: {a.igUserId}</div>
                                </div>
                                <Link href={`/dashboard/connect-accounts/instagram/${a.igUserId}`} className="text-blue-600">Open</Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-sm text-gray-500">No Instagram accounts detected. Ensure your Page is linked to an IG Business/Creator account.</div>
                )}
            </div>
        </div>
    );
}
