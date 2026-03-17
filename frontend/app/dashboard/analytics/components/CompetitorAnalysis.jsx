'use client';
import { useState, useEffect } from 'react';
import { competitorAPI } from '@/lib/api';

const platformIcons = {
    instagram: '📸', facebook: '👤', twitter: '🐦', tiktok: '🎵', youtube: '▶️'
};

export default function CompetitorAnalysis() {
    const [competitors, setCompetitors] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [platform, setPlatform] = useState('instagram');
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [snapshotForm, setSnapshotForm] = useState({ id: null, followers: '', engagementRate: '', avgLikes: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [compRes, compareRes] = await Promise.all([
                competitorAPI.list(),
                competitorAPI.compare()
            ]);
            setCompetitors(compRes.data.competitors || []);
            setComparison(compareRes.data);
        } catch (err) {
            console.error('Competitor load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name.trim() || !handle.trim()) return;
        setCreating(true);
        try {
            await competitorAPI.add({ name: name.trim(), platform, handle: handle.trim() });
            setName(''); setHandle('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Add failed');
        } finally {
            setCreating(false);
        }
    };

    const handleRemove = async (id, compName) => {
        if (!confirm(`Stop tracking ${compName}?`)) return;
        try {
            await competitorAPI.remove(id);
            loadData();
        } catch (err) { alert('Remove failed'); }
    };

    const handleSnapshot = async (id) => {
        try {
            await competitorAPI.snapshot(id, {
                followers: Number(snapshotForm.followers) || 0,
                engagementRate: Number(snapshotForm.engagementRate) || 0,
                avgLikes: Number(snapshotForm.avgLikes) || 0
            });
            setSnapshotForm({ id: null, followers: '', engagementRate: '', avgLikes: '' });
            loadData();
        } catch (err) { alert('Snapshot failed'); }
    };

    const growthColor = (val) => val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-400';
    const growthArrow = (val) => val > 0 ? '↑' : val < 0 ? '↓' : '→';

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        🏆 Competitor Analysis
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Track competitor growth and benchmark your performance
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b">
                {[
                    { id: 'list', label: `Competitors (${competitors.length})` },
                    { id: 'insights', label: 'Insights' },
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

            {activeTab === 'list' && (
                <>
                    {/* Add Competitor */}
                    <form onSubmit={handleAdd} className="flex items-end gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                            <input
                                type="text" value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Competitor brand" required
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Handle</label>
                            <input
                                type="text" value={handle} onChange={(e) => setHandle(e.target.value)}
                                placeholder="@username" required
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitter">Twitter</option>
                                <option value="tiktok">TikTok</option>
                                <option value="youtube">YouTube</option>
                            </select>
                        </div>
                        <button type="submit" disabled={creating}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                            {creating ? '...' : '+ Track'}
                        </button>
                    </form>

                    {/* Competitor Cards */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading competitors...</div>
                    ) : competitors.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">📊</span>
                            No competitors tracked yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {competitors.map(comp => (
                                <div key={comp._id} className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span>{platformIcons[comp.platform] || '💬'}</span>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-800">{comp.name}</h4>
                                                <p className="text-xs text-gray-400">@{comp.handle} · {comp.platform}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemove(comp._id, comp.name)}
                                            className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-4 gap-3 mb-3">
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-500">Followers</p>
                                            <p className="text-sm font-bold text-gray-800">{(comp.latestMetrics?.followers || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-500">Engagement</p>
                                            <p className="text-sm font-bold text-gray-800">{comp.latestMetrics?.engagementRate || 0}%</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-500">Avg Likes</p>
                                            <p className="text-sm font-bold text-gray-800">{(comp.latestMetrics?.avgLikes || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <p className="text-xs text-gray-500">Growth</p>
                                            <p className={`text-sm font-bold ${growthColor(comp.growth?.weekly)}`}>
                                                {growthArrow(comp.growth?.weekly)} {comp.growth?.weekly || 0}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Snapshot Input */}
                                    {snapshotForm.id === comp._id ? (
                                        <div className="flex items-end gap-2 p-2 bg-blue-50 rounded">
                                            <input type="number" placeholder="Followers" value={snapshotForm.followers}
                                                onChange={(e) => setSnapshotForm(prev => ({ ...prev, followers: e.target.value }))}
                                                className="flex-1 border rounded px-2 py-1 text-xs" />
                                            <input type="number" placeholder="Eng %" value={snapshotForm.engagementRate}
                                                onChange={(e) => setSnapshotForm(prev => ({ ...prev, engagementRate: e.target.value }))}
                                                className="w-20 border rounded px-2 py-1 text-xs" />
                                            <input type="number" placeholder="Avg Likes" value={snapshotForm.avgLikes}
                                                onChange={(e) => setSnapshotForm(prev => ({ ...prev, avgLikes: e.target.value }))}
                                                className="w-24 border rounded px-2 py-1 text-xs" />
                                            <button onClick={() => handleSnapshot(comp._id)}
                                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Save</button>
                                            <button onClick={() => setSnapshotForm({ id: null, followers: '', engagementRate: '', avgLikes: '' })}
                                                className="px-2 py-1 text-xs text-gray-500">✕</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSnapshotForm({
                                                id: comp._id,
                                                followers: comp.latestMetrics?.followers || '',
                                                engagementRate: comp.latestMetrics?.engagementRate || '',
                                                avgLikes: comp.latestMetrics?.avgLikes || ''
                                            })}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            📷 Take Snapshot
                                        </button>
                                    )}

                                    {comp.lastSnapshotAt && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Last snapshot: {new Date(comp.lastSnapshotAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'insights' && (
                <div className="space-y-4">
                    {/* Comparison Table */}
                    {comparison?.competitors?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-gray-600">Account</th>
                                            <th className="px-4 py-2 text-right text-gray-600">Followers</th>
                                            <th className="px-4 py-2 text-right text-gray-600">Engagement</th>
                                            <th className="px-4 py-2 text-right text-gray-600">Weekly Growth</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparison.userMetrics && (
                                            <tr className="border-t bg-blue-50/50">
                                                <td className="px-4 py-2 font-semibold text-blue-700">⭐ You</td>
                                                <td className="px-4 py-2 text-right font-medium">{comparison.userMetrics.followers?.toLocaleString() || 0}</td>
                                                <td className="px-4 py-2 text-right">{comparison.userMetrics.engagementRate || 0}%</td>
                                                <td className="px-4 py-2 text-right text-gray-400">—</td>
                                            </tr>
                                        )}
                                        {comparison.competitors.map(comp => (
                                            <tr key={comp._id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    <span className="mr-1">{platformIcons[comp.platform]}</span>
                                                    {comp.name}
                                                    <span className="text-xs text-gray-400 ml-1">@{comp.handle}</span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">{(comp.latestMetrics?.followers || 0).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right">{comp.latestMetrics?.engagementRate || 0}%</td>
                                                <td className={`px-4 py-2 text-right font-medium ${growthColor(comp.growth?.weekly)}`}>
                                                    {growthArrow(comp.growth?.weekly)} {comp.growth?.weekly || 0}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* AI Insights */}
                            {comparison.insights?.length > 0 && (
                                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                                    <h4 className="text-sm font-semibold text-purple-800 mb-2">💡 Key Insights</h4>
                                    <ul className="space-y-1.5">
                                        {comparison.insights.map((insight, i) => (
                                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-purple-500 mt-0.5">•</span>
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">📈</span>
                            Add competitors and take snapshots to see comparison insights
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
