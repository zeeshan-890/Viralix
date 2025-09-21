'use client';
import { useEffect, useState } from 'react';
import { postsAPI, facebookAPI, instagramAPI, uploadAPI } from '@/lib/api';

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
            const [fbResponse, igResponse] = await Promise.all([
                facebookAPI.status(),
                instagramAPI.status()
            ]);

            const platforms = [];

            // Add Facebook pages
            if (fbResponse.data?.connected && fbResponse.data?.pages) {
                fbResponse.data.pages.forEach(page => {
                    platforms.push({
                        id: `facebook-${page.id}`,
                        name: 'facebook',
                        accountId: page.id,
                        displayName: `${page.name} (Facebook)`,
                        icon: '💻'
                    });
                });
            }

            // Add Instagram accounts (from linked Facebook pages)
            if (igResponse.data?.accounts) {
                igResponse.data.accounts.forEach(account => {
                    // instagram.js returns { igUserId, pageId, pageName }
                    const igUserId = account.igUserId || account.instagramId || account.id;
                    const pageName = account.pageName || account.username || igUserId;
                    if (!igUserId) return; // skip if missing
                    platforms.push({
                        id: `instagram-${igUserId}`,
                        name: 'instagram',
                        accountId: igUserId,
                        displayName: `${pageName} (Instagram)`,
                        icon: '📷'
                    });
                });
            }

            setAvailablePlatforms(platforms);
        } catch (err) {
            setError('Failed to load connected accounts');
        } finally {
            setLoading(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeModal} />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {post ? 'Edit Post' : 'Create New Post'}
                    </h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-4">
                            <div className="text-gray-500">Loading platforms...</div>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter post title"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content *
                        </label>
                        <textarea
                            rows={4}
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Write your post content..."
                            required
                        />
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Media
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                                <div className="text-gray-400 mb-2">📁</div>
                                <div className="text-sm text-gray-600">
                                    {uploading ? 'Uploading...' : 'Click to upload images or videos'}
                                </div>
                            </label>
                        </div>

                        {/* Media Preview */}
                        {formData.media.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                {formData.media.map((media, index) => (
                                    <div key={index} className="relative bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">
                                                {media.type === 'video' ? '🎥' : '📷'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">
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
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platforms */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platforms * (Select at least one)
                        </label>
                        <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                            {availablePlatforms.map((platform) => {
                                const isSelected = formData.platforms.some(
                                    p => p.accountId === platform.accountId && p.name === platform.name
                                );
                                return (
                                    <label
                                        key={platform.id}
                                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handlePlatformToggle(platform)}
                                            className="rounded"
                                        />
                                        <span>{platform.icon}</span>
                                        <span className="font-medium">{platform.displayName}</span>
                                    </label>
                                );
                            })}
                        </div>

                        {availablePlatforms.length === 0 && !loading && (
                            <div className="text-sm text-gray-500 mt-2">
                                No connected accounts found. Please connect Facebook or Instagram accounts first.
                            </div>
                        )}
                    </div>

                    {/* Schedule */}
                    <div>
                        <label className="flex items-center space-x-2 mb-3">
                            <input
                                type="checkbox"
                                checked={formData.isScheduled}
                                onChange={(e) => setFormData(prev => ({ ...prev, isScheduled: e.target.checked }))}
                                className="rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Schedule for later</span>
                        </label>

                        {formData.isScheduled && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Schedule Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>

                        <div className="flex space-x-3">
                            {post && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Deleting...' : 'Delete'}
                                    </button>

                                    {['scheduled', 'draft'].some(status =>
                                        post.platforms?.some(p => p.status === status)
                                    ) && (
                                            <button
                                                type="button"
                                                onClick={handlePublishNow}
                                                disabled={saving}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {saving ? 'Publishing...' : 'Publish Now'}
                                            </button>
                                        )}
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : post ? 'Save Changes' : 'Create Post'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
