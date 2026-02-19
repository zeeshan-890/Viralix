'use client';
import { useState, useEffect } from 'react';
import { keywordAlertsAPI } from '@/lib/api';

export default function KeywordAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [notifications, setNotifications] = useState({ notifications: [], unreadCount: 0 });
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [platform, setPlatform] = useState('all');
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('alerts');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [alertsRes, notifRes] = await Promise.all([
                keywordAlertsAPI.list(),
                keywordAlertsAPI.getNotifications()
            ]);
            setAlerts(alertsRes.data.alerts || []);
            setNotifications(notifRes.data);
        } catch (err) {
            console.error('KeywordAlerts load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) return;
        setCreating(true);
        try {
            const res = await keywordAlertsAPI.create({ keyword: keyword.trim(), platform });
            setAlerts([res.data, ...alerts]);
            setKeyword('');
            setPlatform('all');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create alert');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await keywordAlertsAPI.toggle(id);
            setAlerts(alerts.map(a => a._id === id ? res.data : a));
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this keyword alert?')) return;
        try {
            await keywordAlertsAPI.remove(id);
            setAlerts(alerts.filter(a => a._id !== id));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await keywordAlertsAPI.markAllRead();
            setNotifications(prev => ({
                ...prev,
                unreadCount: 0,
                notifications: prev.notifications.map(n => ({ ...n, read: true }))
            }));
        } catch (err) {
            console.error('Mark read error:', err);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        🔔 Social Listening
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor comments for keywords
                        {notifications.unreadCount > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {notifications.unreadCount} new
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b">
                {[
                    { id: 'alerts', label: `Keywords (${alerts.length})` },
                    { id: 'notifications', label: `Notifications (${notifications.unreadCount})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'alerts' && (
                <>
                    {/* Create Form */}
                    <form onSubmit={handleCreate} className="flex items-end gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Keyword *</label>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="e.g. pricing, help, collab"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                minLength={2}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="all">All</option>
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="tiktok">TikTok</option>
                                <option value="youtube">YouTube</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                        >
                            {creating ? '...' : '+ Add'}
                        </button>
                    </form>

                    {/* Alerts List */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : alerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">🔕</span>
                            No keyword alerts yet. Add one above!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {alerts.map(alert => (
                                <div key={alert._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggle(alert._id)}
                                            className={`w-9 h-5 rounded-full transition ${alert.enabled ? 'bg-green-500' : 'bg-gray-300'} relative`}
                                        >
                                            <span className={`absolute top-0.5 ${alert.enabled ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full shadow transition-all`} />
                                        </button>
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">"{alert.keyword}"</span>
                                            <span className="text-xs text-gray-400 ml-2 capitalize">{alert.platform}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">{alert.matchCount} matches</span>
                                        <button onClick={() => handleDelete(alert._id)} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'notifications' && (
                <>
                    {notifications.unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline mb-3 block">
                            Mark all as read
                        </button>
                    )}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {notifications.notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <span className="text-3xl block mb-2">✨</span>
                                No notifications yet
                            </div>
                        ) : notifications.notifications.map((n, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${n.read ? 'border-gray-100 bg-white' : 'border-blue-100 bg-blue-50/50'}`}>
                                <div className="flex items-start gap-2">
                                    <span className="text-sm mt-0.5">🔔</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-0.5">
                                            Keyword <span className="font-semibold text-gray-700">"{n.keyword}"</span> matched
                                            <span className="ml-1 capitalize text-gray-400">· {n.platform}</span>
                                        </p>
                                        <p className="text-sm text-gray-800 line-clamp-2">{n.commentText}</p>
                                        <p className="text-xs text-gray-400 mt-1">{n.authorName} · {new Date(n.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
