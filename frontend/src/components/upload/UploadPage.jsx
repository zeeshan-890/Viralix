'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import notify from '@/lib/notify';
import { postsAPI } from '@/lib/api';
import { useAccounts } from '@/hooks/useAccounts';
import { cn } from '@/lib/utils';
import TikTokSettings, { useTikTokSettingsValidation } from '../../../app/dashboard/upload/components/TikTokSettings';
import UploadSidebar from './UploadSidebar';
import UploadMediaCanvas from './UploadMediaCanvas';
import { Image as ImageIcon, PenLine, Rocket, Calendar, FileText, Target } from 'lucide-react';
import Link from 'next/link';
import {
    getMediaConstraints,
    filterFilesForConstraints,
    mediaTypeOfFile,
} from '@/lib/platformMediaRules';

const STEPS = [
    { id: 'targets', label: 'Platforms', icon: Target },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'copy', label: 'Copy', icon: PenLine },
    { id: 'publish', label: 'Publish', icon: Rocket },
];

export default function UploadPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { accounts: connectedAccounts, isLoading: accountsLoading } = useAccounts();
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [actionError, setActionError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [connectedTargets, setConnectedTargets] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [scheduleType, setScheduleType] = useState('now');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [contentForm, setContentForm] = useState({ title: '', description: '', tags: [], category: '' });
    const [tiktokSettings, setTiktokSettings] = useState({
        privacyLevel: '',
        allowComment: false,
        allowDuet: false,
        allowStitch: false,
        commercialDisclosure: false,
        brandOrganic: false,
        brandedContent: false,
        creatorInfo: null,
    });

    useEffect(() => {
        if (accountsLoading) return;
        setConnectedTargets(
            connectedAccounts.map((acc) => ({
                key: `${acc.platform}:${acc.platformAccountId}`,
                name: acc.platform,
                accountId: acc.platformAccountId,
                label: `${acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1)} — ${acc.accountName}`,
            }))
        );
    }, [connectedAccounts, accountsLoading]);

    useEffect(() => {
        const raw = searchParams.get('date');
        if (!raw) return;
        const dt = new Date(raw);
        if (Number.isNaN(dt.getTime())) return;
        setScheduleType('later');
        setDate(dt.toISOString().split('T')[0]);
        setTime(`${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`);
    }, [searchParams]);

    const handleFormChange = (field, value) => setContentForm((prev) => ({ ...prev, [field]: value }));

    const toggleTarget = (t) => {
        setSelectedPlatforms((prev) => {
            const exists = prev.some((p) => p.name === t.name && p.accountId === t.accountId);
            return exists ? prev.filter((p) => !(p.name === t.name && p.accountId === t.accountId)) : [...prev, { name: t.name, accountId: t.accountId }];
        });
    };

    const mediaConstraints = useMemo(
        () => getMediaConstraints(selectedPlatforms),
        [selectedPlatforms]
    );

    // Drop media incompatible with newly selected platforms
    useEffect(() => {
        if (!selectedPlatforms.length) {
            if (uploadedFiles.length) setUploadedFiles([]);
            return;
        }
        const compatible = filterFilesForConstraints(uploadedFiles, mediaConstraints);
        if (compatible.length !== uploadedFiles.length) {
            setUploadedFiles(compatible);
            setActiveFileIndex(0);
            notify.warning('Some files were removed because they are not supported for the selected platforms.');
        }
    }, [mediaConstraints, selectedPlatforms.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasVideo = uploadedFiles.some((f) => mediaTypeOfFile(f) === 'video');
    const hasImage = uploadedFiles.some((f) => mediaTypeOfFile(f) === 'image');

    const addFiles = (files) => {
        const room = Math.max(0, mediaConstraints.maxFiles - uploadedFiles.length);
        const toAdd = files.slice(0, room);
        if (toAdd.length < files.length) {
            notify.warning(`Maximum ${mediaConstraints.maxFiles} file(s) for this platform selection.`);
        }
        setUploadedFiles((prev) => [...prev, ...toAdd]);
    };

    const removeFile = (publicId) => {
        setUploadedFiles((prev) => {
            const next = prev.filter((f) => f.publicId !== publicId);
            setActiveFileIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
            return next;
        });
    };

    const hasIG = mediaConstraints.hasInstagram;
    const hasTT = mediaConstraints.hasTikTok;
    const hasYT = mediaConstraints.hasYouTube;
    const selectedTiktokAccount = useMemo(() => selectedPlatforms.find((p) => p.name === 'tiktok')?.accountId || null, [selectedPlatforms]);
    const tiktokValidation = useTikTokSettingsValidation(tiktokSettings);

    const stepState = useMemo(() => ({
        targets: selectedPlatforms.length > 0,
        media: !mediaConstraints.requiresMedia || uploadedFiles.length > 0,
        copy: Boolean(contentForm.title && contentForm.description),
        publish: false,
    }), [selectedPlatforms.length, mediaConstraints.requiresMedia, uploadedFiles.length, contentForm.title, contentForm.description]);

    const canSubmit = useMemo(() => {
        if (!selectedPlatforms.length) return false;
        if (!contentForm.title || !contentForm.description) return false;
        if (mediaConstraints.requiresMedia && !uploadedFiles.length) return false;
        if (mediaConstraints.videoOnly && !hasVideo) return false;
        if (mediaConstraints.imageOnly && !hasImage) return false;
        if (hasIG && !uploadedFiles.length) return false;
        if (scheduleType === 'later' && (!date || !time)) return false;
        if (hasTT && !tiktokValidation.isValid) return false;
        return true;
    }, [contentForm, selectedPlatforms, uploadedFiles, mediaConstraints, hasIG, hasTT, hasVideo, hasImage, scheduleType, date, time, tiktokValidation.isValid]);

    stepState.publish = canSubmit;

    const validationHints = useMemo(() => {
        const hints = [];
        if (!selectedPlatforms.length) {
            hints.push({ type: 'warn', message: 'Select at least one platform first.' });
            return hints;
        }
        mediaConstraints.hints.forEach((msg) => hints.push({ type: 'info', message: msg }));
        if (mediaConstraints.requiresMedia && !uploadedFiles.length) {
            hints.push({ type: 'warn', message: 'Upload media — required for your selected platforms.' });
        }
        if (mediaConstraints.videoOnly && !hasVideo) {
            hints.push({ type: 'warn', message: 'A video file is required (YouTube and/or TikTok selected).' });
        }
        if (hasTT && tiktokValidation.errors[0]) hints.push({ type: 'error', message: tiktokValidation.errors[0] });
        return hints;
    }, [selectedPlatforms.length, mediaConstraints, hasVideo, hasImage, uploadedFiles.length, hasTT, tiktokValidation.errors]);

    const buildMediaPayload = () => uploadedFiles.map((f) => ({ type: f.type, url: f.url, filename: f.filename, size: f.size, mimetype: f.mimetype }));

    const tiktokPanel = hasTT && selectedTiktokAccount ? (
        <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-3">
            <p className="mb-2 text-xs font-semibold text-[#354F52]">TikTok options</p>
            <TikTokSettings accountId={selectedTiktokAccount} settings={tiktokSettings} onSettingsChange={setTiktokSettings} isPhotoPost={false} />
        </div>
    ) : null;

    const ttPayload = hasTT
        ? {
              privacyLevel: tiktokSettings.privacyLevel,
              disableComment: !tiktokSettings.allowComment,
              disableDuet: !tiktokSettings.allowDuet,
              disableStitch: !tiktokSettings.allowStitch,
              brandOrganic: tiktokSettings.brandOrganic,
              brandedContent: tiktokSettings.brandedContent,
          }
        : undefined;

    const handleSaveDraft = async () => {
        try {
            setActionError('');
            setActionLoading(true);
            const res = await postsAPI.create({
                title: contentForm.title,
                content: contentForm.description,
                platforms: selectedPlatforms,
                media: buildMediaPayload(),
                hashtags: contentForm.tags,
                isScheduled: false,
            });
            if (res.data?._id) router.push(`/dashboard/preview/${res.data._id}`);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to save draft';
            setActionError(msg);
            notify.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePublishNow = async () => {
        try {
            setActionError('');
            setActionLoading(true);
            const createRes = await postsAPI.create({
                title: contentForm.title,
                content: contentForm.description,
                platforms: selectedPlatforms,
                media: buildMediaPayload(),
                hashtags: contentForm.tags,
                isScheduled: false,
                tiktokSettings: ttPayload,
            });
            const postId = createRes.data?._id;
            if (!postId) throw new Error('Post creation failed');
            await postsAPI.publishNow(postId);
            notify.success('Published! It may take a few minutes to appear on platforms.', { duration: 5000 });
            router.push('/dashboard');
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || 'Failed to publish';
            setActionError(msg);
            notify.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSchedule = async () => {
        try {
            setActionError('');
            setActionLoading(true);
            const scheduledDate = new Date(`${date}T${time}:00`).toISOString();
            await postsAPI.create({
                title: contentForm.title,
                content: contentForm.description,
                platforms: selectedPlatforms,
                media: buildMediaPayload(),
                hashtags: contentForm.tags,
                scheduledDate,
                isScheduled: true,
                tiktokSettings: ttPayload,
            });
            router.push('/dashboard/schedule');
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || 'Failed to schedule';
            setActionError(msg);
            notify.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="dash-card overflow-hidden rounded-2xl border border-[var(--viralix-border)]">
            {/* Header with step rail */}
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-white">Create content</h1>
                        <p className="mt-0.5 text-sm text-white/60">Platforms · media · publish</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/dashboard/schedule" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-[var(--viralix-surface)]/20">
                            <Calendar className="h-3.5 w-3.5" /> Calendar
                        </Link>
                        <Link href="/dashboard/preview" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-[var(--viralix-surface)]/20">
                            <FileText className="h-3.5 w-3.5" /> Posts
                        </Link>
                        {STEPS.map(({ id, label, icon: Icon }) => {
                            const done = stepState[id];
                            return (
                                <div
                                    key={id}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                                        done ? 'bg-emerald-500/25 text-emerald-100' : 'bg-white/10 text-white/70'
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                    {done && <span className="text-emerald-300">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px]">
                <UploadMediaCanvas
                    files={uploadedFiles}
                    activeIndex={activeFileIndex}
                    onActiveChange={setActiveFileIndex}
                    onAdd={addFiles}
                    onRemove={removeFile}
                    mediaConstraints={mediaConstraints}
                    platformsSelected={selectedPlatforms.length > 0}
                    forInstagram={mediaConstraints.hasInstagram && mediaConstraints.selectedPlatformNames?.length === 1}
                />
                <UploadSidebar
                    contentForm={contentForm}
                    onFormChange={handleFormChange}
                    connectedTargets={connectedTargets}
                    selectedPlatforms={selectedPlatforms}
                    onTogglePlatform={toggleTarget}
                    mediaConstraints={mediaConstraints}
                    scheduleType={scheduleType}
                    onScheduleTypeChange={setScheduleType}
                    date={date}
                    time={time}
                    onDateChange={setDate}
                    onTimeChange={setTime}
                    uploadedFiles={uploadedFiles}
                    canSubmit={canSubmit}
                    actionLoading={actionLoading}
                    actionError={actionError}
                    validationHints={validationHints}
                    onSaveDraft={handleSaveDraft}
                    onPublish={handlePublishNow}
                    onSchedule={handleSchedule}
                    tiktokPanel={tiktokPanel}
                />
            </div>
        </div>
    );
}
