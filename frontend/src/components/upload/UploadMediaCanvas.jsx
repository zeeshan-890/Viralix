'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, Film, X, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/lib/mock';
import { uploadAPI } from '@/lib/api';

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

async function simulateDemoUpload(file, onProgress) {
    for (const pct of [20, 50, 75, 100]) {
        await new Promise((r) => setTimeout(r, 100));
        onProgress(pct);
    }
    const isVideo = file.type.startsWith('video/');
    return {
        type: isVideo ? 'video' : 'image',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        mimetype: file.type,
        publicId: `demo-local/${Date.now()}-${file.name}`,
    };
}

function mapUploadedFile(file, uploaded) {
    return {
        type: uploaded.type || (uploaded.mimetype?.startsWith('video/') ? 'video' : 'image'),
        url: uploaded.url,
        filename: uploaded.filename || file.name,
        size: uploaded.size ?? file.size,
        mimetype: uploaded.mimetype || file.type,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        duration: uploaded.duration,
    };
}

async function uploadFileToServer(file, onProgress) {
    const res = await uploadAPI.uploadFile(file, onProgress);
    const uploaded = res.data?.files?.[0];
    if (!uploaded?.url) throw new Error('Upload failed');
    return mapUploadedFile(file, uploaded);
}

export default function UploadMediaCanvas({ files, activeIndex, onActiveChange, onAdd, onRemove }) {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const demoMode = isMockMode();
    const active = files[activeIndex] || files[0];

    const processFiles = async (fileList) => {
        const list = Array.from(fileList);
        if (!list.length) return;
        setUploading(true);
        setProgress(0);
        try {
            const results = [];
            for (let i = 0; i < list.length; i++) {
                const onFileProgress = (pct) => {
                    setProgress(Math.round(((i + pct / 100) / list.length) * 100));
                };
                const uploaded = demoMode
                    ? await simulateDemoUpload(list[i], onFileProgress)
                    : await uploadFileToServer(list[i], onFileProgress);
                results.push(uploaded);
            }
            onAdd?.(results);
            if (files.length === 0) onActiveChange?.(0);
            else onActiveChange?.(files.length);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const onDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
    };

    return (
        <div className="flex min-h-[420px] flex-col bg-[#1a2428] lg:min-h-[520px]">
            {/* Stage */}
            <div
                className={cn(
                    'relative flex flex-1 flex-col items-center justify-center p-6 transition-colors',
                    dragActive && 'bg-[#84A98C]/10 ring-2 ring-inset ring-[#84A98C]/40'
                )}
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
            >
                {uploading ? (
                    <div className="w-full max-w-xs text-center">
                        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#84A98C]" />
                        <p className="mt-3 text-sm font-medium text-white/90">Processing…</p>
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#84A98C] transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : !active ? (
                    <label className="flex w-full max-w-md cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-8 py-12 transition-colors hover:border-[#84A98C]/50 hover:bg-white/10">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => e.target.files && processFiles(e.target.files)}
                        />
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#84A98C]/20">
                            <Upload className="h-8 w-8 text-[#84A98C]" />
                        </div>
                        <p className="text-base font-semibold text-white">Drop media here</p>
                        <p className="mt-1 text-sm text-white/50">or click to browse · JPG, PNG, MP4</p>
                        {demoMode && (
                            <p className="mt-4 rounded-full bg-white/10 px-3 py-1 text-[0.6875rem] text-white/60">
                                Demo — local preview only
                            </p>
                        )}
                    </label>
                ) : (
                    <div className="relative w-full max-w-lg overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
                        {active.type === 'video' ? (
                            // eslint-disable-next-line jsx-a11y/media-has-caption
                            <video src={active.url} className="aspect-video w-full bg-black object-contain" controls />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={active.url} alt={active.filename} className="aspect-video w-full object-cover" />
                        )}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[0.625rem] font-medium text-white backdrop-blur-sm">
                            {active.type === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            {active.type === 'video' ? 'Video' : 'Image'}
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove?.(active.publicId)}
                            className="absolute right-3 top-3 rounded-md bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-red-600"
                            aria-label="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {active && !uploading && (
                    <p className="mt-4 truncate text-sm text-white/50">
                        {active.filename} · {formatFileSize(active.size)}
                    </p>
                )}
            </div>

            {/* Filmstrip */}
            {files.length > 0 && (
                <div className="flex items-center gap-2 border-t border-white/10 bg-[#152023] px-4 py-3">
                    <div className="flex flex-1 gap-2 overflow-x-auto">
                        {files.map((file, idx) => (
                            <button
                                key={file.publicId}
                                type="button"
                                onClick={() => onActiveChange?.(idx)}
                                className={cn(
                                    'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                                    idx === (activeIndex ?? 0) ? 'ring-[#84A98C]' : 'ring-transparent opacity-70 hover:opacity-100'
                                )}
                            >
                                {file.type === 'video' ? (
                                    <div className="flex h-full w-full items-center justify-center bg-[#354F52]">
                                        <Film className="h-4 w-4 text-white/70" />
                                    </div>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={file.url} alt="" className="h-full w-full object-cover" />
                                )}
                            </button>
                        ))}
                        <label className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 text-white/50 hover:border-[#84A98C]/50 hover:text-[#84A98C]">
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="sr-only"
                                onChange={(e) => e.target.files && processFiles(e.target.files)}
                            />
                            <Plus className="h-5 w-5" />
                        </label>
                    </div>
                    <span className="shrink-0 text-[0.6875rem] tabular-nums text-white/40">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
}
