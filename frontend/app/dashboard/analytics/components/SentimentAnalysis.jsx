'use client';
import { useState, useEffect } from 'react';
import { commentsAPI } from '@/lib/api';

export default function SentimentAnalysis() {
    const [summary, setSummary] = useState(null);
    const [recentComments, setRecentComments] = useState([]);
    const [urgentComments, setUrgentComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [days, setDays] = useState(30);

    useEffect(() => {
        loadData();
    }, [days]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [summaryRes, recentRes, urgentRes] = await Promise.all([
                commentsAPI.getSentimentSummary({ days }),
                commentsAPI.getRecent({ limit: 10 }),
                commentsAPI.getUrgent({ limit: 10 }),
            ]);
            setSummary(summaryRes.data);
            setRecentComments(recentRes.data.comments || []);
            setUrgentComments(urgentRes.data.comments || []);
        } catch (err) {
            console.error('Sentiment load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const sentimentColor = (label) => {
        switch (label) {
            case 'positive': return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
            case 'negative': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        💬 Comment Sentiment
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">AI-powered analysis of incoming comments</p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="text-sm border rounded-lg px-3 py-1.5 bg-white"
                >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
            ) : !summary || summary.total === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <span className="text-3xl mb-2">💬</span>
                    <p>No comments analyzed yet.</p>
                    <p className="text-xs mt-1">Comments are analyzed automatically from webhooks.</p>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 border-b">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'recent', label: 'Recent' },
                            { id: 'urgent', label: `Urgent (${summary.urgent || 0})` },
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

                    {activeTab === 'overview' && (
                        <div>
                            {/* Sentiment breakdown bars */}
                            <div className="space-y-3 mb-6">
                                {[
                                    { label: 'Positive', value: summary.positive, pct: summary.positivePercent, color: 'bg-green-500' },
                                    { label: 'Neutral', value: summary.neutral, pct: summary.neutralPercent, color: 'bg-gray-400' },
                                    { label: 'Negative', value: summary.negative, pct: summary.negativePercent, color: 'bg-red-500' },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">{item.label}</span>
                                            <span className="text-sm font-medium text-gray-900">{item.value} ({item.pct}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div className={`h-2.5 rounded-full ${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Toxic / Urgent alerts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                                    <p className="text-xs text-red-600 font-medium">🚨 Toxic Comments</p>
                                    <p className="text-2xl font-bold text-red-700 mt-1">{summary.toxic || 0}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                    <p className="text-xs text-orange-600 font-medium">⚡ Urgent / Needs Attention</p>
                                    <p className="text-2xl font-bold text-orange-700 mt-1">{summary.urgent || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recent' && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {recentComments.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">No recent comments</p>
                            ) : recentComments.map(c => {
                                const colors = sentimentColor(c.sentiment?.label);
                                return (
                                    <div key={c._id} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 line-clamp-2">{c.text}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {c.authorName} · {c.platform} · {new Date(c.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} whitespace-nowrap`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                {c.sentiment?.label || 'neutral'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'urgent' && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {urgentComments.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">No urgent comments 🎉</p>
                            ) : urgentComments.map(c => (
                                <div key={c._id} className="p-3 rounded-lg border border-red-100 bg-red-50/50">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg mt-0.5">{c.sentiment?.isToxic ? '🚫' : '⚠️'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800">{c.text}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {c.authorName} · {c.platform} · {new Date(c.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                {c.sentiment?.isToxic && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Toxic</span>}
                                                {c.sentiment?.isUrgent && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Urgent</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
