'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Calendar, Clock, MessageCircle, Users, Link2, FileText, Image as ImageIcon, Trash2, Plus, Sparkles } from 'lucide-react';
import { instagramAPI, uploadAPI } from '@/lib/api';

export default function CreateInstagramPost({ isOpen, onClose, account, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Media, 2: Caption, 3: Auto-Reply, 4: Schedule
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Media state
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState('IMAGE');
    const fileInputRef = useRef(null);

    // Caption state
    const [caption, setCaption] = useState('');
    const MAX_CAPTION = 2200;

    // Schedule state
    const [publishType, setPublishType] = useState('now'); // 'now' or 'schedule'
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Auto-reply state
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [triggerType, setTriggerType] = useState('keyword'); // 'keyword' or 'any'
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState('');
    const [targetAudience, setTargetAudience] = useState('anyone'); // 'followers' or 'anyone'
    const [replyMessage, setReplyMessage] = useState('');
    const [attachmentType, setAttachmentType] = useState('none'); // 'none', 'image', 'link', 'file'
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentPreview, setAttachmentPreview] = useState('');
    const [attachmentFileName, setAttachmentFileName] = useState('');
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const attachmentInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Determine media type
        const isVideo = file.type.startsWith('video/');
        setMediaType(isVideo ? 'REELS' : 'IMAGE');

        // Create preview
        const reader = new FileReader();
        reader.onload = (ev) => setMediaPreview(ev.target.result);
        reader.readAsDataURL(file);
        setMediaFile(file);

        // Upload file
        try {
            setLoading(true);
            const uploadRes = await uploadAPI.uploadFile(file);
            const uploadedUrl = uploadRes.data?.files?.[0]?.url || uploadRes.data?.url;
            setMediaUrl(uploadedUrl);
        } catch (err) {
            setError('Failed to upload media: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim().toLowerCase())) {
            setKeywords([...keywords, keywordInput.trim().toLowerCase()]);
            setKeywordInput('');
        }
    };

    const removeKeyword = (kw) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    const handleAttachmentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAttachment(true);

        try {
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => setAttachmentPreview(ev.target.result);
                reader.readAsDataURL(file);
            }

            setAttachmentFileName(file.name);

            // Upload file
            const uploadRes = await uploadAPI.uploadFile(file);
            const uploadedUrl = uploadRes.data?.files?.[0]?.url || uploadRes.data?.url;
            setAttachmentUrl(uploadedUrl);
        } catch (err) {
            setError('Failed to upload attachment: ' + err.message);
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handlePublish = async () => {
        if (!mediaUrl) {
            setError('Please upload media first');
            return;
        }
        if (!account?.platformAccountId) {
            setError('No Instagram account selected');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Publish post to Instagram
            const publishRes = await instagramAPI.publishByUrl(account.platformAccountId, {
                mediaType,
                url: mediaUrl,
                caption
            });

            const postId = publishRes.data?.id || publishRes.data?.mediaId;

            // Create auto-reply rule if enabled
            if (autoReplyEnabled && postId) {
                await instagramAPI.createAutoReplyRule({
                    postId,
                    accountId: account.platformAccountId,
                    triggerType,
                    keywords: triggerType === 'keyword' ? keywords : [],
                    targetAudience,
                    replyContent: {
                        message: replyMessage,
                        attachmentType,
                        attachmentUrl: (attachmentType === 'image' || attachmentType === 'file') ? attachmentUrl : undefined,
                        attachmentFileName: attachmentType === 'file' ? attachmentFileName : undefined,
                        linkUrl: attachmentType === 'link' ? linkUrl : undefined
                    },
                    enabled: true
                });
            }

            onSuccess?.();
            onClose();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setMediaFile(null);
        setMediaPreview('');
        setMediaUrl('');
        setCaption('');
        setAutoReplyEnabled(false);
        setKeywords([]);
        setReplyMessage('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                            <Image src="/instagram.png" alt="Instagram" width={24} height={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: '#354F52' }}>Create Instagram Post</h2>
                            <p className="text-sm text-gray-500">Step {step} of 4</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b">
                    {['Media', 'Caption', 'Auto-Reply', 'Publish'].map((label, idx) => (
                        <button
                            key={label}
                            onClick={() => setStep(idx + 1)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${step === idx + 1
                                ? 'bg-pink-500 text-white'
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

                    {/* Step 1: Media Upload */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Upload Media</h3>

                            {mediaPreview ? (
                                <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-gray-100 mb-4">
                                    {mediaType === 'REELS' ? (
                                        <video src={mediaPreview} controls className="w-full h-full object-contain" />
                                    ) : (
                                        <Image src={mediaPreview} alt="Preview" fill className="object-contain" />
                                    )}
                                    <button
                                        onClick={() => { setMediaFile(null); setMediaPreview(''); setMediaUrl(''); }}
                                        className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-pink-400 hover:bg-pink-50/50 transition-all cursor-pointer"
                                >
                                    <Upload className="w-10 h-10 text-gray-400" />
                                    <span className="text-gray-600">Click to upload image or video</span>
                                    <span className="text-xs text-gray-400">JPG, PNG, MP4 (max 100MB)</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Step 2: Caption */}
                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Write Caption</h3>
                            <div className="relative">
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
                                    placeholder="Write a caption for your post..."
                                    rows={6}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                    {caption.length}/{MAX_CAPTION}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">Tip: Use hashtags to increase reach</p>
                        </div>
                    )}

                    {/* Step 3: Auto-Reply */}
                    {step === 3 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Auto-Reply DM</h3>
                                        <p className="text-sm text-gray-500">Automatically DM users who comment</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${autoReplyEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoReplyEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {autoReplyEnabled && (
                                <div className="space-y-5">
                                    {/* Trigger Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Trigger When</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setTriggerType('keyword')}
                                                className={`p-3 rounded-xl border-2 transition-all ${triggerType === 'keyword' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <MessageCircle className={`w-5 h-5 mx-auto mb-1 ${triggerType === 'keyword' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <p className="text-sm font-medium">Specific Keywords</p>
                                            </button>
                                            <button
                                                onClick={() => setTriggerType('any')}
                                                className={`p-3 rounded-xl border-2 transition-all ${triggerType === 'any' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <MessageCircle className={`w-5 h-5 mx-auto mb-1 ${triggerType === 'any' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <p className="text-sm font-medium">Any Comment</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    {triggerType === 'keyword' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={keywordInput}
                                                    onChange={(e) => setKeywordInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                                    placeholder="e.g., info, link, dm me"
                                                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400"
                                                />
                                                <button onClick={addKeyword} className="px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600">
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {keywords.map(kw => (
                                                    <span key={kw} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                                        {kw}
                                                        <button onClick={() => removeKeyword(kw)} className="hover:text-purple-900">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Target Audience */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reply To</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setTargetAudience('anyone')}
                                                className={`p-3 rounded-xl border-2 transition-all ${targetAudience === 'anyone' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                                            >
                                                <Users className={`w-5 h-5 mx-auto mb-1 ${targetAudience === 'anyone' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <p className="text-sm font-medium">Anyone</p>
                                            </button>
                                            <button
                                                onClick={() => setTargetAudience('followers')}
                                                className={`p-3 rounded-xl border-2 transition-all ${targetAudience === 'followers' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                                            >
                                                <Users className={`w-5 h-5 mx-auto mb-1 ${targetAudience === 'followers' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <p className="text-sm font-medium">Followers Only</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reply Message */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">DM Message</label>
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Hey! Thanks for commenting. Here's the link you requested..."
                                            rows={3}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 resize-none"
                                        />
                                    </div>

                                    {/* Attachment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Include Attachment</label>
                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {[
                                                { type: 'none', icon: X, label: 'None' },
                                                { type: 'link', icon: Link2, label: 'Link' },
                                                { type: 'image', icon: ImageIcon, label: 'Image' },
                                                { type: 'file', icon: FileText, label: 'File' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.type}
                                                    onClick={() => { setAttachmentType(opt.type); setAttachmentUrl(''); setAttachmentPreview(''); setAttachmentFileName(''); }}
                                                    className={`p-2 rounded-xl border-2 text-center transition-all ${attachmentType === opt.type ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                                                >
                                                    <opt.icon className={`w-5 h-5 mx-auto mb-1 ${attachmentType === opt.type ? 'text-purple-600' : 'text-gray-400'}`} />
                                                    <p className="text-xs">{opt.label}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {attachmentType === 'link' && (
                                            <input
                                                type="url"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                placeholder="https://example.com/your-link"
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400"
                                            />
                                        )}

                                        {attachmentType === 'image' && (
                                            <div>
                                                {attachmentPreview ? (
                                                    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 mb-2">
                                                        <Image src={attachmentPreview} alt="Attachment" fill className="object-contain" />
                                                        <button
                                                            onClick={() => { setAttachmentUrl(''); setAttachmentPreview(''); }}
                                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => attachmentInputRef.current?.click()}
                                                        disabled={uploadingAttachment}
                                                        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                                                    >
                                                        {uploadingAttachment ? (
                                                            <>
                                                                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                                                <span className="text-sm text-gray-500">Uploading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-8 h-8 text-gray-400" />
                                                                <span className="text-sm text-gray-600">Click to upload image</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <input
                                                    ref={attachmentInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAttachmentUpload}
                                                    className="hidden"
                                                />
                                            </div>
                                        )}

                                        {attachmentType === 'file' && (
                                            <div>
                                                {attachmentFileName ? (
                                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                        <FileText className="w-8 h-8 text-purple-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{attachmentFileName}</p>
                                                            <p className="text-xs text-gray-500">Ready to send</p>
                                                        </div>
                                                        <button
                                                            onClick={() => { setAttachmentUrl(''); setAttachmentFileName(''); }}
                                                            className="p-1.5 text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => attachmentInputRef.current?.click()}
                                                        disabled={uploadingAttachment}
                                                        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                                                    >
                                                        {uploadingAttachment ? (
                                                            <>
                                                                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                                                <span className="text-sm text-gray-500">Uploading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-8 h-8 text-gray-400" />
                                                                <span className="text-sm text-gray-600">Click to upload file (PDF, DOC, etc.)</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <input
                                                    ref={attachmentInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.txt,.zip"
                                                    onChange={handleAttachmentUpload}
                                                    className="hidden"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Publish */}
                    {step === 4 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Publish Settings</h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => setPublishType('now')}
                                    className={`p-4 rounded-xl border-2 transition-all ${publishType === 'now' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                                >
                                    <Clock className={`w-6 h-6 mx-auto mb-2 ${publishType === 'now' ? 'text-pink-600' : 'text-gray-400'}`} />
                                    <p className="font-medium">Publish Now</p>
                                </button>
                                <button
                                    onClick={() => setPublishType('schedule')}
                                    className={`p-4 rounded-xl border-2 transition-all ${publishType === 'schedule' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                                >
                                    <Calendar className={`w-6 h-6 mx-auto mb-2 ${publishType === 'schedule' ? 'text-pink-600' : 'text-gray-400'}`} />
                                    <p className="font-medium">Schedule</p>
                                </button>
                            </div>

                            {publishType === 'schedule' && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                        <input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-medium mb-3" style={{ color: '#354F52' }}>Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-500">Media:</span> {mediaType === 'REELS' ? 'Video/Reel' : 'Image'}</p>
                                    <p><span className="text-gray-500">Caption:</span> {caption ? `${caption.substring(0, 50)}...` : 'No caption'}</p>
                                    <p><span className="text-gray-500">Auto-Reply:</span> {autoReplyEnabled ? 'Enabled' : 'Disabled'}</p>
                                    {autoReplyEnabled && (
                                        <p><span className="text-gray-500">Trigger:</span> {triggerType === 'any' ? 'Any comment' : `Keywords: ${keywords.join(', ')}`}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 && !mediaUrl}
                            className="px-6 py-2.5 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={loading || !mediaUrl}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                publishType === 'now' ? 'Publish Now' : 'Schedule Post'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
