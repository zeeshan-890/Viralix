'use client';
import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { X, Upload, Trash2, Video, Eye, EyeOff, MessageSquare, Users, Share2, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { tiktokAPI, uploadAPI, postsAPI } from '@/lib/api';
import TikTokSettings, { useTikTokSettingsValidation } from '../../upload/components/TikTokSettings';
import { toast } from 'react-hot-toast';

// TikTok icon component
const TikTokIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

export default function CreateTikTokPost({ isOpen, onClose, accounts = [], onSuccess }) {
    const [step, setStep] = useState(1); // 1: Content, 2: Settings, 3: Schedule
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
    const [videoMeta, setVideoMeta] = useState({ filename: '', size: 0, mimetype: '' });

    // Content state
    const [caption, setCaption] = useState('');

    // Shared TikTok Settings State
    const [tiktokSettings, setTiktokSettings] = useState({
        privacyLevel: '',
        allowComment: false,
        allowDuet: false,
        allowStitch: false,
        commercialDisclosure: false,
        brandOrganic: false,
        brandedContent: false,
        creatorInfo: null
    });

    // Schedule State
    const [scheduleType, setScheduleType] = useState('now'); // now | later
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const fileInputRef = useRef(null);

    // Validation hook
    const tiktokValidation = useTikTokSettingsValidation(tiktokSettings);

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
            const uploadedFile = res.data?.files?.[0];
            if (!uploadedFile?.url) throw new Error('Failed to upload video');

            setVideoUrl(uploadedFile.url);
            setVideoMeta({
                filename: uploadedFile.filename,
                size: uploadedFile.size,
                mimetype: uploadedFile.mimetype
            });
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload video: ' + (err.message || 'Unknown error'));
            setVideoFile(null);
            setVideoPreview('');
        } finally {
            setUploading(false);
        }
    };

    const computeScheduledIso = () => {
        if (scheduleType !== 'later') return null;
        try {
            return new Date(`${date}T${time}:00`).toISOString();
        } catch {
            return null;
        }
    };

    const handlePublish = async () => {
        if (!selectedAccountId) return setError('Please select an account');
        if (!videoUrl) return setError('Please upload a video first');

        // Final Validation check
        if (!tiktokValidation.isValid) {
            setStep(2); // Go back to settings if invalid
            return setError('Please correct TikTok settings before publishing');
        }

        if (scheduleType === 'later' && (!date || !time)) {
            return setError('Please select date and time for scheduling');
        }

        setLoading(true);
        setError('');

        try {
            const isScheduled = scheduleType === 'later';
            const scheduledDate = computeScheduledIso();

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
                isScheduled,
                scheduledDate: isScheduled ? scheduledDate : undefined,
                tiktokSettings: {
                    privacyLevel: tiktokSettings.privacyLevel,
                    disableComment: !tiktokSettings.allowComment,
                    disableDuet: !tiktokSettings.allowDuet,
                    disableStitch: !tiktokSettings.allowStitch,
                    brandOrganic: tiktokSettings.brandOrganic,
                    brandedContent: tiktokSettings.brandedContent
                }
            };

            const createRes = await postsAPI.create(postPayload);
            const postId = createRes.data?._id;

            if (!postId) throw new Error('Failed to create post record');

            // 2. If 'Publish Now', trigger publication immediately
            if (!isScheduled) {
                await postsAPI.publishNow(postId);
                toast.success("Published! Note: It may take a few minutes for content to appear on TikTok.", {
                    duration: 5000,
                    icon: '🚀'
                });
            } else {
                toast.success("Post scheduled successfully!", {
                    duration: 4000,
                    icon: '📅'
                });
            }

            onSuccess?.();
            handleClose();
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
        setVideoMeta({ filename: '', size: 0, mimetype: '' });
        setCaption('');
        setTiktokSettings({
            privacyLevel: '',
            allowComment: false,
            allowDuet: false,
            allowStitch: false,
            commercialDisclosure: false,
            brandOrganic: false,
            brandedContent: false,
            creatorInfo: null
        });
        setScheduleType('now');
        setDate('');
        setTime('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

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
                            <p className="text-sm text-gray-500">
                                {step === 1 && 'Step 1: Upload Content'}
                                {step === 2 && 'Step 2: TikTok Settings'}
                                {step === 3 && 'Step 3: Review & Schedule'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center h-1 bg-gray-100">
                    <div
                        className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Upload Content */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Account Selector */}
                            {accounts.length > 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                                    >
                                        {accounts.map(a => (
                                            <option key={a.accountId} value={a.accountId}>{a.accountName || a.accountId}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Video Upload */}
                            {videoPreview ? (
                                <div className="relative aspect-[9/16] max-h-[400px] mx-auto rounded-xl overflow-hidden bg-black shadow-lg">
                                    <video src={videoPreview} controls className="w-full h-full object-contain" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                                                <p className="font-medium">Uploading... {uploadProgress}%</p>
                                            </div>
                                        </div>
                                    )}
                                    {!uploading && (
                                        <button
                                            onClick={() => { setVideoFile(null); setVideoPreview(''); setVideoUrl(''); }}
                                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors backdrop-blur-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-[9/16] max-h-[400px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-pink-400 hover:bg-pink-50/50 transition-all cursor-pointer text-gray-500 bg-gray-50"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center">
                                            <Video className="w-6 h-6 text-pink-500" />
                                        </div>
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="font-medium text-gray-700">Click to Upload Video</p>
                                        <p className="text-sm text-gray-400 mt-1">MP4 or WebM (Max 10 min)</p>
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
                                    rows={4}
                                    maxLength={2200}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none resize-none"
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-400">Add relevant hashtags for better reach</p>
                                    <p className="text-xs text-gray-400">{caption.length}/2200</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Settings */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <TikTokSettings
                                accountId={selectedAccountId}
                                settings={tiktokSettings}
                                onSettingsChange={setTiktokSettings}
                                isPhotoPost={false}
                            />

                            {/* Validation Errors */}
                            {tiktokValidation.errors.length > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                                    <p className="font-medium text-sm mb-1">Please fix the following issues:</p>
                                    <ul className="list-disc list-inside text-xs">
                                        {tiktokValidation.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Review & Schedule */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Final Review</h3>

                            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                {/* Thumbnail */}
                                <div className="w-24 h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                    {videoPreview && (
                                        <video src={videoPreview} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <p className="font-medium text-gray-900 line-clamp-2 mb-2">{caption || '(No Caption)'}</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {tiktokSettings.privacyLevel === 'PUBLIC_TO_EVERYONE' ? <Eye className="w-3 h-3" /> :
                                                tiktokSettings.privacyLevel === 'SELF_ONLY' ? <EyeOff className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                            <span>
                                                {tiktokSettings.privacyLevel === 'PUBLIC_TO_EVERYONE' ? 'Public' :
                                                    tiktokSettings.privacyLevel === 'SELF_ONLY' ? 'Private' : 'Friends/Followers'}
                                            </span>
                                        </div>
                                        {tiktokSettings.commercialDisclosure && (
                                            <div className="flex items-center gap-2 text-xs text-orange-600">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>Commercial Content</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scheduling Options */}
                            <div className="bg-white rounded-xl border-2 border-gray-100 p-1">
                                <div className="grid grid-cols-2 gap-1 p-1">
                                    <button
                                        onClick={() => setScheduleType('now')}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${scheduleType === 'now'
                                                ? 'bg-pink-50 text-pink-600 shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Publish Now
                                    </button>
                                    <button
                                        onClick={() => setScheduleType('later')}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${scheduleType === 'later'
                                                ? 'bg-pink-50 text-pink-600 shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Schedule
                                    </button>
                                </div>

                                {scheduleType === 'later' && (
                                    <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-500">Date</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={date}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => setDate(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                                    />
                                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-500">Time</label>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        value={time}
                                                        onChange={(e) => setTime(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                                    />
                                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-medium text-sm"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={
                                (step === 1 && (!videoUrl || uploading)) ||
                                (step === 2 && !tiktokValidation.isValid)
                            }
                            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={loading || (scheduleType === 'later' && (!date || !time))}
                            className="px-8 py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {scheduleType === 'now' ? 'Publishing...' : 'Scheduling...'}
                                </>
                            ) : (
                                <>
                                    {scheduleType === 'now' ? <Upload className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                    {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
