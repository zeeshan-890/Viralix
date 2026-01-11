'use client';
import { useEffect, useState } from 'react';
import { X, Upload, Trash2, Save, Send, Calendar, Loader2 } from 'lucide-react';
import { postsAPI, uploadAPI, platformsAPI } from '@/lib/api';

export default function PostEditModal({ isOpen, onClose, post, onSave }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        platforms: [],
        media: [],
        hashtags: [],
        mentions: [],
        scheduledDate: '',
        isScheduled: false
    });

    // Available platforms state
    const [availablePlatforms, setAvailablePlatforms] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Load available platforms and post data
    useEffect(() => {
        if (isOpen) {
            loadAvailablePlatforms();
            if (post) {
                // Edit mode - populate form with existing post data
                const schedDate = post.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 16) : '';
                setFormData({
                    title: post.title || '',
                    content: post.content || '',
                    platforms: post.platforms || [],
                    media: post.media || [],
                    hashtags: post.hashtags || [],
                    mentions: post.mentions || [],
                    scheduledDate: schedDate,
                    isScheduled: post.isScheduled || false
                });
            } else {
                // New post mode - reset form
                setFormData({
                    title: '',
                    content: '',
                    platforms: [],
                    media: [],
                    hashtags: [],
                    mentions: [],
                    scheduledDate: '',
                    isScheduled: false
                });
            }
        }
    }, [isOpen, post]);

    const loadAvailablePlatforms = async () => {
        setLoading(true);
        try {
            const response = await platformsAPI.getConnected();
            const accounts = response.data?.accounts || [];

            const platforms = accounts.map(acc => ({
                id: `${acc.platform}-${acc.platformAccountId}`,
                name: acc.platform,
                accountId: acc.platformAccountId,
                displayName: `${acc.accountName} (${acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)})`,
                icon: getPlatformIcon(acc.platform)
            }));

            setAvailablePlatforms(platforms);
        } catch (err) {
            setError('Failed to load connected accounts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'facebook': return '📘';
            case 'instagram': return '📷';
            case 'tiktok': return '🎵';
            case 'youtube': return '📺';
            case 'twitter': return '🐦';
            case 'linkedin': return '💼';
            default: return '📱';
        }
    };

    const handleFileUpload = async (files) => {
        if (!files.length) return;

        setUploading(true);
        try {
            const response = await uploadAPI.uploadMedia(Array.from(files));
            const uploadedMedia = response.data?.files || [];

            setFormData(prev => ({
                ...prev,
                media: [...prev.media, ...uploadedMedia.map(file => ({
                    type: file.mimetype?.startsWith('video/') ? 'video' : 'image',
                    url: file.url,
                    filename: file.filename,
                    size: file.size,
                    mimetype: file.mimetype
                }))]
            }));
            setSelectedFiles([]);
        } catch (err) {
            setError('Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    const handlePlatformToggle = (platform) => {
        setFormData(prev => {
            const isSelected = prev.platforms.some(p => p.accountId === platform.accountId && p.name === platform.name);
            if (isSelected) {
                return {
                    ...prev,
                    platforms: prev.platforms.filter(p => !(p.accountId === platform.accountId && p.name === platform.name))
                };
            } else {
                return {
                    ...prev,
                    platforms: [...prev.platforms, {
                        name: platform.name,
                        accountId: platform.accountId
                    }]
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim() || !formData.platforms.length) {
            setError('Please fill in all required fields and select at least one platform');
            return;
        }

        setSaving(true);
        setError('');

        try {
            let response;
            if (post) {
                // Update existing post
                response = await postsAPI.update(post._id, formData);
            } else {
                // Create new post
                response = await postsAPI.create(formData);
            }

            onSave?.(response.data);
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save post');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!post || !confirm('Are you sure you want to delete this post?')) return;

        setSaving(true);
        try {
            await postsAPI.remove(post._id);
            onSave?.();
            closeModal();
        } catch (err) {
            setError('Failed to delete post');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishNow = async () => {
        if (!post) return;

        setSaving(true);
        try {
            await postsAPI.publishNow(post._id);
            onSave?.();
            closeModal();
        } catch (err) {
            setError('Failed to publish post');
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        onClose?.();
        setError('');
        setSelectedFiles([]);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={closeModal} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 px-6 py-5 border-b border-gray-200 bg-white rounded-t-2xl"
                    style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                                style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {post ? 'Edit Post' : 'Create New Post'}
                            </h2>
                        </div>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl border-2 border-red-200"
                            style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                            <span className="text-sm font-semibold text-red-700">{error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            <span className="text-gray-500 font-medium">Loading platforms...</span>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                            style={{ focusRing: '2px solid #84A98C' }}
                            placeholder="Enter post title"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                            placeholder="Write your post content..."
                            required
                        />
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Media
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 hover:border-gray-400 transition-all">
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                                id="media-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="media-upload" className="cursor-pointer">
                                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                                <div className="text-sm font-semibold text-gray-700 mb-1">
                                    {uploading ? 'Uploading...' : 'Click to upload images or videos'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Supports JPG, PNG, MP4, and more
                                </div>
                            </label>
                        </div>

                        {/* Media Preview */}
                        {formData.media.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {formData.media.map((media, index) => (
                                    <div key={index} className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: media.type === 'video'
                                                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                }}>
                                                <span className="text-lg">
                                                    {media.type === 'video' ? '🎥' : '📷'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 truncate">
                                                    {media.filename}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {media.type} • {Math.round((media.size || 0) / 1024)} KB
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        media: prev.media.filter((_, i) => i !== index)
                                                    }));
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platforms */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Platforms <span className="text-red-500">*</span> (Select at least one)
                        </label>
                        <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto p-1">
                            {availablePlatforms.map((platform) => {
                                const isSelected = formData.platforms.some(
                                    p => p.accountId === platform.accountId && p.name === platform.name
                                );
                                return (
                                    <label
                                        key={platform.id}
                                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                                            ? 'border-green-400 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        style={isSelected ? {
                                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                        } : { background: 'white' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handlePlatformToggle(platform)}
                                            className="w-5 h-5 rounded"
                                        />
                                        <span className="text-xl">{platform.icon}</span>
                                        <span className="font-semibold text-gray-900">{platform.displayName}</span>
                                    </label>
                                );
                            })}
                        </div>

                        {availablePlatforms.length === 0 && !loading && (
                            <div className="text-sm text-gray-500 mt-2 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                ⚠️ No connected accounts found. Please connect Facebook or Instagram accounts first.
                            </div>
                        )}
                    </div>

                    {/* Schedule */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
                        <label className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                checked={formData.isScheduled}
                                onChange={(e) => setFormData(prev => ({ ...prev, isScheduled: e.target.checked }))}
                                className="w-5 h-5 rounded"
                            />
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-bold text-gray-900">Schedule for later</span>
                        </label>

                        {formData.isScheduled && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Schedule Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:border-transparent bg-white"
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                            Cancel
                        </button>

                        <div className="flex gap-3">
                            {post && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        {saving ? 'Deleting...' : 'Delete'}
                                    </button>

                                    {['scheduled', 'draft'].some(status =>
                                        post.platforms?.some(p => p.status === status)
                                    ) && (
                                            <button
                                                type="button"
                                                onClick={handlePublishNow}
                                                disabled={saving}
                                                className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                {saving ? 'Publishing...' : 'Publish Now'}
                                            </button>
                                        )}
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : post ? 'Save Changes' : 'Create Post'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
