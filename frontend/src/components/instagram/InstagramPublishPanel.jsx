'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformIcon from '@/components/ui/PlatformIcon';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { platformButtonClass } from '@/config/platforms';
import {
    Loader2,
    ExternalLink,
    Trash2,
    Upload,
    X,
    RefreshCw,
    CheckCircle2,
    Image as ImageIcon,
    Film,
    LayoutGrid,
    Clapperboard,
} from 'lucide-react';
import { uploadAPI } from '@/lib/api';
import notify from '@/lib/notify';

const MEDIA_TYPES = [
    { id: 'IMAGE', label: 'Image', icon: ImageIcon, accept: 'image/jpeg', hint: 'JPEG only' },
    { id: 'REELS', label: 'Reel', icon: Film, accept: 'video/*', hint: 'Short-form video' },
    { id: 'STORIES', label: 'Story', icon: Clapperboard, accept: 'image/jpeg,video/*', hint: 'Image or video' },
    { id: 'CAROUSEL', label: 'Carousel', icon: LayoutGrid, accept: 'image/jpeg,video/*', hint: '2-10 items' },
];

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function InstagramPublishPanel({
    api,
    title = 'Instagram Publish',
    subtitle = 'Instagram Login — publish images, reels, stories, and carousels',
    accountsTitle = 'Connected Accounts',
    unavailableMessage,
    disconnectConfirm = 'Disconnect this Instagram account?',
    isOpen,
    onClose,
    onSuccess,
    showLogs = true,
    showAccountsCard = true,
    modal = false,
}) {
    const [accounts, setAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [connecting, setConnecting] = useState(false);

    const [selectedAccount, setSelectedAccount] = useState('');
    const [mediaType, setMediaType] = useState('IMAGE');
    const [caption, setCaption] = useState('');
    const [altText, setAltText] = useState('');
    const [isAiGenerated, setIsAiGenerated] = useState(false);

    const [media, setMedia] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [result, setResult] = useState(null);

    const [logs, setLogs] = useState([]);
    const [limit, setLimit] = useState(null);
    const [apiAvailable, setApiAvailable] = useState(true);

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const res = await api.accounts();
            const list = res.data.accounts || [];
            setApiAvailable(true);
            setAccounts(list);
            setSelectedAccount((prev) => prev || (list[0]?.id ?? ''));
        } catch (error) {
            if (error?.response?.status === 404) {
                setApiAvailable(false);
                return;
            }
            notify.error(error.response?.data?.message || 'Failed to load Instagram accounts');
        } finally {
            setLoadingAccounts(false);
        }
    }, [api]);

    const loadLogs = useCallback(async () => {
        if (!apiAvailable) return;
        try {
            const res = await api.logs();
            setLogs(res.data.logs || []);
        } catch {
            /* logs are best-effort */
        }
    }, [api, apiAvailable]);

    useEffect(() => {
        loadAccounts();
        if (showLogs) loadLogs();

        if (modal) return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');
        const username = params.get('username');
        if (success) {
            notify.success(username ? `Connected @${username}` : 'Instagram account connected');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (error) {
            notify.error(decodeURIComponent(error));
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [loadAccounts, loadLogs, modal, showLogs]);

    const handleConnect = async () => {
        if (!apiAvailable) {
            notify.warning(unavailableMessage || 'Instagram publish API is not available.');
            return;
        }
        if (!api.connect) {
            notify.warning('Connect is not configured for this view.');
            return;
        }
        setConnecting(true);
        try {
            const res = await api.connect();
            window.location.href = res.data.authUrl;
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to start Instagram connection');
            setConnecting(false);
        }
    };

    const handleDisconnect = async (id) => {
        if (!apiAvailable) return;
        if (!confirm(disconnectConfirm)) return;
        try {
            await api.disconnect(id);
            notify.success('Account disconnected');
            if (selectedAccount === id) setSelectedAccount('');
            loadAccounts();
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to disconnect');
        }
    };

    const handleMediaTypeChange = (id) => {
        setMediaType(id);
        setMedia([]);
        setResult(null);
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;

        const isCarousel = mediaType === 'CAROUSEL';
        if (!isCarousel && files.length > 1) {
            notify.warning('Only one file allowed for this media type');
            files.splice(1);
        }

        setUploading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                const res = await uploadAPI.uploadFile(file, undefined, { forInstagram: true, mediaType });
                const url = res.data?.files?.[0]?.url;
                if (!url) throw new Error('Upload failed');
                const type = file.type.startsWith('video') ? 'video' : 'image';
                uploaded.push({ url, type, altText: '' });
            }
            setMedia((prev) => {
                const next = isCarousel ? [...prev, ...uploaded] : uploaded;
                return next.slice(0, isCarousel ? 10 : 1);
            });
            notify.success(`Uploaded ${uploaded.length} file${uploaded.length > 1 ? 's' : ''}`);
        } catch (error) {
            notify.error(error.response?.data?.message || error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const removeMedia = (index) => {
        setMedia((prev) => prev.filter((_, i) => i !== index));
    };

    const checkLimit = async () => {
        if (!apiAvailable) {
            notify.warning(unavailableMessage || 'Instagram publish API is not available.');
            return;
        }
        if (!selectedAccount) return;
        try {
            const res = await api.publishLimit(selectedAccount);
            setLimit(res.data);
            notify.info('Fetched publishing limit');
        } catch (error) {
            notify.error(error.response?.data?.message || 'Failed to fetch limit');
        }
    };

    const canPublish = () => {
        if (!selectedAccount || publishing || uploading) return false;
        if (mediaType === 'CAROUSEL') return media.length >= 2;
        return media.length >= 1;
    };

    const pollPublishStatus = async (logId) => {
        const maxAttempts = 100;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const res = await api.publishStatus(logId);
            const { status, mediaId, error } = res.data;
            if (status === 'published') return { mediaId };
            if (status === 'failed') throw new Error(error || 'Publish failed');
        }
        throw new Error('Still processing on Instagram. Check Recent attempts for the final status.');
    };

    const handlePublish = async () => {
        if (!apiAvailable) {
            notify.warning(unavailableMessage || 'Instagram publish API is not available.');
            return;
        }
        if (!canPublish()) return;
        setPublishing(true);
        setResult(null);
        try {
            const payload = { accountId: selectedAccount, mediaType, caption, isAiGenerated };

            if (mediaType === 'CAROUSEL') {
                payload.children = media.map((m) => ({ url: m.url, type: m.type, altText: m.altText }));
            } else if (mediaType === 'IMAGE') {
                payload.imageUrl = media[0].url;
                if (altText) payload.altText = altText;
            } else if (media[0].type === 'image') {
                payload.imageUrl = media[0].url;
                if (altText) payload.altText = altText;
            } else {
                payload.videoUrl = media[0].url;
            }

            const res = await api.publish(payload);
            if (res.data?.async) {
                notify.info(res.data.message || 'Processing on Instagram…');
                const polled = await pollPublishStatus(res.data.logId);
                setResult({ ok: true, mediaId: polled.mediaId, async: true });
                notify.success('Published to Instagram');
                onSuccess?.();
            } else {
                setResult({ ok: true, ...res.data });
                notify.success('Published to Instagram');
                onSuccess?.();
            }
            setMedia([]);
            setCaption('');
            setAltText('');
            loadLogs();
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Publish failed';
            setResult({ ok: false, message: msg });
            notify.error(msg);
            loadLogs();
        } finally {
            setPublishing(false);
        }
    };

    const activeType = MEDIA_TYPES.find((t) => t.id === mediaType);

    if (modal && isOpen === false) return null;

    const panelBody = (
        <>
            {!modal && (
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <PlatformBadge platform="instagram" size="md" />
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--viralix-accent)]">{title}</h1>
                            <p className="text-gray-600">{subtitle}</p>
                        </div>
                    </div>
                </div>
            )}

            {!apiAvailable && unavailableMessage && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {unavailableMessage}
                </div>
            )}

            {showAccountsCard && (
            <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--viralix-accent)]">{accountsTitle}</h2>
                    <button onClick={loadAccounts} className="btn btn-secondary btn-sm" disabled={loadingAccounts}>
                        <RefreshCw className={`h-4 w-4 ${loadingAccounts ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {loadingAccounts ? (
                    <div className="py-8 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        Loading accounts...
                    </div>
                ) : accounts.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">No Instagram accounts connected yet.</p>
                ) : (
                    <div className="space-y-3 mb-4">
                        {accounts.map((acc) => (
                            <div
                                key={acc.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-inset)]"
                            >
                                <div className="flex items-center gap-3">
                                    {acc.profilePictureUrl ? (
                                        <img src={acc.profilePictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--viralix-surface)] border border-[var(--viralix-border)]">
                                            <PlatformBadge platform="instagram" size="sm" rounded="full" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-[var(--viralix-accent)]">@{acc.username}</span>
                                            {acc.accountType && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                                                    {acc.accountType}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">Token expires {formatDate(acc.tokenExpires)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDisconnect(acc.id)} className="btn btn-cancel btn-sm">
                                    <Trash2 className="h-4 w-4" /> Disconnect
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {api.connect && (
                <button onClick={handleConnect} disabled={connecting} className="btn btn-confirm disabled:opacity-50">
                    {connecting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                        </>
                    ) : (
                        <>
                            <PlatformIcon platform="instagram" size={16} inverted />
                            {accounts.length > 0 ? 'Connect Another' : 'Connect Instagram'}
                            <ExternalLink className="w-4 h-4" />
                        </>
                    )}
                </button>
                )}
            </div>
            )}

            {/* Publish */}
            <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--viralix-accent)] mb-4">Publish</h2>

                {/* Account selector */}
                <label className="block text-sm font-medium text-[var(--viralix-accent)] mb-1">Account</label>
                <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full mb-4 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-sm"
                >
                    <option value="">Select an account…</option>
                    {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>@{acc.username}</option>
                    ))}
                </select>

                {/* Media type */}
                <label className="block text-sm font-medium text-[var(--viralix-accent)] mb-1">Media type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {MEDIA_TYPES.map((t) => {
                        const Icon = t.icon;
                        const active = mediaType === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleMediaTypeChange(t.id)}
                                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-all ${active
                                    ? 'border-[var(--viralix-primary)] bg-[var(--viralix-inset)] text-[var(--viralix-accent)]'
                                    : 'border-[var(--viralix-border)] text-gray-600 hover:bg-[var(--viralix-inset)]'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{t.label}</span>
                                <span className="text-[0.6875rem] text-gray-400">{t.hint}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Media upload */}
                <label className="block text-sm font-medium text-[var(--viralix-accent)] mb-1">
                    Media {mediaType === 'CAROUSEL' ? '(2-10 items)' : ''}
                </label>
                <div className="mb-4">
                    {media.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                            {media.map((m, i) => (
                                <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--viralix-border)]">
                                    {m.type === 'video' ? (
                                        <video src={m.url} className="h-24 w-full object-cover" />
                                    ) : (
                                        <img src={m.url} alt="" className="h-24 w-full object-cover" />
                                    )}
                                    <button
                                        onClick={() => removeMedia(i)}
                                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {(mediaType === 'CAROUSEL' || media.length === 0) && (
                        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--viralix-border)] p-6 cursor-pointer hover:bg-[var(--viralix-inset)] transition">
                            {uploading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-[var(--viralix-primary)]" />
                            ) : (
                                <Upload className="h-6 w-6 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-500">
                                {uploading ? 'Uploading…' : `Click to upload (${activeType?.hint})`}
                            </span>
                            <input
                                type="file"
                                accept={activeType?.accept}
                                multiple={mediaType === 'CAROUSEL'}
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    )}
                </div>

                {/* Caption */}
                <label className="block text-sm font-medium text-[var(--viralix-accent)] mb-1">Caption</label>
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    placeholder="Write a caption…"
                    className="w-full mb-4 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-sm"
                />

                {/* Alt text (image only) */}
                {mediaType === 'IMAGE' && (
                    <>
                        <label className="block text-sm font-medium text-[var(--viralix-accent)] mb-1">Alt text (optional)</label>
                        <input
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            placeholder="Describe the image for accessibility"
                            className="w-full mb-4 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-sm"
                        />
                    </>
                )}

                {/* AI disclosure */}
                <label className="flex items-center gap-2 mb-4 text-sm text-[var(--viralix-accent)] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isAiGenerated}
                        onChange={(e) => setIsAiGenerated(e.target.checked)}
                        className="rounded border-[var(--viralix-border)]"
                    />
                    Mark as AI-generated content
                </label>

                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handlePublish} disabled={!canPublish()} className="btn btn-success disabled:opacity-50">
                        {publishing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" /> Publish Now
                            </>
                        )}
                    </button>
                    <button onClick={checkLimit} disabled={!selectedAccount} className="btn btn-secondary disabled:opacity-50">
                        Check publishing limit
                    </button>
                </div>

                {limit && (
                    <div className="mt-4 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-inset)] p-3 text-xs text-[var(--viralix-accent)]">
                        <p className="font-medium mb-1">Publishing limit</p>
                        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(limit, null, 2)}</pre>
                    </div>
                )}

                {result && (
                    <div
                        className={`mt-4 rounded-lg p-4 text-sm flex items-start gap-2 ${result.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                            }`}
                    >
                        {result.ok ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <X className="h-5 w-5 shrink-0" />}
                        <div>
                            {result.ok ? (
                                <>
                                    <p className="font-medium">Published successfully</p>
                                    <p className="text-xs mt-1">Media ID: {result.mediaId}</p>
                                </>
                            ) : (
                                <p>{result.message}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showLogs && (
            <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--viralix-accent)]">Recent attempts</h2>
                    <button onClick={loadLogs} className="btn btn-secondary btn-sm">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>
                {logs.length === 0 ? (
                    <p className="text-sm text-gray-500">No publish attempts yet.</p>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div
                                key={log._id}
                                className="flex items-center justify-between p-3 rounded-lg border border-[var(--viralix-border)] text-sm"
                            >
                                <div>
                                    <span className="font-medium text-[var(--viralix-accent)]">{log.mediaType}</span>
                                    <span className="text-gray-500"> · {formatDate(log.createdAt)}</span>
                                    {log.caption && <p className="text-xs text-gray-500 truncate max-w-md">{log.caption}</p>}
                                    {log.error && <p className="text-xs text-red-600 truncate max-w-md">{log.error}</p>}
                                </div>
                                <span
                                    className={`px-2 py-0.5 text-xs rounded-full border ${log.status === 'published'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : log.status === 'failed'
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : log.status === 'processing'
                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                        }`}
                                >
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}
        </>
    );

    if (modal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="dash-card bg-[var(--viralix-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-[var(--viralix-border)] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                                <PlatformIcon platform="instagram" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--viralix-accent)]">Create Instagram Post</h2>
                                <p className="text-sm text-gray-500">Images, reels, stories & carousels</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">{panelBody}</div>
                </div>
            </div>
        );
    }

    return <div className="max-w-4xl mx-auto">{panelBody}</div>;
}
