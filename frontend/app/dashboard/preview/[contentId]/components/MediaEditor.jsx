'use client';
import { useState } from 'react';
import { uploadAPI } from '@/lib/api';

export default function MediaEditor({ post, onChange }) {
    const [uploading, setUploading] = useState(false);
    const media = Array.isArray(post?.media) ? post.media : [];
    const current = media[0];

    const handleFile = async (file) => {
        setUploading(true);
        try {
            const res = await uploadAPI.uploadFile(file);
            const uploaded = Array.isArray(res?.data?.files) ? res.data.files[0] : res.data;
            if (uploaded) {
                const item = {
                    type: uploaded.type,
                    url: uploaded.url,
                    filename: uploaded.filename,
                    size: uploaded.size,
                    mimetype: uploaded.mimetype,
                    publicId: uploaded.publicId,
                    width: uploaded.width,
                    height: uploaded.height,
                    duration: uploaded.duration || null,
                };
                onChange([item]);
            }
        } finally {
            setUploading(false);
        }
    };

    const onInput = (e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        try { e.target.value = ''; } catch { }
    };

    const removeMedia = async () => {
        if (current?.publicId) {
            try { await uploadAPI.deleteFile(current.publicId); } catch { }
        }
        onChange([]);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Media</h3>

            {current ? (
                <div className="space-y-3">
                    <div className="relative">
                        {current.type === 'video' ? (
                            <video src={current.url} className="w-full rounded-lg" controls preload="metadata" />
                        ) : (
                            <img src={current.url} alt={current.filename || 'Media'} className="w-full rounded-lg" />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <label className={`px-4 py-2 border rounded-lg text-sm cursor-pointer ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {uploading ? 'Uploading…' : 'Replace'}
                            <input type="file" accept="image/*,video/*" className="hidden" onChange={onInput} disabled={uploading} />
                        </label>
                        <button onClick={removeMedia} className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50">Remove</button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-3">No media attached. Add a photo or video.</p>
                    <label className={`inline-block px-4 py-2 border rounded-lg text-sm cursor-pointer ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {uploading ? 'Uploading…' : 'Upload Media'}
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={onInput} disabled={uploading} />
                    </label>
                </div>
            )}
        </div>
    );
}
