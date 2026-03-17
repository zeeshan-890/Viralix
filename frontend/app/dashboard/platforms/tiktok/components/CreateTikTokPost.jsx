'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X, Video, AlertCircle, Info, Tag, Building2, Handshake, CheckCircle2, Copy, Scissors, MessageSquare, Loader2, ArrowLeft, Eye, EyeOff, Users, Upload } from 'lucide-react';
import { tiktokAPI, uploadAPI, postsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function CreateTikTokPost({ isOpen, onClose, accounts = [], onSuccess }) {
    // ---------------------------------------------------------
    // State
    // ---------------------------------------------------------
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    // Video 
    const [videoPreview, setVideoPreview] = useState('');
    const [videoUrl, setVideoUrl] = useState(''); // Cloudinary URL
    const [videoMeta, setVideoMeta] = useState({ filename: '', size: 0, mimetype: '', duration: 0, resolution: '1080P' });
    const fileInputRef = useRef(null);

    // Account & Creator Info
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [loadingCreator, setLoadingCreator] = useState(false);

    // Form settings
    const [caption, setCaption] = useState('');
    const [settings, setSettings] = useState({
        privacyLevel: '',
        allowComment: false,
        allowDuet: false,
        allowStitch: false,
        commercialDisclosure: false,
        brandOrganic: false,
        brandedContent: false
    });

    // ---------------------------------------------------------
    // Effects
    // ---------------------------------------------------------

    // 1. Auto-select first account on load
    useEffect(() => {
        if (!selectedAccountId && accounts?.length > 0) {
            setSelectedAccountId(accounts[0].platformAccountId);
        }
    }, [accounts, selectedAccountId]);

    // 2. Fetch Creator Info when account changes
    useEffect(() => {
        if (!selectedAccountId) {
            setCreatorInfo(null);
            return;
        }

        const fetchCreatorInfo = async () => {
            setLoadingCreator(true);
            setError('');
            try {
                const response = await tiktokAPI.creatorInfo(selectedAccountId);
                const info = response.data;
                setCreatorInfo(info);
                
                // Reset form settings that depend on creator info
                setSettings(prev => ({
                    ...prev,
                    privacyLevel: '', // Must have no default
                    allowComment: false, // Must be manual turn on
                    allowDuet: false, // Must be manual turn on
                    allowStitch: false // Must be manual turn on
                }));
            } catch (err) {
                console.error('Failed to fetch creator info:', err);
                setError(err.response?.data?.message || 'Failed to load TikTok account info. Please check if your account token is valid.');
            } finally {
                setLoadingCreator(false);
            }
        };

        fetchCreatorInfo();
    }, [selectedAccountId]);

    // ---------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------

    const resetForm = () => {
        setVideoPreview('');
        setVideoUrl('');
        setVideoMeta({ filename: '', size: 0, mimetype: '', duration: 0, resolution: '1080P' });
        setCaption('');
        setSettings({
            privacyLevel: '',
            allowComment: false,
            allowDuet: false,
            allowStitch: false,
            commercialDisclosure: false,
            brandOrganic: false,
            brandedContent: false
        });
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleBack = () => {
        // Clear video to go back to initial upload state
        setVideoPreview('');
        setVideoUrl('');
        setVideoMeta({ filename: '', size: 0, mimetype: '', duration: 0, resolution: '1080P' });
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            setError('TikTok only supports video content');
            return;
        }

        // Get video duration via object URL
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            const durationSecs = videoElement.duration;
            
            // Validate limits based on creator info
            if (creatorInfo?.maxVideoPostDurationSec && durationSecs > creatorInfo.maxVideoPostDurationSec) {
                setError(`Video duration exceeds the maximum allowed ${creatorInfo.maxVideoPostDurationSec} seconds.`);
                setVideoPreview('');
                return;
            }
            
            setVideoMeta(prev => ({ ...prev, duration: durationSecs }));
        };
        videoElement.src = URL.createObjectURL(file);

        // Set preview
        const reader = new FileReader();
        reader.onload = (ev) => setVideoPreview(ev.target.result);
        reader.readAsDataURL(file);
        
        setError('');

        // Upload to Cloudinary immediately
        setUploading(true);
        setUploadProgress(0);
        try {
            const res = await uploadAPI.uploadFile(file, (progress) => {
                setUploadProgress(progress);
            });
            const uploadedFile = res.data?.files?.[0];
            if (!uploadedFile?.url) throw new Error('Failed to upload video');

            setVideoUrl(uploadedFile.url);
            setVideoMeta(prev => ({
                ...prev,
                filename: file.name,
                size: uploadedFile.size,
                mimetype: uploadedFile.mimetype,
            }));
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload video: ' + (err.message || 'Unknown error'));
            setVideoPreview('');
        } finally {
            setUploading(false);
        }
    };

    const handleSettingChange = (field, value) => {
        const newSettings = { ...settings, [field]: value };

        // Compliance Logic

        // If branded content is enabled and privacy is SELF_ONLY, auto-switch to PUBLIC (or clear it)
        if (field === 'brandedContent' && value && settings.privacyLevel === 'SELF_ONLY') {
            newSettings.privacyLevel = 'PUBLIC_TO_EVERYONE';
        }

        // If switching to private and branded content is enabled, disable it
        if (field === 'privacyLevel' && value === 'SELF_ONLY' && settings.brandedContent) {
            newSettings.brandedContent = false;
        }

        setSettings(newSettings);
    };

    const getValidationErrors = () => {
        const errors = [];
        
        if (!creatorInfo?.canPost) {
            errors.push('You have reached your daily posting limit.');
        }

        if (!videoUrl) {
            errors.push('Please wait for the video to finish uploading.');
        }

        if (!settings.privacyLevel) {
            errors.push('Please select who can view this video.');
        }

        if (settings.commercialDisclosure && !settings.brandOrganic && !settings.brandedContent) {
            errors.push('You must select at least one commercial option ("Your brand" or "Branded content").');
        }
        
        if (settings.brandedContent && settings.privacyLevel === 'SELF_ONLY') {
            errors.push('Branded content cannot be set to private.');
        }

        return errors;
    };

    const handlePublish = async () => {
        if (!selectedAccountId) return setError('Please select an account.');
        
        const errors = getValidationErrors();
        if (errors.length > 0) {
            setError(errors.join(' '));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Create Post Record via Unified postsAPI
            const postPayload = {
                title: caption ? (caption.length > 50 ? caption.substring(0, 50) + '...' : caption) : 'TikTok Video',
                content: caption || '',
                platforms: [{ name: 'tiktok', accountId: selectedAccountId }],
                media: [{
                    type: 'video',
                    url: videoUrl,
                    filename: videoMeta.filename,
                    size: videoMeta.size,
                    mimetype: videoMeta.mimetype
                }],
                isScheduled: false,
                tiktokSettings: {
                    privacyLevel: settings.privacyLevel,
                    disableComment: !settings.allowComment,
                    disableDuet: !settings.allowDuet,
                    disableStitch: !settings.allowStitch,
                    brandOrganic: settings.commercialDisclosure ? settings.brandOrganic : false,
                    brandedContent: settings.commercialDisclosure ? settings.brandedContent : false
                }
            };

            const createRes = await postsAPI.create(postPayload);
            const postId = createRes.data?._id;

            if (!postId) throw new Error('Failed to create post record');

            // 2. Publish Now
            await postsAPI.publishNow(postId);
            
            toast.success(
                "Published securely to TikTok! Note: It may take a few minutes for content to process and appear on your profile.", 
                { duration: 6000, icon: '🚀' }
            );

            onSuccess?.();
            handleClose();
        } catch (err) {
            console.error('Publish error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Renders
    // ---------------------------------------------------------

    if (!isOpen) return null;

    // View: Initial Upload State
    if (!videoPreview) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
                    <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    <div className="p-10 flex flex-col items-center justify-center min-h-[500px]">
                        <div className="w-20 h-20 mb-6 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] rounded-3xl flex items-center justify-center shadow-lg transform rotate-[-5deg]">
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload to TikTok</h2>
                        <p className="text-gray-500 mb-8 text-center max-w-md">
                            Post videos directly to your TikTok profile. Choose MP4 or WebM (Max 10 minutes).
                        </p>
                        
                        {error && (
                            <div className="mb-6 px-6 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl w-full max-w-lg text-center font-medium">
                                {error}
                            </div>
                        )}
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#FE2C55] hover:bg-[#E3264C] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-pink-500/30 transition-all hover:scale-105"
                        >
                            Select video to upload
                        </button>

                        <input ref={fileInputRef} type="file" accept="video/mp4,video/webm" onChange={handleFileChange} className="hidden" />
                    </div>
                </div>
            </div>
        );
    }

    // Determine layout columns
    const showThirdColumn = settings.commercialDisclosure;
    const modalMaxWidth = showThirdColumn ? 'max-w-6xl' : 'max-w-4xl';

    // Privacy logic
    const privacyLabels = {
        'PUBLIC_TO_EVERYONE': 'Public',
        'MUTUAL_FOLLOW_FRIENDS': 'Friends',
        'FOLLOWER_OF_CREATOR': 'Followers',
        'SELF_ONLY': 'Only Me (Private)'
    };
    
    const getPrivacyIcon = (level) => {
        if (level === 'PUBLIC_TO_EVERYONE') return <Eye className="w-4 h-4" />;
        if (level === 'SELF_ONLY') return <EyeOff className="w-4 h-4" />;
        return <Users className="w-4 h-4" />;
    };

    const selectedAccountObj = accounts.find(a => a.platformAccountId === selectedAccountId);
    
    const formatDuration = (seconds) => {
        if (!seconds) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Consent Link generators
    const getConsentNotice = () => {
        const musicLink = <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener noreferrer" className="text-[#00f2fe] hover:underline font-medium">Music Usage Confirmation</a>;
        const bcLink = <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noopener noreferrer" className="text-[#00f2fe] hover:underline font-medium">Branded Content Policy</a>;
        
        if (settings.brandedContent) {
             return <span>By posting, you agree to our {bcLink} and {musicLink}.</span>;
        }
        return <span>By posting, you agree to our {musicLink}.</span>;
    };

    // View: Split Layout
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${modalMaxWidth} h-[calc(100vh-4rem)] flex flex-col relative transition-all duration-300 overflow-hidden`}>
                
                {/* Global Error Banner */}
                {error && (
                    <div className="absolute top-0 left-0 right-0 z-50 bg-red-500 text-white p-3 text-center text-sm font-medium flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <button onClick={() => setError('')} className="absolute right-3 p-1 hover:bg-red-600 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex flex-1 overflow-hidden h-full">
                    {/* LEFT PANE: VIDEO PREVIEW (approx 40%) */}
                    <div className="w-[40%] bg-black flex flex-col relative">
                        {uploading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white p-8 text-center space-y-4">
                                <Loader2 className="w-12 h-12 text-[#FE2C55] animate-spin" />
                                <h3 className="text-xl font-bold">Uploading to cloud...</h3>
                                <div className="w-full max-w-xs bg-gray-800 rounded-full h-2.5">
                                    <div className="bg-[#FE2C55] h-2.5 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                                </div>
                                <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
                            </div>
                        ) : (
                            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                                <video 
                                    src={videoPreview} 
                                    controls 
                                    autoPlay
                                    muted
                                    className="max-w-full max-h-full rounded-lg object-contain" 
                                />
                            </div>
                        )}
                        
                        {/* Video Meta Bar */}
                        <div className="h-16 bg-gray-900 border-t border-gray-800 px-6 flex items-center justify-between text-xs text-gray-400">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-300">Filename</span>
                                <span className="truncate max-w-[120px]" title={videoMeta.filename}>{videoMeta.filename || 'Original.mp4'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-300">Duration</span>
                                <span>{formatDuration(videoMeta.duration)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-300">Format</span>
                                <span>{(videoMeta.mimetype || 'video/mp4').split('/')[1]?.toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-300">Size</span>
                                <span>{formatBytes(videoMeta.size)}</span>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE PANE: SETTINGS (approx 60% or 30% if third pane open) */}
                    <div className={`flex flex-col border-r border-gray-200 overflow-y-auto ${showThirdColumn ? 'w-[30%]' : 'w-[60%]'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-8">
                                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-900">Upload to TikTok</h2>
                                {!showThirdColumn && (
                                    <button onClick={handleClose} className="ml-auto p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Account Selector */}
                            <div className="mb-6 relative">
                                {loadingCreator ? (
                                    <div className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        <span className="text-gray-500 font-medium">Loading creator info...</span>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={selectedAccountId}
                                            onChange={(e) => setSelectedAccountId(e.target.value)}
                                            className="w-full p-4 pl-14 pr-10 border border-gray-200 rounded-xl appearance-none bg-gray-50 hover:bg-gray-100 transition-colors font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#FE2C55]/20 focus:border-[#FE2C55]"
                                        >
                                            {accounts.map(a => (
                                                <option key={a.platformAccountId} value={a.platformAccountId}>
                                                    {a.accountName || a.platformAccountId}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full overflow-hidden w-6 h-6 border border-gray-200">
                                            {creatorInfo?.avatarUrl ? (
                                                <img src={creatorInfo.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-black flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>
                                            )}
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </>
                                )}
                                
                                {!creatorInfo?.canPost && creatorInfo && (
                                    <div className="mt-2 text-red-600 text-sm flex items-center gap-1 font-medium bg-red-50 p-2 rounded-lg">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        You cannot make more posts right now based on TikTok limits.
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-gray-900 mb-2">Caption</label>
                                <div className="relative border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FE2C55]/20 focus-within:border-[#FE2C55] bg-gray-50">
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Add a title that describes your video"
                                        rows={4}
                                        maxLength={2200}
                                        className="w-full p-4 bg-transparent outline-none resize-none"
                                    />
                                    <div className="absolute bottom-2 right-4 text-xs font-medium text-gray-400">
                                        {caption.length}/2200
                                    </div>
                                </div>
                            </div>

                            {/* Privacy */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-gray-900 mb-2">Who can view this video</label>
                                <div className="relative">
                                    <select
                                        value={settings.privacyLevel}
                                        onChange={(e) => handleSettingChange('privacyLevel', e.target.value)}
                                        className="w-full p-4 pl-10 pr-10 border border-gray-200 rounded-xl appearance-none bg-gray-50 hover:bg-gray-100 transition-colors font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#FE2C55]/20 focus:border-[#FE2C55]"
                                    >
                                        <option value="" disabled>Select visibility...</option>
                                        {(creatorInfo?.privacyLevelOptions || ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY']).map(level => {
                                            const isDisabled = level === 'SELF_ONLY' && settings.brandedContent;
                                            return (
                                                <option key={level} value={level} disabled={isDisabled}>
                                                    {privacyLabels[level] || level} {isDisabled ? '(Disabled for branded)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        {getPrivacyIcon(settings.privacyLevel || 'PUBLIC_TO_EVERYONE')}
                                    </div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Interactions */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-gray-900 mb-4">Allow users to</label>
                                <div className="flex flex-wrap gap-6">
                                    <label className={`flex items-center gap-2 cursor-pointer group ${creatorInfo?.commentDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${settings.allowComment ? 'bg-[#00f2fe] border-[#00f2fe]' : 'border-gray-300 group-hover:border-[#00f2fe]'}`}>
                                            {settings.allowComment && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.allowComment}
                                            onChange={(e) => !creatorInfo?.commentDisabled && handleSettingChange('allowComment', e.target.checked)}
                                            className="hidden"
                                            disabled={creatorInfo?.commentDisabled}
                                        />
                                        <span className="font-medium text-gray-800">Comment</span>
                                    </label>

                                    <label className={`flex items-center gap-2 cursor-pointer group ${creatorInfo?.duetDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${settings.allowDuet ? 'bg-[#00f2fe] border-[#00f2fe]' : 'border-gray-300 group-hover:border-[#00f2fe]'}`}>
                                            {settings.allowDuet && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.allowDuet}
                                            onChange={(e) => !creatorInfo?.duetDisabled && handleSettingChange('allowDuet', e.target.checked)}
                                            className="hidden"
                                            disabled={creatorInfo?.duetDisabled}
                                        />
                                        <span className="font-medium text-gray-800">Duet</span>
                                    </label>

                                    <label className={`flex items-center gap-2 cursor-pointer group ${creatorInfo?.stitchDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${settings.allowStitch ? 'bg-[#00f2fe] border-[#00f2fe]' : 'border-gray-300 group-hover:border-[#00f2fe]'}`}>
                                            {settings.allowStitch && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings.allowStitch}
                                            onChange={(e) => !creatorInfo?.stitchDisabled && handleSettingChange('allowStitch', e.target.checked)}
                                            className="hidden"
                                            disabled={creatorInfo?.stitchDisabled}
                                        />
                                        <span className="font-medium text-gray-800">Stitch</span>
                                    </label>
                                </div>
                            </div>

                            {/* Disclose Setup Toggle */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-900">Disclose video content</label>
                                    <button 
                                        role="switch" 
                                        aria-checked={settings.commercialDisclosure}
                                        onClick={() => handleSettingChange('commercialDisclosure', !settings.commercialDisclosure)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.commercialDisclosure ? 'bg-[#00f2fe]' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.commercialDisclosure ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Turn on to disclose that this video promotes goods or services in exchange for something of value.
                                </p>
                            </div>

                            {/* If No Third pane, show Submit here */}
                            {!showThirdColumn && (
                                <div className="mt-8">
                                    <button
                                        onClick={handlePublish}
                                        disabled={loading || uploading || !creatorInfo?.canPost}
                                        className="w-full py-4 bg-[#00f2fe] hover:bg-[#00d0de] text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex justify-center"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Upload'}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* RIGHT PANE: BRANDED CONTENT DISCLOSURE (approx 30%) */}
                    {showThirdColumn && (
                        <div className="w-[30%] bg-gray-50 p-6 flex flex-col relative animate-in slide-in-from-right-8 duration-300">
                            <button onClick={handleClose} className="absolute top-6 right-6 p-2 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-6 mt-1">Disclose video content</h3>

                            {/* Label Info card */}
                            <div className="bg-[#eef2ff] border border-blue-100 rounded-xl p-4 flex items-start gap-3 mb-6">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900 leading-snug">
                                    Your video will be labeled <span className="font-semibold">"{settings.brandOrganic && settings.brandedContent ? 'Paid partnership' : settings.brandedContent ? 'Paid partnership' : settings.brandOrganic ? 'Promotional content' : 'Promotional content'}"</span>. 
                                    This cannot be changed once your video is posted.
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-8">
                                Turn on to disclose that this video promotes goods or services in exchange for something of value. Your video could promote yourself, a third party, or both.
                            </p>

                            {/* Warning if nothing checked */}
                            {!settings.brandOrganic && !settings.brandedContent && (
                                <div className="mb-4 text-xs font-semibold text-[#FE2C55] bg-red-50 p-2 rounded-lg border border-red-100">
                                    You need to indicate if your content promotes yourself, a third party, or both.
                                </div>
                            )}

                            {/* Checkboxes */}
                            <div className="space-y-6 flex-1">
                                {/* Your Brand */}
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 mb-1">Your brand</div>
                                        <div className="text-sm text-gray-500">
                                            You are promoting yourself or your own business. This video will be classified as Brand Organic.
                                        </div>
                                    </div>
                                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-colors border ${settings.brandOrganic ? 'bg-[#00f2fe] border-[#00f2fe]' : 'border-gray-300 group-hover:border-[#00f2fe]'}`}>
                                        {settings.brandOrganic && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.brandOrganic}
                                        onChange={(e) => handleSettingChange('brandOrganic', e.target.checked)}
                                        className="hidden"
                                    />
                                </label>

                                {/* Branded Content */}
                                <label 
                                    className={`flex items-start gap-4 cursor-pointer group ${settings.privacyLevel === 'SELF_ONLY' ? 'opacity-50' : ''}`}
                                    title={settings.privacyLevel === 'SELF_ONLY' ? 'Branded content visibility cannot be set to private.' : ''}
                                >
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 mb-1">Branded content</div>
                                        <div className="text-sm text-gray-500">
                                            You are promoting another brand or a third party. This video will be classified as Branded Content.
                                        </div>
                                        {settings.privacyLevel === 'SELF_ONLY' && (
                                            <div className="text-xs font-medium text-[#FE2C55] mt-1">visibility cannot be private</div>
                                        )}
                                    </div>
                                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-colors border ${settings.brandedContent ? 'bg-[#00f2fe] border-[#00f2fe]' : 'border-gray-300 group-hover:border-[#00f2fe]'}`}>
                                        {settings.brandedContent && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.brandedContent}
                                        disabled={settings.privacyLevel === 'SELF_ONLY'}
                                        onChange={(e) => handleSettingChange('brandedContent', e.target.checked)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Consent footer & Upload */}
                            <div className="mt-8 border-t border-gray-200 pt-6">
                                <div className="text-xs text-gray-500 mb-6 text-center">
                                    {getConsentNotice()}
                                </div>
                                <button
                                    onClick={handlePublish}
                                    disabled={loading || uploading || !creatorInfo?.canPost || (!settings.brandOrganic && !settings.brandedContent)}
                                    className="w-full py-4 bg-[#00f2fe] hover:bg-[#00d0de] text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Upload'}
                                </button>
                            </div>
                        </div>
                    )}
                    
                </div>
            </div>
        </div>
    );
}
