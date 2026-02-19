'use client';
import { useState, useEffect } from 'react';
import { hashtagResearchAPI } from '@/lib/api';

const tierBadge = {
    top: 'bg-green-100 text-green-700 border-green-200',
    mid: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-500 border-gray-200'
};

const trendIcon = { rising: '🔥', falling: '📉', stable: '➡️' };

export default function HashtagResearch() {
    const [activeTab, setActiveTab] = useState('performance');
    const [hashtags, setHashtags] = useState([]);
    const [trends, setTrends] = useState(null);
    const [sets, setSets] = useState([]);
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState('');
    const [suggestPlatform, setSuggestPlatform] = useState('instagram');
    const [suggestLoading, setSuggestLoading] = useState(false);
    // Set creation
    const [setName, setSetName] = useState('');
    const [setTags, setSetTags] = useState('');
    const [setPlatform, setSetPlatform] = useState('all');
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        if (activeTab === 'performance') loadPerformance();
        if (activeTab === 'trending') loadTrending();
        if (activeTab === 'sets') loadSets();
    }, [activeTab]);

    const loadPerformance = async () => {
        setLoading(true);
        try {
            const res = await hashtagResearchAPI.performance({ limit: 25 });
            setHashtags(res.data.hashtags || []);
        } catch (err) {
            console.error('Performance load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTrending = async () => {
        setLoading(true);
        try {
            const res = await hashtagResearchAPI.trending({ days: 14 });
            setTrends(res.data);
        } catch (err) {
            console.error('Trending load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSets = async () => {
        setLoading(true);
        try {
            const res = await hashtagResearchAPI.listSets();
            setSets(res.data.sets || []);
        } catch (err) {
            console.error('Sets load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggest = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setSuggestLoading(true);
        try {
            const res = await hashtagResearchAPI.suggest({ topic: topic.trim(), platform: suggestPlatform });
            setSuggestions(res.data);
        } catch (err) {
            alert('Suggest failed');
        } finally {
            setSuggestLoading(false);
        }
    };

    const handleCreateSet = async (e) => {
        e.preventDefault();
        if (!setName.trim() || !setTags.trim()) return;
        setCreating(true);
        try {
            const tags = setTags.split(/[,\n;]/).map(t => t.trim()).filter(Boolean);
            await hashtagResearchAPI.createSet({ name: setName.trim(), hashtags: tags, platform: setPlatform });
            setSetName(''); setSetTags('');
            loadSets();
        } catch (err) {
            alert(err.response?.data?.message || 'Create failed');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSet = async (id) => {
        if (!confirm('Delete this hashtag set?')) return;
        try {
            await hashtagResearchAPI.deleteSet(id);
            loadSets();
        } catch (_) { alert('Delete failed'); }
    };

    const handleCopySet = async (set) => {
        const text = set.hashtags.map(h => `#${h}`).join(' ');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(set._id);
            setTimeout(() => setCopied(null), 2000);
            // Also bump usage count on server
            hashtagResearchAPI.copySet(set._id).catch(() => { });
        } catch (_) {
            prompt('Copy these hashtags:', text);
        }
    };

    const copyHashtag = async (tag) => {
        try {
            await navigator.clipboard.writeText(`#${tag}`);
            setCopied(tag);
            setTimeout(() => setCopied(null), 1500);
        } catch (_) { }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    #️⃣ Hashtag Research Tool
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Discover top-performing hashtags, get AI suggestions, and save reusable sets
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b">
                {[
                    { id: 'performance', label: '📊 Performance' },
                    { id: 'suggest', label: '🤖 AI Suggest' },
                    { id: 'trending', label: '🔥 Trending' },
                    { id: 'sets', label: '💾 Saved Sets' }
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

            {/* 📊 Performance Tab */}
            {activeTab === 'performance' && (
                <div>
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Analyzing your hashtag performance...</div>
                    ) : hashtags.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">#️⃣</span>
                            Publish posts with hashtags to see performance data
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-gray-600">Hashtag</th>
                                        <th className="px-4 py-2 text-center text-gray-600">Tier</th>
                                        <th className="px-4 py-2 text-right text-gray-600">Posts</th>
                                        <th className="px-4 py-2 text-right text-gray-600">Avg Likes</th>
                                        <th className="px-4 py-2 text-right text-gray-600">Avg Comments</th>
                                        <th className="px-4 py-2 text-right text-gray-600">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hashtags.map((h, i) => (
                                        <tr key={h._id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => copyHashtag(h._id)}>
                                            <td className="px-4 py-2 font-medium">
                                                <span className="text-blue-600">#{h._id}</span>
                                                {copied === h._id && <span className="text-[10px] text-green-500 ml-1">✓ copied</span>}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tierBadge[h.tier]}`}>
                                                    {h.tier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">{h.postsUsed}</td>
                                            <td className="px-4 py-2 text-right">{Math.round(h.avgLikes)}</td>
                                            <td className="px-4 py-2 text-right">{Math.round(h.avgComments)}</td>
                                            <td className="px-4 py-2 text-right font-semibold">{Math.round(h.score)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        Score = Likes×1 + Comments×3 + Shares×5, per post. Click to copy.
                    </p>
                </div>
            )}

            {/* 🤖 AI Suggest Tab */}
            {activeTab === 'suggest' && (
                <div>
                    <form onSubmit={handleSuggest} className="flex items-end gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Topic / Niche</label>
                            <input
                                type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. fitness motivation, vegan recipes..."
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                            <select value={suggestPlatform} onChange={(e) => setSuggestPlatform(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="instagram">Instagram</option>
                                <option value="twitter">Twitter</option>
                                <option value="tiktok">TikTok</option>
                                <option value="youtube">YouTube</option>
                            </select>
                        </div>
                        <button type="submit" disabled={suggestLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                            {suggestLoading ? '⏳ Generating...' : '✨ Suggest'}
                        </button>
                    </form>

                    {suggestions && (
                        <div className="space-y-4">
                            {/* AI Suggestions */}
                            {suggestions.aiSuggestions?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">🤖 AI Suggestions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.aiSuggestions.map((tag, i) => (
                                            <button
                                                key={i}
                                                onClick={() => copyHashtag(tag)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200 hover:bg-blue-100 transition"
                                            >
                                                #{tag}
                                                {copied === tag && <span className="text-[10px] text-green-500 ml-1">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* From Your Posts */}
                            {suggestions.fromYourPosts?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📊 From Your Top Posts</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.fromYourPosts.map((h, i) => (
                                            <button
                                                key={i}
                                                onClick={() => copyHashtag(h.hashtag)}
                                                className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 hover:bg-green-100 transition flex items-center gap-1"
                                            >
                                                #{h.hashtag}
                                                <span className="text-[10px] text-gray-400">({h.usedCount}x, {h.avgEngagement} eng)</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 🔥 Trending Tab */}
            {activeTab === 'trending' && (
                <div>
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Analyzing trends...</div>
                    ) : !trends || (!trends.rising?.length && !trends.newlyUsed?.length) ? (
                        <div className="text-center py-8 text-gray-400">
                            <span className="text-3xl block mb-2">📈</span>
                            Need more post data to detect trends. Keep publishing!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {trends.rising?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-green-700 mb-2">🔥 Rising ({trends.period})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {trends.rising.map((t, i) => (
                                            <button key={i} onClick={() => copyHashtag(t.hashtag)}
                                                className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 hover:bg-green-100 transition">
                                                #{t.hashtag} <span className="text-[10px]">↑{t.change}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {trends.newlyUsed?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-700 mb-2">🆕 Newly Used</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {trends.newlyUsed.map((t, i) => (
                                            <button key={i} onClick={() => copyHashtag(t.hashtag)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200 hover:bg-blue-100 transition">
                                                #{t.hashtag} <span className="text-[10px]">new!</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {trends.falling?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-red-600 mb-2">📉 Declining</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {trends.falling.map((t, i) => (
                                            <button key={i} onClick={() => copyHashtag(t.hashtag)}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-full border border-red-200 hover:bg-red-100 transition">
                                                #{t.hashtag} <span className="text-[10px]">↓{Math.abs(t.change)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 💾 Saved Sets Tab */}
            {activeTab === 'sets' && (
                <div>
                    {/* Create Set Form */}
                    <form onSubmit={handleCreateSet} className="p-3 bg-gray-50 rounded-lg mb-4 space-y-2">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Set Name</label>
                                <input type="text" value={setName} onChange={(e) => setSetName(e.target.value)}
                                    placeholder="My fitness hashtags" required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                                <select value={setPlatform} onChange={(e) => setSetPlatform(e.target.value)}
                                    className="border rounded-lg px-3 py-2 text-sm bg-white">
                                    <option value="all">All</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="tiktok">TikTok</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Hashtags (comma or newline separated)</label>
                            <textarea value={setTags} onChange={(e) => setSetTags(e.target.value)}
                                placeholder="fitness, gym, workout, motivation..."
                                rows={2} required
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                        </div>
                        <button type="submit" disabled={creating}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {creating ? '...' : '💾 Save Set'}
                        </button>
                    </form>

                    {/* Saved Sets */}
                    {loading ? (
                        <div className="text-center py-6 text-gray-400">Loading sets...</div>
                    ) : sets.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                            <span className="text-3xl block mb-2">📦</span>
                            No saved sets yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sets.map(set => (
                                <div key={set._id} className="p-3 rounded-lg border border-gray-200 hover:border-blue-200 transition">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800">{set.name}</h4>
                                            <p className="text-[10px] text-gray-400">
                                                {set.hashtags.length} tags · {set.platform} · Used {set.usageCount}x
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleCopySet(set)}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 transition">
                                                {copied === set._id ? '✓ Copied!' : '📋 Copy All'}
                                            </button>
                                            <button onClick={() => handleDeleteSet(set._id)}
                                                className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {set.hashtags.map((tag, i) => (
                                            <span key={i} onClick={() => copyHashtag(tag)}
                                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
