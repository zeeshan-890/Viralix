'use client';
import { useState, useEffect, useMemo } from 'react';
import { uploadAPI, postsAPI, facebookAPI, instagramAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import FileUpload from './components/FileUpload';
import TagsInput from './components/TagsInput';
import MediaLibrary from './components/MediaLibrary';

export default function UploadPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('upload');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [mediaLibrary, setMediaLibrary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [connectedTargets, setConnectedTargets] = useState([]); // [{ key, name, accountId, label, icon }]
    const [selectedPlatforms, setSelectedPlatforms] = useState([]); // [{ name, accountId }]
    const [scheduleType, setScheduleType] = useState('now'); // now | later | optimal
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [contentForm, setContentForm] = useState({
        title: '',
        description: '',
        tags: [],
        category: ''
    });

    useEffect(() => {
        if (activeTab === 'library') {
            loadMediaLibrary();
        }
    }, [activeTab]);

    const loadMediaLibrary = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await uploadAPI.getMedia({ limit: 50 });
            setMediaLibrary(response.data?.files || []);
        } catch (err) {
            setError('Failed to load media library');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load connected FB pages and IG accounts for platform selection
    useEffect(() => {
        let cancelled = false;
        async function loadTargets() {
            try {
                const [fbRes, igRes] = await Promise.allSettled([
                    facebookAPI.status(),
                    instagramAPI.status(),
                ]);
                const targets = [];
                if (fbRes.status === 'fulfilled') {
                    const pages = fbRes.value?.data?.pages || [];
                    for (const p of pages) {
                        targets.push({ key: `facebook:${p.id}`, name: 'facebook', accountId: p.id, label: `Facebook — ${p.name}`, icon: '📘' });
                    }
                }
                if (igRes.status === 'fulfilled') {
                    const accounts = igRes.value?.data?.accounts || [];
                    for (const a of accounts) {
                        targets.push({ key: `instagram:${a.igUserId}`, name: 'instagram', accountId: a.igUserId, label: `Instagram — ${a.pageName || a.igUserId}`, icon: '📷' });
                    }
                }
                if (!cancelled) setConnectedTargets(targets);
            } catch (e) {
                if (!cancelled) {/* ignore */ }
            }
        }
        loadTargets();
        return () => { cancelled = true; };
    }, []);

    const handleUploadComplete = (files) => {
        setUploadedFiles(prev => [...prev, ...files]);
        // Refresh media library if it's loaded
        if (activeTab === 'library') {
            loadMediaLibrary();
        }
    };

    const handleFormChange = (field, value) => {
        setContentForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleTarget = (t) => {
        setSelectedPlatforms(prev => {
            const exists = prev.some(p => p.name === t.name && p.accountId === t.accountId);
            return exists ? prev.filter(p => !(p.name === t.name && p.accountId === t.accountId)) : [...prev, { name: t.name, accountId: t.accountId }];
        });
    };

    const hasIG = useMemo(() => selectedPlatforms.some(p => p.name === 'instagram'), [selectedPlatforms]);
    const hasFB = useMemo(() => selectedPlatforms.some(p => p.name === 'facebook'), [selectedPlatforms]);
    const requiresMedia = hasIG; // Instagram requires media; Facebook can be text-only

    const canSubmit = useMemo(() => {
        if (!contentForm.title || !contentForm.description) return false;
        if (selectedPlatforms.length === 0) return false;
        if (requiresMedia && uploadedFiles.length === 0) return false;
        if (scheduleType === 'later' && (!date || !time)) return false;
        return true;
    }, [contentForm, selectedPlatforms, uploadedFiles, requiresMedia, scheduleType, date, time]);

    const buildMediaPayload = () => {
        return uploadedFiles.map(f => ({
            type: f.type,
            url: f.url,
            filename: f.filename,
            size: f.size,
            mimetype: f.mimetype,
        }));
    };

    const computeScheduledIso = () => {
        if (scheduleType !== 'later') return null;
        try {
            return new Date(`${date}T${time}:00`).toISOString();
        } catch {
            return null;
        }
    };

    const handleSaveDraft = async () => {
        try {
            setActionError('');
            setActionLoading(true);
            const payload = {
                title: contentForm.title,
                content: contentForm.description,
                platforms: selectedPlatforms,
                media: buildMediaPayload(),
                hashtags: contentForm.tags,
                isScheduled: false,
            };
            const res = await postsAPI.create(payload);
            // Stay on page and show a light confirmation
            setActionError('');
        } catch (e) {
            setActionError(e?.response?.data?.message || 'Failed to save draft');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePublishNow = async () => {
        try {
            setActionError('');
            setActionLoading(true);
            // First create the post as draft with selected platforms
            const createRes = await postsAPI.create({
                title: contentForm.title,
                content: contentForm.description,
                platforms: selectedPlatforms,
                media: buildMediaPayload(),
                hashtags: contentForm.tags,
                isScheduled: false,
            });
            const postId = createRes.data?._id;
            if (!postId) throw new Error('Post creation failed');
            // Publish immediately
            await postsAPI.publishNow(postId);
            router.push('/dashboard');
        } catch (e) {
            setActionError(e?.response?.data?.message || e.message || 'Failed to publish now');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSchedule = async () => {
        try {
            setActionError('');
            setActionLoading(true);
            const scheduledDate = computeScheduledIso();
            if (!scheduledDate) throw new Error('Invalid schedule date/time');
            const createRes = await postsAPI.create({
                title: contentForm.title,
                content: contentForm.description,
                platforms: selectedPlatforms,
                media: buildMediaPayload(),
                hashtags: contentForm.tags,
                scheduledDate,
                isScheduled: true,
            });
            router.push('/dashboard/schedule');
        } catch (e) {
            setActionError(e?.response?.data?.message || e.message || 'Failed to schedule post');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
                <p className="text-gray-600">Upload new content or manage your existing media library.</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    📤 Upload New Content
                </button>
                <button
                    onClick={() => setActiveTab('library')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'library'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    📚 Media Library
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* File Upload */}
                    <div className="space-y-6 lg:col-span-1">
                        <FileUpload
                            onUploadComplete={handleUploadComplete}
                            onDeleteUploaded={(publicId) => {
                                setUploadedFiles(prev => prev.filter(m => m.publicId !== publicId));
                            }}
                        />
                    </div>

                    {/* Content Details */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Content Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                    <input type="text" value={contentForm.title} onChange={(e) => handleFormChange('title', e.target.value)} placeholder="Enter content title..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea rows={4} value={contentForm.description} onChange={(e) => handleFormChange('description', e.target.value)} placeholder="Enter content description..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <TagsInput tags={contentForm.tags} onChange={(tags) => handleFormChange('tags', tags)} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select value={contentForm.category} onChange={(e) => handleFormChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="">Select category...</option>
                                        <option value="education">Education</option>
                                        <option value="entertainment">Entertainment</option>
                                        <option value="lifestyle">Lifestyle</option>
                                        <option value="technology">Technology</option>
                                        <option value="business">Business</option>
                                    </select>
                                </div>

                                {/* Platform Selection */}
                                <div className="mt-8">
                                    <h4 className="text-md font-semibold mb-2">Select Platforms</h4>
                                    {connectedTargets.length === 0 ? (
                                        <div className="text-sm text-gray-500">No connected Facebook pages or Instagram accounts. Connect accounts in Settings.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {connectedTargets.map(t => {
                                                const selected = selectedPlatforms.some(p => p.name === t.name && p.accountId === t.accountId);
                                                return (
                                                    <button key={t.key} onClick={() => toggleTarget(t)} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}>
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

                                {/* Schedule Controls */}
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">When to Post</label>
                                        <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="now">Post Now</option>
                                            <option value="later">Schedule for Later</option>
                                            <option value="optimal">AI Optimal Time (coming soon)</option>
                                        </select>
                                    </div>
                                    {scheduleType === 'later' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                                <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Time</label>
                                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {actionError && (
                                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{actionError}</div>
                                )}
                                {!actionError && hasIG && uploadedFiles.length === 0 && selectedPlatforms.length > 0 && (
                                    <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                                        Instagram requires a photo or video. Add media, or deselect Instagram to post text-only to Facebook.
                                    </div>
                                )}

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button onClick={handleSaveDraft} disabled={actionLoading || selectedPlatforms.length === 0 || !contentForm.title || !contentForm.description} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400">{actionLoading ? 'Saving...' : 'Save Draft'}</button>
                                    <button onClick={handlePublishNow} disabled={actionLoading || !canSubmit || scheduleType !== 'now'} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400">{actionLoading ? 'Publishing...' : 'Publish Now'}</button>
                                    <button onClick={handleSchedule} disabled={actionLoading || !canSubmit || scheduleType !== 'later'} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">{actionLoading ? 'Scheduling...' : 'Schedule Post'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Library Tab */}
            {activeTab === 'library' && (
                <MediaLibrary
                    files={mediaLibrary}
                    loading={loading}
                    onRefresh={loadMediaLibrary}
                />
            )}
        </div>
    );
}
