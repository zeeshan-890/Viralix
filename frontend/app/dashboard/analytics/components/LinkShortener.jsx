'use client';
import notify from '@/lib/notify';
import { useState, useEffect } from 'react';
import { linksAPI } from '@/lib/api';

export default function LinkShortener() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [copied, setCopied] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadLinks();
    }, []);

    const loadLinks = async () => {
        setLoading(true);
        try {
            const res = await linksAPI.list();
            setLinks(res.data.links || []);
        } catch (err) {
            console.error('Links error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!url) return;
        setCreating(true);
        try {
            const res = await linksAPI.create({ originalUrl: url, title });
            setLinks([res.data, ...links]);
            setUrl('');
            setTitle('');
            setShowForm(false);
        } catch (err) {
            notify.error(err.response?.data?.message || 'Failed to create link');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this link?')) return;
        try {
            await linksAPI.remove(id);
            setLinks(links.filter(l => l._id !== id));
            if (selectedLink === id) { setSelectedLink(null); setStats(null); }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleCopy = (shortUrl, id) => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleViewStats = async (id) => {
        if (selectedLink === id) { setSelectedLink(null); setStats(null); return; }
        setSelectedLink(id);
        try {
            const res = await linksAPI.getStats(id);
            setStats(res.data);
        } catch (err) {
            console.error('Stats error:', err);
        }
    };

    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

    return (
        <div className="dash-card rounded-lg border border-[var(--viralix-border)] p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        🔗 Link Shortener
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {links.length} links · {totalClicks} total clicks
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 btn btn-confirm text-white text-sm rounded-lg  transition flex items-center gap-1"
                >
                    <span>+</span> New Link
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/your-long-url"
                                required
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Label (optional)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Summer Campaign"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-4 py-2 btn btn-confirm text-white text-sm rounded-lg  disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Short Link'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setUrl(''); setTitle(''); }}
                                className="btn btn-cancel btn-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Links List */}
            {loading ? (
                <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
            ) : links.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <span className="text-3xl mb-2">🔗</span>
                    <p>No short links yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map(link => (
                        <div key={link._id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {link.title && (
                                        <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                                    )}
                                    <p className="text-xs text-blue-600 font-mono truncate">{link.shortUrl}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{link.originalUrl}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                        🖱️ {link.clicks || 0}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(link.shortUrl, link._id)}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                                        title="Copy short link"
                                    >
                                        {copied === link._id ? '✅' : '📋'}
                                    </button>
                                    <button
                                        onClick={() => handleViewStats(link._id)}
                                        className={`px-2 py-1 text-xs rounded transition ${selectedLink === link._id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        title="View stats"
                                    >
                                        📊
                                    </button>
                                    <button
                                        onClick={() => handleDelete(link._id)}
                                        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 rounded transition"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {/* Inline Stats */}
                            {selectedLink === link._id && stats && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-2 bg-gray-50 rounded">
                                            <p className="text-lg font-bold text-gray-900">{stats.totalClicks}</p>
                                            <p className="text-xs text-gray-500">Total Clicks</p>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded">
                                            <p className="text-lg font-bold text-gray-900">{stats.recentClickCount}</p>
                                            <p className="text-xs text-gray-500">Last 30 days</p>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded">
                                            <p className="text-lg font-bold text-gray-900">{stats.topReferrers?.length || 0}</p>
                                            <p className="text-xs text-gray-500">Referrers</p>
                                        </div>
                                    </div>
                                    {stats.topReferrers?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 mb-1">Top Referrers</p>
                                            {stats.topReferrers.slice(0, 5).map((r, i) => (
                                                <div key={i} className="flex justify-between text-xs py-0.5">
                                                    <span className="text-gray-600 truncate">{r.referrer}</span>
                                                    <span className="text-gray-900 font-medium">{r.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
