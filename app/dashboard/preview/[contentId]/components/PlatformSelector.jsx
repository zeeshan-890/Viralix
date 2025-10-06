'use client';
import { useEffect, useState } from 'react';
import { facebookAPI, instagramAPI } from '@/lib/api';

export default function PlatformSelector({ value = [], onChange }) {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [fbRes, igRes] = await Promise.allSettled([
                    facebookAPI.status(),
                    instagramAPI.status(),
                ]);
                const list = [];
                if (fbRes.status === 'fulfilled') {
                    const pages = fbRes.value?.data?.pages || [];
                    for (const p of pages) list.push({ name: 'facebook', accountId: p.id, label: `Facebook — ${p.name}`, key: `facebook:${p.id}`, icon: '📘' });
                }
                if (igRes.status === 'fulfilled') {
                    const accounts = igRes.value?.data?.accounts || [];
                    for (const a of accounts) list.push({ name: 'instagram', accountId: a.igUserId, label: `Instagram — ${a.pageName || a.igUserId}`, key: `instagram:${a.igUserId}`, icon: '📷' });
                }
                if (!cancelled) setTargets(list);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const toggle = (t) => {
        const exists = value.some(p => p.name === t.name && p.accountId === t.accountId);
        const next = exists ? value.filter(p => !(p.name === t.name && p.accountId === t.accountId)) : [...value, { name: t.name, accountId: t.accountId }];
        onChange(next);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Platforms</h3>
            {loading ? (
                <div className="text-sm text-gray-500">Loading connected accounts…</div>
            ) : targets.length === 0 ? (
                <div className="text-sm text-gray-500">No connected Facebook pages or Instagram accounts.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {targets.map(t => {
                        const selected = value.some(p => p.name === t.name && p.accountId === t.accountId);
                        return (
                            <button key={t.key} onClick={() => toggle(t)} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                                <div className="flex items-center space-x-2">
                                    <span>{t.icon}</span>
                                    <span className="text-sm font-medium">{t.label}</span>
                                </div>
                                {selected && <span className="text-xs">Selected</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
