'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Video, Eye, EyeOff, MessageSquare, Users, Share2 } from 'lucide-react';
import { tiktokAPI, uploadAPI } from '@/lib/api';

// TikTok icon component
const TikTokIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

export default function CreateTikTokPost({ isOpen, onClose, accounts = [], onSuccess }) {
    const [step, setStep] = useState(1); // 1: Upload Video, 2: Settings, 3: Review
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
    const [caption, setCaption] = useState('');
    const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
    const [disableComment, setDisableComment] = useState(false);
    const [disableDuet, setDisableDuet] = useState(false);
    const [disableStitch, setDisableStitch] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            setError('TikTok only supports video content');
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

    const handlePublish = async () => {
        if (!selectedAccountId) {
            setError('Please select an account');
            return;
        }
        if (!videoUrl) {
            setError('Please upload a video first');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await tiktokAPI.publish(selectedAccountId, {
                videoUrl,
                caption,
                privacyLevel,
                disableComment,
                disableDuet,
                disableStitch
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
        setCaption('');
        setPrivacyLevel('PUBLIC_TO_EVERYONE');
        setDisableComment(false);
        setDisableDuet(false);
        setDisableStitch(false);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const privacyOptions = [
        { value: 'PUBLIC_TO_EVERYONE', label: 'Public', icon: Eye, desc: 'Everyone can view' },
        { value: 'FOLLOWER_OF_CREATOR', label: 'Followers', icon: Users, desc: 'Only followers can view' },
        { value: 'MUTUAL_FOLLOW_FRIENDS', label: 'Friends', icon: Users, desc: 'Mutual followers only' },
        { value: 'SELF_ONLY', label: 'Private', icon: EyeOff, desc: 'Only you can view' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-xl flex items-center justify-center text-white">
                            <TikTokIcon />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: '#354F52' }}>Create TikTok Post</h2>
                            <p className="text-sm text-gray-500">Step {step} of 3</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b">
                    {['Upload', 'Settings', 'Publish'].map((label, idx) => (
                        <button
                            key={label}
                            onClick={() => videoUrl && setStep(idx + 1)}
                            disabled={!videoUrl && idx > 0}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${step === idx + 1
                                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                                : step > idx + 1
                                    ? 'bg-pink-100 text-pink-600'
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
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Upload Video */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Account Selector */}
                            {accounts.length > 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
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
                                <div className="relative aspect-[9/16] max-h-[400px] mx-auto rounded-xl overflow-hidden bg-black">
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
                                    className="w-full aspect-[9/16] max-h-[400px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-pink-400 hover:bg-pink-50/50 transition-all cursor-pointer text-gray-500"
                                >
                                    <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center">
                                        <Video className="w-8 h-8 text-pink-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-gray-700">Upload Video</p>
                                        <p className="text-sm text-gray-400">MP4 or WebM, max 10 min</p>
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

                            {/* Caption */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Write a caption... #fyp #viral"
                                    rows={3}
                                    maxLength={2200}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{caption.length}/2200</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Settings */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Privacy Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Who can view this video?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {privacyOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setPrivacyLevel(opt.value)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${privacyLevel === opt.value
                                                ? 'border-pink-500 bg-pink-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <opt.icon className={`w-4 h-4 ${privacyLevel === opt.value ? 'text-pink-500' : 'text-gray-400'}`} />
                                                <span className="font-medium text-sm">{opt.label}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Interaction Settings</label>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium text-sm">Allow Comments</p>
                                            <p className="text-xs text-gray-500">Let others comment on your video</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDisableComment(!disableComment)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${!disableComment ? 'bg-pink-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${!disableComment ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium text-sm">Allow Duet</p>
                                            <p className="text-xs text-gray-500">Let others create duets with your video</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDisableDuet(!disableDuet)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${!disableDuet ? 'bg-pink-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${!disableDuet ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Share2 className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium text-sm">Allow Stitch</p>
                                            <p className="text-xs text-gray-500">Let others stitch your video into theirs</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDisableStitch(!disableStitch)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${!disableStitch ? 'bg-pink-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${!disableStitch ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Review & Publish</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Video Preview */}
                                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black">
                                    <video src={videoPreview} className="w-full h-full object-contain" />
                                </div>

                                {/* Details */}
                                <div className="space-y-4 text-sm">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Account</p>
                                        <p className="font-medium">{accounts.find(a => a.accountId === selectedAccountId)?.accountName || selectedAccountId}</p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Privacy</p>
                                        <p className="font-medium">{privacyOptions.find(p => p.value === privacyLevel)?.label}</p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Caption</p>
                                        <p className="text-gray-700 line-clamp-4">{caption || '(No caption)'}</p>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Settings</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className={`px-2 py-1 rounded text-xs ${!disableComment ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                Comments {!disableComment ? 'On' : 'Off'}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs ${!disableDuet ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                Duet {!disableDuet ? 'On' : 'Off'}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs ${!disableStitch ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                Stitch {!disableStitch ? 'On' : 'Off'}
                                            </span>
                                        </div>
                                    </div>
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
                            disabled={!videoUrl || uploading}
                            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-red-600 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-red-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                'Publish Now'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
