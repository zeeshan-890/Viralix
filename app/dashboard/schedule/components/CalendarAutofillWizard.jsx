'use client';
import { useState } from 'react';
import { aiCalendarAPI } from '@/lib/api';
import { Loader2, Calendar, Sparkles, CheckCircle, BarChart3, Settings2 } from 'lucide-react';

export default function CalendarAutofillWizard({ onClose, onComplete }) {
    const [step, setStep] = useState(1); // 1: Analyze, 2: Configure, 3: Review, 4: Confirm
    const [loading, setLoading] = useState(false);

    // Data states
    const [analysis, setAnalysis] = useState(null);
    const [config, setConfig] = useState({ days: 7, platform: 'instagram', topics: [] });
    const [plan, setPlan] = useState([]);
    const [generatedCount, setGeneratedCount] = useState(0);

    // 1. ANALYZE STEP
    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await aiCalendarAPI.analyze({ platform: config.platform });
            setAnalysis(res.data);
            setConfig(prev => ({ ...prev, topics: res.data.strategy.topics }));
            setStep(2);
        } catch (e) {
            alert('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 2. GENERATE STEP
    const generatePlan = async () => {
        setLoading(true);
        try {
            const res = await aiCalendarAPI.generate({
                strategy: analysis.strategy,
                days: config.days,
                platform: config.platform,
                topics: config.topics
            });
            setPlan(res.data.plan);
            setStep(3);
        } catch (e) {
            alert('Generation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 3. CONFIRM STEP
    const confirmPlan = async () => {
        setLoading(true);
        try {
            const res = await aiCalendarAPI.confirm({
                plan,
                platform: config.platform,
                startDate: new Date()
            });
            setGeneratedCount(res.data.count);
            setStep(4);
            setTimeout(() => {
                onComplete && onComplete();
            }, 2000);
        } catch (e) {
            alert('Failed to save posts.');
        } finally {
            setLoading(false);
        }
    };

    const updatePlanItem = (index, field, value) => {
        const newPlan = [...plan];
        newPlan[index][field] = value;
        setPlan(newPlan);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-violet-50 to-indigo-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="text-violet-600" /> AI Content Auto-Fill
                        </h2>
                        <p className="text-sm text-gray-500">Generate a full content calendar based on your best performance.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                {/* Progress Bar */}
                <div className="flex border-b">
                    {[
                        { s: 1, label: 'Analyze', icon: BarChart3 },
                        { s: 2, label: 'Configure', icon: Settings2 },
                        { s: 3, label: 'Review', icon: Calendar },
                        { s: 4, label: 'Done', icon: CheckCircle }
                    ].map((item) => (
                        <div key={item.s} className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition
                            ${step === item.s ? 'border-violet-600 text-violet-700 bg-violet-50' : step > item.s ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}>
                            <item.icon size={16} /> {item.label}
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">

                    {/* STEP 1: INTRO & ANALYZE */}
                    {step === 1 && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BarChart3 className="text-indigo-600 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Let's analyze your top content</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                We'll scan your last 90 days of posts to find your most engaging topics, formats, and best times to post.
                            </p>

                            <div className="flex justify-center gap-4">
                                <select
                                    value={config.platform}
                                    onChange={(e) => setConfig({ ...config, platform: e.target.value })}
                                    className="border rounded-lg px-4 py-2 bg-white"
                                >
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="twitter">Twitter</option>
                                </select>
                                <button onClick={runAnalysis} disabled={loading} className="bg-violet-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Start Analysis'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: CONFIGURE */}
                    {step === 2 && analysis && (
                        <div className="space-y-8">
                            {/* Strategy Summary */}
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CheckCircle className="text-green-500 w-5 h-5" /> Analysis Complete
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-violet-50 p-4 rounded-lg">
                                        <p className="text-xs font-bold text-violet-600 uppercase mb-1">Top Tone</p>
                                        <p className="font-medium text-gray-900">{analysis.strategy.tone}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-xs font-bold text-blue-600 uppercase mb-1">Best Format</p>
                                        <p className="font-medium text-gray-900">{analysis.strategy.format}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">Best Time</p>
                                        <p className="font-medium text-gray-900">{analysis.strategy.bestTime}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Configuration Form */}
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4">Plan Configuration</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                        <div className="flex gap-3">
                                            {[7, 14, 30].map(d => (
                                                <button key={d} onClick={() => setConfig({ ...config, days: d })}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${config.days === d ? 'border-violet-600 bg-violet-50 text-violet-700' : 'hover:bg-gray-50'}`}>
                                                    {d} Days
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Topics (Edit if needed)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {config.topics.map((topic, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm border flex items-center gap-2">
                                                    {topic}
                                                    <button onClick={() => setConfig({ ...config, topics: config.topics.filter((_, idx) => idx !== i) })} className="text-gray-400 hover:text-red-500">×</button>
                                                </span>
                                            ))}
                                            <button onClick={() => {
                                                const t = prompt('Add topic:');
                                                if (t) setConfig({ ...config, topics: [...config.topics, t] });
                                            }} className="px-3 py-1 border border-dashed rounded-full text-sm text-gray-500 hover:text-gray-900 hover:border-gray-400">+ Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={generatePlan} disabled={loading} className="bg-violet-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
                                    {loading ? <><Loader2 className="animate-spin" /> Generating Plan...</> : 'Generate Content Plan →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Review & Edit Plan</h3>
                                <div className="text-sm text-gray-500">
                                    Generating {plan.length} posts for {config.platform}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {plan.map((item, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border hover:shadow-md transition group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Day {item.day}</span>
                                            <button onClick={() => {
                                                const newPlan = plan.filter((_, idx) => idx !== i);
                                                setPlan(newPlan);
                                            }} className="text-gray-300 hover:text-red-500">🗑️</button>
                                        </div>
                                        <input
                                            value={item.title}
                                            onChange={(e) => updatePlanItem(i, 'title', e.target.value)}
                                            className="font-bold text-gray-900 w-full border-none p-0 focus:ring-0 mb-1"
                                            placeholder="Post Title"
                                        />
                                        <textarea
                                            value={item.content}
                                            onChange={(e) => updatePlanItem(i, 'content', e.target.value)}
                                            rows={2}
                                            className="w-full text-sm text-gray-600 border-none p-0 focus:ring-0 resize-none bg-transparent"
                                            placeholder="Caption..."
                                        />
                                        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                                            {item.hashtags?.map((tag, t) => (
                                                <span key={t} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{tag}</span>
                                            ))}
                                        </div>
                                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500 italic border border-dashed">
                                            🤖 AI Image Idea: {item.imagePrompt}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="sticky bottom-0 bg-white/90 backdrop-blur p-4 border-t -mx-8 -mb-8 flex justify-between items-center mt-8">
                                <button onClick={() => setStep(2)} className="text-gray-500 font-medium hover:text-gray-900">← Back</button>
                                <button onClick={confirmPlan} disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Schedule All'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-green-600 w-12 h-12" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">Success!</h3>
                            <p className="text-lg text-gray-600">
                                {generatedCount} posts have been added to your calendar as drafts.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
