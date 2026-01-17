'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Calendar, Clock, MessageCircle, Users, Link2, FileText, Image as ImageIcon, Trash2, Plus, Sparkles, Facebook } from 'lucide-react';
import { facebookAPI, facebookAutoReplyAPI, uploadAPI } from '@/lib/api';

export default function CreateFacebookPost({ isOpen, onClose, pages = [], onSuccess }) {
    const [step, setStep] = useState(1); // 1: Content/Media, 2: Auto-Reply, 3: Publish
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Page Selection
    // If pages provided, select first by default
    const [selectedPageId, setSelectedPageId] = useState(pages?.[0]?.id || '');

    // Content state
    const [postType, setPostType] = useState('media'); // 'media' or 'text'
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaType, setMediaType] = useState('IMAGE'); // IMAGE or VIDEO
    const [caption, setCaption] = useState('');
    const [link, setLink] = useState('');

    // Auto-reply state
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [triggerType, setTriggerType] = useState('keyword');
    const [keywords, setKeywords] = useState([]);
    const [keywordInput, setKeywordInput] = useState('');
    const [targetAudience, setTargetAudience] = useState('anyone');
    const [replyMessage, setReplyMessage] = useState('');
    const [attachmentType, setAttachmentType] = useState('none');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentPreview, setAttachmentPreview] = useState('');
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const attachmentInputRef = useRef(null);

    // Schedule state
    const [publishType, setPublishType] = useState('now');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        setMediaType(isVideo ? 'VIDEO' : 'IMAGE');

        const reader = new FileReader();
        reader.onload = (ev) => setMediaPreview(ev.target.result);
        reader.readAsDataURL(file);
        setMediaFile(file);
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !keywords.includes(keywordInput.trim().toLowerCase())) {
            setKeywords([...keywords, keywordInput.trim().toLowerCase()]);
            setKeywordInput('');
        }
    };

    const removeKeyword = (kw) => setKeywords(keywords.filter(k => k !== kw));

    const handlePublish = async () => {
        if (!selectedPageId) {
            setError('Please select a Page');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let postId = null;

            // 1. Publish Post
            if (mediaFile) {
                // Upload Media Post
                if (mediaType === 'VIDEO') {
                    const res = await facebookAPI.uploadPageVideo(selectedPageId, mediaFile, caption);
                    postId = res.data?.result?.id || res.data?.result?.post_id;
                } else {
                    const res = await facebookAPI.uploadPagePhoto(selectedPageId, mediaFile, caption);
                    postId = res.data?.result?.id || res.data?.result?.post_id;
                }
            } else if (caption || link) {
                // Text/Link Post
                const res = await facebookAPI.createPagePost(selectedPageId, { message: caption, link });
                postId = res.data?.result?.id;
            } else {
                throw new Error('Post content is empty');
            }

            if (!postId) throw new Error('Failed to get Post ID from Facebook');

            // 2. Create Auto-Reply Rule
            if (autoReplyEnabled) {
                await facebookAutoReplyAPI.createRule({
                    postId,
                    accountId: selectedPageId,
                    triggerType,
                    keywords: triggerType === 'keyword' ? keywords : [],
                    targetAudience,
                    replyContent: {
                        message: replyMessage,
                        attachmentType,
                        attachmentUrl: (attachmentType === 'image' || attachmentType === 'file') ? attachmentUrl : undefined,
                        linkUrl: attachmentType === 'link' ? linkUrl : undefined
                    },
                    enabled: true
                });
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Publish error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Facebook className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: '#354F52' }}>Create Facebook Post</h2>
                            <p className="text-sm text-gray-500">Step {step} of 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b">
                    {['Content', 'Auto-Reply', 'Publish'].map((label, idx) => (
                        <button
                            key={label}
                            onClick={() => setStep(idx + 1)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${step === idx + 1
                                ? 'bg-blue-500 text-white'
                                : step > idx + 1
                                    ? 'bg-blue-100 text-blue-600'
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

                    {/* Step 1: Content */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Page Selector (if multiple) */}
                            {pages.length > 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Page</label>
                                    <select
                                        value={selectedPageId}
                                        onChange={(e) => setSelectedPageId(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                    >
                                        {pages.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="What's on your mind?"
                                    rows={4}
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 resize-none mb-4"
                                />

                                {/* Link Input */}
                                <input
                                    type="url"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="Add a link (optional)"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 mb-4"
                                />

                                {/* Media Upload */}
                                {mediaPreview ? (
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                                        {mediaType === 'VIDEO' ? (
                                            <video src={mediaPreview} controls className="w-full h-full object-contain" />
                                        ) : (
                                            <Image src={mediaPreview} alt="Preview" fill className="object-contain" />
                                        )}
                                        <button
                                            onClick={() => { setMediaFile(null); setMediaPreview(''); }}
                                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer text-gray-500"
                                    >
                                        <ImageIcon className="w-6 h-6" />
                                        <span>Add Photo/Video</span>
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
                        </div>
                    )}

                    {/* Step 2: Auto-Reply - Reuse Logic similar to IG */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold" style={{ color: '#354F52' }}>Auto-Reply DM</h3>
                                        <p className="text-sm text-gray-500">Send private reply to comments</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${autoReplyEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoReplyEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {autoReplyEnabled ? (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    {/* Trigger Type */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Trigger Rule</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setTriggerType('keyword')} className={`p-3 rounded-lg border text-sm ${triggerType === 'keyword' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white'}`}>Specific Keywords</button>
                                            <button onClick={() => setTriggerType('any')} className={`p-3 rounded-lg border text-sm ${triggerType === 'any' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white'}`}>Any Comment</button>
                                        </div>
                                    </div>

                                    {triggerType === 'keyword' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Keywords</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={keywordInput}
                                                    onChange={(e) => setKeywordInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                                                    placeholder="Enter keyword..."
                                                    className="flex-1 p-2 text-sm border border-gray-200 rounded-lg"
                                                />
                                                <button onClick={addKeyword} className="px-3 bg-purple-500 text-white rounded-lg text-sm">Add</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {keywords.map(kw => (
                                                    <span key={kw} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs flex items-center gap-1">
                                                        {kw} <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Private Reply Message</label>
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            rows={3}
                                            placeholder="Message to send privately..."
                                            className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                                        />
                                    </div>

                                    {/* Attachments simplified for FB */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Attachment Link</label>
                                        <input
                                            type="url"
                                            value={linkUrl}
                                            onChange={(e) => { setLinkUrl(e.target.value); setAttachmentType(e.target.value ? 'link' : 'none'); }}
                                            placeholder="Optional link to include"
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 italic">
                                    Auto-reply is disabled for this post.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Publish */}
                    {step === 3 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Review & Publish</h3>

                            <div className="space-y-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between">
                                    <span className="font-medium">Page:</span>
                                    <span>{pages.find(p => p.id === selectedPageId)?.name || selectedPageId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Type:</span>
                                    <span className="capitalize">{mediaFile ? (mediaType === 'VIDEO' ? 'Video' : 'Photo') : 'Text/Link'}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Caption:</span>
                                    <p className="mt-1 line-clamp-3 italic bg-white p-2 rounded border border-gray-100">{caption || '(No caption)'}</p>
                                </div>
                                {link && (
                                    <div className="flex justify-between">
                                        <span className="font-medium">Link:</span>
                                        <span className="truncate max-w-[200px]">{link}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="font-medium">Auto-Reply:</span>
                                    <span className={autoReplyEnabled ? 'text-green-600 font-bold' : 'text-gray-400'}>{autoReplyEnabled ? 'Enabled' : 'Disabled'}</span>
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

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 flex items-center gap-2"
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
