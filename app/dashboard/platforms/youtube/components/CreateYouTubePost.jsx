'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Video, Globe, Lock, Users, Tag, AlertCircle } from 'lucide-react';
import { youtubeAPI, uploadAPI } from '@/lib/api';

// YouTube icon component
const YouTubeIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

export default function CreateYouTubePost({ isOpen, onClose, accounts = [], onSuccess }) {
    const [step, setStep] = useState(1); // 1: Upload Video, 2: Details, 3: Review
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    // Account Selection
    const [selectedAccountId, setSelectedAccountId] = useState(accounts?.[0]?.accountId || '');

    // Video state
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState('');
    const [videoUrl, setVideoUrl] = useState(''); // Cloudinary URL after upload

    // Content state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [privacyStatus, setPrivacyStatus] = useState('public');
    const [madeForKids, setMadeForKids] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            setError('YouTube only supports video content');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => setVideoPreview(ev.target.result);
        reader.readAsDataURL(file);
        setVideoFile(file);
        setError('');

        // Upload to Cloudinary immediately
        setUploading(true);
        setUploadProgress(0);
        try {
            const res = await uploadAPI.uploadFile(file, (progress) => {
                setUploadProgress(progress);
            });
            const uploadedUrl = res.data?.files?.[0]?.url;
            if (!uploadedUrl) throw new Error('Failed to upload video');
            setVideoUrl(uploadedUrl);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload video: ' + (err.message || 'Unknown error'));
            setVideoFile(null);
            setVideoPreview('');
        } finally {
            setUploading(false);
        }
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag) && tags.length < 30) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handlePublish = async () => {
        if (!selectedAccountId) {
            setError('Please select an account');
            return;
        }
        if (!videoUrl) {
            setError('Please upload a video first');
            return;
        }
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await youtubeAPI.publish(selectedAccountId, {
                videoUrl,
                title,
                description,
                tags,
                privacyStatus,
                madeForKids
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Publish error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setVideoFile(null);
        setVideoPreview('');
        setVideoUrl('');
        setTitle('');
        setDescription('');
        setTags([]);
        setTagInput('');
        setPrivacyStatus('public');
        setMadeForKids(false);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const privacyOptions = [
        { value: 'public', label: 'Public', icon: Globe, desc: 'Everyone can search and view' },
        { value: 'unlisted', label: 'Unlisted', icon: Users, desc: 'Anyone with the link can view' },
        { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can view' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                            <YouTubeIcon />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: '#354F52' }}>Upload to YouTube</h2>
                            <p className="text-sm text-gray-500">Step {step} of 3</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b">
                    {['Upload', 'Details', 'Publish'].map((label, idx) => (
                        <button
                            key={label}
                            onClick={() => videoUrl && setStep(idx + 1)}
                            disabled={!videoUrl && idx > 0}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${step === idx + 1
                                ? 'bg-red-600 text-white'
                                : step > idx + 1
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Upload Video */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Account Selector */}
                            {accounts.length > 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Channel</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg"
                                    >
                                        {accounts.map(a => (
                                            <option key={a.accountId} value={a.accountId}>{a.accountName || a.accountId}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Video Upload */}
                            {videoPreview ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                                    <video src={videoPreview} controls className="w-full h-full object-contain" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                                                <p>Uploading... {uploadProgress}%</p>
                                            </div>
                                        </div>
                                    )}
                                    {!uploading && (
                                        <button
                                            onClick={() => { setVideoFile(null); setVideoPreview(''); setVideoUrl(''); }}
                                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-red-400 hover:bg-red-50/50 transition-all cursor-pointer text-gray-500"
                                >
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                        <Video className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-gray-700">Select video to upload</p>
                                        <p className="text-sm text-gray-400">MP4, MOV, AVI, or WMV</p>
                                    </div>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title (required)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Add a title that describes your video"
                                    maxLength={100}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell viewers about your video (links, hashtags, timestamps...)"
                                    rows={4}
                                    maxLength={5000}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/5000</p>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add a tag..."
                                        className="flex-1 p-3 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button onClick={addTag} className="px-4 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                                        <Tag className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs flex items-center gap-1">
                                            {tag} <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{tags.length}/30 tags</p>
                            </div>

                            {/* Privacy */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Visibility</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {privacyOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setPrivacyStatus(opt.value)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${privacyStatus === opt.value
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <opt.icon className={`w-5 h-5 mx-auto mb-2 ${privacyStatus === opt.value ? 'text-red-500' : 'text-gray-400'}`} />
                                            <p className="font-medium text-sm">{opt.label}</p>
                                            <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Made for Kids */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-sm">Made for kids?</p>
                                    <p className="text-xs text-gray-500">Set if your video is specifically made for children</p>
                                </div>
                                <button
                                    onClick={() => setMadeForKids(!madeForKids)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${madeForKids ? 'bg-red-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${madeForKids ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Review & Upload</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Video Preview */}
                                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                    <video src={videoPreview} className="w-full h-full object-contain" />
                                </div>

                                {/* Details */}
                                <div className="space-y-3 text-sm">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Channel</p>
                                        <p className="font-medium">{accounts.find(a => a.accountId === selectedAccountId)?.accountName || selectedAccountId}</p>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Title</p>
                                        <p className="font-medium line-clamp-2">{title || '(No title)'}</p>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Visibility</p>
                                        <p className="font-medium capitalize">{privacyStatus}</p>
                                    </div>

                                    {tags.length > 0 && (
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase mb-1">Tags</p>
                                            <p className="text-gray-700">{tags.slice(0, 5).join(', ')}{tags.length > 5 ? ` +${tags.length - 5} more` : ''}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!videoUrl || uploading || (step === 2 && !title.trim())}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload Video'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
