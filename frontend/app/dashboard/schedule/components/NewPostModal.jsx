'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Sparkles, Clock, Trash2, Facebook, Instagram, Linkedin, Twitter, Youtube, Music2 } from 'lucide-react';
import { postsAPI, aiAPI, uploadAPI } from '@/lib/api';

const platformConfig = {
    facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
    instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-300' },
    twitter: { icon: Twitter, label: 'Twitter', color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-300' },
    linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300' },
    tiktok: { icon: Music2, label: 'TikTok', color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300' },
    youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
};

export default function NewPostModal({ isOpen, onClose, initialDate, initialData, onSave, connectedPlatforms }) {
    const isEditing = !!initialData;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('12:00');
    const [hashtags, setHashtags] = useState('');
    const [media, setMedia] = useState([]);
    const [saving, setSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setSelectedPlatforms(initialData.platforms?.map(p => ({ name: p.name, accountId: p.accountId })) || []);
            setHashtags(initialData.hashtags?.join(', ') || '');
            setMedia(initialData.media || []);
            if (initialData.scheduledDate) {
                const d = new Date(initialData.scheduledDate);
                setScheduledDate(d.toISOString().split('T')[0]);
                setScheduledTime(d.toTimeString().slice(0, 5));
            }
        } else if (initialDate) {
            const d = new Date(initialDate);
            setScheduledDate(d.toISOString().split('T')[0]);
        }
    }, [initialData, initialDate]);

    const togglePlatform = (platformName) => {
        const connected = connectedPlatforms.find(p =>
            p.platform === platformName || p.name === platformName
        );
        if (!connected) return;

        const accountId = connected.accountId || connected._id || connected.id || 'default';

        setSelectedPlatforms(prev => {
            const exists = prev.find(p => p.name === platformName);
            if (exists) return prev.filter(p => p.name !== platformName);
            return [...prev, { name: platformName, accountId }];
        });
    };

    const handleAICaption = async () => {
        if (!title && !content) return;
        setAiLoading(true);
        try {
            const platform = selectedPlatforms[0]?.name || 'instagram';
            const res = await aiAPI.caption({ topic: title || content, tone: 'engaging', platform });
            setContent(res.data.caption || res.data.text || res.data);
            if (res.data.hashtags) {
                setHashtags(Array.isArray(res.data.hashtags) ? res.data.hashtags.join(', ') : res.data.hashtags);
            }
        } catch (err) {
            console.error('AI caption failed:', err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleMediaUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        try {
            const res = await uploadAPI.uploadMedia(files);
            const uploaded = res.data.files || res.data;
            const newMedia = (Array.isArray(uploaded) ? uploaded : [uploaded]).map(f => ({
                type: f.mimetype?.startsWith('video') ? 'video' : 'image',
                url: f.url || f.secure_url,
                filename: f.filename || f.original_filename,
            }));
            setMedia(prev => [...prev, ...newMedia]);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const removeMedia = (index) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (asDraft = false) => {
        if (!title.trim() && !content.trim()) return;
        if (selectedPlatforms.length === 0) return;

        setSaving(true);
        try {
            const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
            const hashtagList = hashtags
                .split(/[,\s]+/)
                .map(h => h.replace(/^#/, '').trim())
                .filter(Boolean);

            const postData = {
                title: title.trim(),
                content: content.trim(),
                platforms: selectedPlatforms.map(p => ({
                    name: p.name,
                    accountId: p.accountId,
                    status: asDraft ? 'draft' : 'scheduled',
                })),
                media,
                hashtags: hashtagList,
                scheduledDate: dateTime.toISOString(),
                isDraft: asDraft,
                isScheduled: !asDraft,
            };

            if (isEditing) {
                await postsAPI.update(initialData._id, postData);
            } else {
                await postsAPI.create(postData);
            }

            onSave?.();
        } catch (err) {
            console.error('Failed to save post:', err);
            alert('Failed to save post. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !initialData._id) return;
        if (!confirm('Are you sure you want to delete this post?')) return;
        setSaving(true);
        try {
            await postsAPI.remove(initialData._id);
            onSave?.();
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Deduplicate connected platform names
    const availablePlatforms = [...new Set(
        connectedPlatforms.map(p => p.platform || p.name)
    )].filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Edit Post' : 'Create New Post'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Platform Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
                        <div className="flex flex-wrap gap-2">
                            {availablePlatforms.map(name => {
                                const config = platformConfig[name];
                                if (!config) return null;
                                const Icon = config.icon;
                                const isSelected = selectedPlatforms.some(p => p.name === name);
                                return (
                                    <button
                                        key={name}
                                        onClick={() => togglePlatform(name)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition
                                            ${isSelected
                                                ? `${config.bg} ${config.border} ${config.color} border-2`
                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedPlatforms.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">Select at least one platform</p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Post title..."
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Content</label>
                            <button
                                onClick={handleAICaption}
                                disabled={aiLoading || (!title && !content)}
                                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 disabled:opacity-40 font-medium"
                            >
                                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                AI Generate
                            </button>
                        </div>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Write your caption..."
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                        <div className="text-right text-xs text-gray-400 mt-0.5">{content.length} characters</div>
                    </div>

                    {/* Hashtags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags</label>
                        <input
                            type="text"
                            value={hashtags}
                            onChange={e => setHashtags(e.target.value)}
                            placeholder="marketing, social, growth..."
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">Comma-separated (without #)</p>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={e => setScheduledDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <div className="relative">
                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={e => setScheduledTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Media</label>
                        <div className="flex flex-wrap gap-2">
                            {media.map((m, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                                    {m.type === 'image' ? (
                                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">▶</div>
                                    )}
                                    <button
                                        onClick={() => removeMedia(i)}
                                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-gray-400">
                                {uploading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <ImageIcon size={18} />
                                        <span className="text-[10px] mt-0.5">Add</span>
                                    </>
                                )}
                                <input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t flex justify-between items-center bg-gray-50">
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    >
                        Save as Draft
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={saving || selectedPlatforms.length === 0 || (!title.trim() && !content.trim())}
                            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition shadow-sm"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {isEditing ? 'Update Post' : 'Schedule Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
