'use client';
import { useState, useEffect, useMemo } from 'react';
import { uploadAPI, postsAPI, facebookAPI, instagramAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import FileUpload from './components/FileUpload';
import TagsInput from './components/TagsInput';
import MediaLibrary from './components/MediaLibrary';
import { Upload, Image, Video, Calendar, Clock, Send, Save, Eye, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

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
            const postId = res.data?._id;
            if (postId) {
                // Navigate to preview page after saving draft
                router.push(`/dashboard/preview/${postId}`);
            }
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
        <div className="min-h-screen bg-gradient-to-br from-[#F7FAF8] to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#354F52' }}>
                        Create Content
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Upload, design, and schedule your social media posts with ease
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-2 mb-8">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'upload'
                            ? 'text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        style={activeTab === 'upload' ? { backgroundColor: '#84A98C' } : {}}
                    >
                        <Upload className="w-4 h-4" />
                        Upload New Content
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'library'
                            ? 'text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        style={activeTab === 'library' ? { backgroundColor: '#84A98C' } : {}}
                    >
                        <Image className="w-4 h-4" />
                        Media Library
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>{error}</div>
                    </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div className="space-y-6">
                        {/* Step 1: Upload Media Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CAD2C5' }}>
                                    <Upload className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold" style={{ color: '#354F52' }}>Step 1: Upload Media</h3>
                                    <p className="text-sm text-gray-600">Upload photos or videos for your post</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <FileUpload
                                        onUploadComplete={handleUploadComplete}
                                        onDeleteUploaded={(publicId) => {
                                            setUploadedFiles(prev => prev.filter(m => m.publicId !== publicId));
                                        }}
                                    />
                                </div>

                                {/* Uploaded Files Preview */}
                                <div>
                                    {uploadedFiles.length > 0 ? (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium mb-3" style={{ color: '#354F52' }}>
                                                Uploaded Files ({uploadedFiles.length})
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                                                {uploadedFiles.map((file, idx) => (
                                                    <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#84A98C] transition-all group">
                                                        {/* Thumbnail */}
                                                        <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                            {file.type === 'image' ? (
                                                                <>
                                                                    <img 
                                                                        src={file.url} 
                                                                        alt={file.filename}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                                        <Image className="w-3 h-3" />
                                                                        Image
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200" />
                                                                    <Video className="w-12 h-12 text-purple-600 relative z-10" />
                                                                    <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                                        <Video className="w-3 h-3" />
                                                                        Video
                                                                    </div>
                                                                </>
                                                            )}
                                                            {/* Success Badge */}
                                                            <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* File Details */}
                                                        <div className="p-3 bg-gray-50">
                                                            <p className="text-sm font-medium text-gray-900 truncate mb-1" title={file.filename}>
                                                                {file.filename}
                                                            </p>
                                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                <span className="text-green-600 font-medium">✓ Uploaded</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-[300px] flex items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                            <div className="text-center">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <Image className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-600 mb-1">No files uploaded yet</p>
                                                <p className="text-xs text-gray-500">Upload photos or videos to see them here</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Content Details Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CAD2C5' }}>
                                    <Sparkles className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold" style={{ color: '#354F52' }}>Step 2: Content Details</h3>
                                    <p className="text-sm text-gray-600">Write your post title and description</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Title */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium mb-2" style={{ color: '#354F52' }}>
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={contentForm.title}
                                        onChange={(e) => handleFormChange('title', e.target.value)}
                                        placeholder="Enter an engaging title..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                                        onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    />
                                </div>

                                {/* Description */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium mb-2" style={{ color: '#354F52' }}>
                                        Description *
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={contentForm.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        placeholder="Write your post content here..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all resize-none"
                                        onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    />
                                </div>

                                {/* Tags */}
                                <div className="lg:col-span-2">
                                    <TagsInput tags={contentForm.tags} onChange={(tags) => handleFormChange('tags', tags)} />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: '#354F52' }}>
                                        Category
                                    </label>
                                    <select
                                        value={contentForm.category}
                                        onChange={(e) => handleFormChange('category', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                                        onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    >
                                        <option value="">Select category...</option>
                                        <option value="education">Education</option>
                                        <option value="entertainment">Entertainment</option>
                                        <option value="lifestyle">Lifestyle</option>
                                        <option value="technology">Technology</option>
                                        <option value="business">Business</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Select Platforms Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CAD2C5' }}>
                                    <Send className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold" style={{ color: '#354F52' }}>Step 3: Select Platforms</h3>
                                    <p className="text-sm text-gray-600">Choose where to publish your content</p>
                                </div>
                            </div>

                            {connectedTargets.length === 0 ? (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        No connected accounts. Connect your Facebook pages or Instagram accounts in Settings.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {connectedTargets.map(t => {
                                        const selected = selectedPlatforms.some(p => p.name === t.name && p.accountId === t.accountId);
                                        return (
                                            <button
                                                key={t.key}
                                                onClick={() => toggleTarget(t)}
                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selected
                                                    ? 'border-[#84A98C] bg-[#F7FAF8] shadow-md'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                                                    }`}
                                            >
                                                <span className="text-3xl">{t.icon}</span>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-medium text-gray-900">{t.label}</p>
                                                    <p className="text-xs text-gray-500">{t.name}</p>
                                                </div>
                                                {selected && (
                                                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#84A98C' }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 4: Schedule Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CAD2C5' }}>
                                    <Calendar className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold" style={{ color: '#354F52' }}>Step 4: Schedule Your Post</h3>
                                    <p className="text-sm text-gray-600">Choose when to publish</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium" style={{ color: '#354F52' }}>
                                        Timing
                                    </label>
                                    <select
                                        value={scheduleType}
                                        onChange={(e) => setScheduleType(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                                        onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    >
                                        <option value="now">Post Now</option>
                                        <option value="later">Schedule for Later</option>
                                        <option value="optimal">AI Optimal Time (soon)</option>
                                    </select>
                                </div>
                                {scheduleType === 'later' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium" style={{ color: '#354F52' }}>
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={date}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                                                onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium" style={{ color: '#354F52' }}>
                                                Time
                                            </label>
                                            <input
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                                                onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Error Messages */}
                            {actionError && (
                                <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>{actionError}</div>
                                </div>
                            )}

                            {!actionError && hasIG && uploadedFiles.length === 0 && selectedPlatforms.length > 0 && (
                                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        Instagram requires a photo or video. Add media, or deselect Instagram to post text-only to Facebook.
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={actionLoading || selectedPlatforms.length === 0 || !contentForm.title || !contentForm.description}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
                                    style={{
                                        borderColor: '#354F52',
                                        color: '#354F52',
                                        backgroundColor: 'white'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = '#F7FAF8';
                                        }
                                    }}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <Save className="w-5 h-5" />
                                    {actionLoading ? 'Saving...' : 'Save Draft'}
                                </button>

                                <button
                                    onClick={handlePublishNow}
                                    disabled={actionLoading || !canSubmit || scheduleType !== 'now'}
                                    className="flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    style={{ backgroundColor: '#52796F' }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = '#354F52';
                                        }
                                    }}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#52796F'}
                                >
                                    <Send className="w-5 h-5" />
                                    {actionLoading ? 'Publishing...' : 'Publish Now'}
                                </button>

                                <button
                                    onClick={handleSchedule}
                                    disabled={actionLoading || !canSubmit || scheduleType !== 'later'}
                                    className="flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    style={{ backgroundColor: '#84A98C' }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = '#52796F';
                                        }
                                    }}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#84A98C'}
                                >
                                    <Calendar className="w-5 h-5" />
                                    {actionLoading ? 'Scheduling...' : 'Schedule Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}                {/* Media Library Tab */}
                {activeTab === 'library' && (
                    <MediaLibrary
                        files={mediaLibrary}
                        loading={loading}
                        onRefresh={loadMediaLibrary}
                    />
                )}
            </div>
        </div>
    );
}
