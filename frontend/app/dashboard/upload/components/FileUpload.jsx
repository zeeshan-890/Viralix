'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, Film, X, Loader2, CheckCircle2 } from 'lucide-react';
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

/** Demo upload — local preview only, no cloud storage */
async function simulateDemoUpload(file, onProgress) {
    const steps = [15, 40, 65, 85, 100];
    for (const pct of steps) {
        await new Promise((r) => setTimeout(r, 120));
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
        width: isVideo ? 1080 : 1200,
        height: isVideo ? 1920 : 800,
        duration: isVideo ? 32 : null,
        isLocal: true,
    };
}

async function uploadFileToServer(file, onProgress) {
    const res = await uploadAPI.uploadFile(file, onProgress);
    const uploaded = res.data?.files?.[0];
    if (!uploaded?.url) throw new Error('Upload failed');
    const isVideo = uploaded.type === 'video' || uploaded.mimetype?.startsWith('video/');
    return {
        type: isVideo ? 'video' : 'image',
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

export default function FileUpload({ onUploadComplete, onDeleteUploaded, embedded = false, multi = false }) {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [queue, setQueue] = useState([]);
    const fileInputRef = useRef(null);
    const demoMode = isMockMode();

    const processFiles = useCallback(
        async (fileList) => {
            const list = Array.from(fileList);
            if (!list.length) return;

            const batch = multi ? list : [list[0]];
            setUploading(true);
            setError('');
            setProgress(0);

            try {
                const results = [];
                for (let i = 0; i < batch.length; i++) {
                    const file = batch[i];
                    const onFileProgress = (pct) => {
                        setProgress(Math.round(((i + pct / 100) / batch.length) * 100));
                    };
                    const uploaded = demoMode
                        ? await simulateDemoUpload(file, onFileProgress)
                        : await uploadFileToServer(file, onFileProgress);
                    results.push(uploaded);
                }
                setQueue((prev) => (multi ? [...prev, ...results] : results));
                onUploadComplete?.(results);
            } catch {
                setError('Upload simulation failed. Please try again.');
            } finally {
                setUploading(false);
                setProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        },
        [multi, onUploadComplete, demoMode]
    );

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
        },
        [processFiles]
    );

    const handleFileSelect = useCallback(
        (e) => {
            if (e.target.files?.length) processFiles(e.target.files);
        },
        [processFiles]
    );

    const removeQueued = (publicId) => {
        setQueue((prev) => prev.filter((f) => f.publicId !== publicId));
        onDeleteUploaded?.(publicId);
    };

    const dropzone = (
        <div
            className={cn(
                'relative rounded-xl border-2 border-dashed transition-all',
                dragActive
                    ? 'border-[#84A98C] bg-[#84A98C]/10'
                    : 'border-[#C8D4CE] bg-[#FAFCFB] hover:border-[#84A98C]/60 hover:bg-white',
                embedded ? 'p-8' : 'p-10'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple={multi}
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={uploading}
                aria-label="Upload media file"
            />

            <div className="pointer-events-none flex flex-col items-center text-center">
                <div
                    className={cn(
                        'mb-3 flex h-14 w-14 items-center justify-center rounded-2xl',
                        uploading ? 'bg-[#84A98C]/20' : 'bg-[#354F52]/8'
                    )}
                >
                    {uploading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-[#52796F]" />
                    ) : (
                        <Upload className="h-7 w-7 text-[#52796F]" />
                    )}
                </div>
                <p className="text-sm font-semibold text-[#354F52]">
                    {uploading ? 'Processing file…' : 'Drop media here or click to browse'}
                </p>
                <p className="mt-1 text-xs text-[#52796F]">Images & videos · demo mode (local preview only)</p>
                {!uploading && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.625rem] text-[#52796F] ring-1 ring-[#D5DFD9]">
                            <ImageIcon className="h-3 w-3" /> JPG, PNG, WebP
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.625rem] text-[#52796F] ring-1 ring-[#D5DFD9]">
                            <Film className="h-3 w-3" /> MP4, MOV
                        </span>
                    </div>
                )}
            </div>

            {uploading && (
                <div className="mt-5">
                    <div className="mb-1 flex justify-between text-xs text-[#52796F]">
                        <span>Uploading</span>
                        <span className="tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#E8EDEA]">
                        <div
                            className="h-full rounded-full bg-[#84A98C] transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    const queueList = queue.length > 0 && (
        <ul className="mt-4 space-y-2">
            {queue.map((file) => (
                <li
                    key={file.publicId}
                    className="flex items-center gap-3 rounded-lg border border-[#E8EDEA] bg-white px-3 py-2"
                >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F4F8F6]">
                        {file.type === 'video' ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <Film className="h-4 w-4 text-[#52796F]" />
                            </div>
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={file.url} alt="" className="h-full w-full object-cover" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#354F52]">{file.filename}</p>
                        <p className="text-[0.625rem] text-[#52796F]">{formatFileSize(file.size)}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <button
                        type="button"
                        onClick={() => removeQueued(file.publicId)}
                        className="rounded-md p-1 text-[#94A3B8] hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${file.filename}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </li>
            ))}
        </ul>
    );

    if (embedded) {
        return (
            <div>
                {demoMode && (
                    <p className="mb-3 rounded-lg bg-[#354F52]/5 px-3 py-2 text-[0.6875rem] text-[#52796F]">
                        Demo mode — files stay in your browser session. Cloud upload coming soon.
                    </p>
                )}
                {error && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                    </div>
                )}
                {dropzone}
                {queueList}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[#B8C9C0] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-[#354F52]">Upload files</h3>
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}
            {dropzone}
            {queueList}
        </div>
    );
}
