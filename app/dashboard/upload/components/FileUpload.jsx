'use client';
import { useState, useCallback, useRef } from 'react';
import { uploadAPI } from '@/lib/api';

export default function FileUpload({ onUploadComplete, onDeleteUploaded }) {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadResults, setUploadResults] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const list = Array.from(e.dataTransfer.files);
            const first = list[0];
            if (list.length > 1) {
                setError('Only one file allowed. Uploading the first file.');
            } else {
                setError('');
            }
            // Replace existing file with the first one
            setFiles([first]);
            setUploadProgress({});
            setUploadResults([]);
            uploadNewFiles([first], 0);
        }
    }, []);

    const handleFileSelect = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            const list = Array.from(e.target.files);
            const first = list[0];
            if (list.length > 1) {
                setError('Only one file allowed. Uploading the first file.');
            } else {
                setError('');
            }
            // Replace existing file with the first one
            setFiles([first]);
            setUploadProgress({});
            setUploadResults([]);
            uploadNewFiles([first], 0);
            // Reset input so selecting the same file again triggers onChange
            try { e.target.value = ''; } catch { }
        }
    }, []);

    const removeFile = async (index) => {
        const file = files[index];
        const result = uploadResults.find(r => r.file === file && r.success && r.data?.publicId);
        if (result?.data?.publicId) {
            try {
                await uploadAPI.deleteFile(result.data.publicId);
                if (onDeleteUploaded) onDeleteUploaded(result.data.publicId);
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to delete file from cloud');
                return;
            }
        }
        setFiles(prev => prev.filter((_, i) => i !== index));
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[index];
            return newProgress;
        });
        setUploadResults(prev => prev.filter(r => r.file !== file));
        // Also reset the hidden input to allow re-selecting the same file
        if (fileInputRef.current) {
            try { fileInputRef.current.value = ''; } catch { }
        }
    };

    const uploadNewFiles = async (newFiles, startIndex = 0) => {
        if (!newFiles || newFiles.length === 0) return;
        setUploading(true);
        setError('');

        try {
            const results = [];
            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                const idx = startIndex + i;
                try {
                    const response = await uploadAPI.uploadFile(file, (progress) => {
                        setUploadProgress(prev => ({
                            ...prev,
                            [idx]: progress
                        }));
                    });

                    // /upload/media returns { files: [...] }
                    const uploaded = Array.isArray(response?.data?.files) ? response.data.files[0] : response.data;
                    const resultEntry = {
                        file,
                        success: true,
                        data: uploaded
                    };
                    results.push(resultEntry);
                    setUploadResults(prev => [...prev, resultEntry]);
                } catch (err) {
                    const resultEntry = {
                        file,
                        success: false,
                        error: err.response?.data?.message || 'Upload failed'
                    };
                    results.push(resultEntry);
                    setUploadResults(prev => [...prev, resultEntry]);
                }
            }

            // Notify parent only with successful uploads from this batch
            if (onUploadComplete) {
                const successfulUploads = results
                    .filter(r => r.success && r.data)
                    .map(r => ({
                        type: r.data.type,
                        url: r.data.url,
                        filename: r.data.filename,
                        size: r.data.size,
                        mimetype: r.data.mimetype,
                        publicId: r.data.publicId,
                        width: r.data.width,
                        height: r.data.height,
                        duration: r.data.duration || null,
                    }));
                if (successfulUploads.length > 0) onUploadComplete(successfulUploads);
            }
        } catch (err) {
            setError('Failed to upload files');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const clearAll = () => {
        setFiles([]);
        setUploadProgress({});
        setUploadResults([]);
        setError('');
        if (fileInputRef.current) {
            try { fileInputRef.current.value = ''; } catch { }
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getOverallProgress = () => {
        const progressValues = Object.values(uploadProgress);
        if (progressValues.length === 0) return 0;
        return Math.round(progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Files</h3>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Drop Zone */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />

                <div className="space-y-4">
                    <div className="text-4xl">
                        {uploading ? '⏳' : '📁'}
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">
                            {uploading ? 'Uploading files...' : 'Drop files here or click to browse'}
                        </p>
                        <p className="text-sm text-gray-600">
                            Support for videos and images up to 100MB
                        </p>
                    </div>
                    {!uploading && (
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Choose Files
                        </button>
                    )}
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Files ({files.length})</h4>
                        <div className="flex space-x-2">
                            {!uploading && (
                                <button
                                    onClick={clearAll}
                                    className="px-4 py-2 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {files.map((file, index) => {
                            const progress = uploadProgress[index] || 0;
                            const result = uploadResults.find(r => r.file === file);

                            return (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                            {file.type.startsWith('video/') ? '🎥' : '🖼️'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                {result && (
                                                    <span className={`text-xs px-2 py-1 rounded-full ${result.success
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {result.success ? '✓ Uploaded' : '✗ Failed'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>

                                            {uploading && uploadProgress[index] !== undefined && (
                                                <div className="mt-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                                        <div
                                                            className="bg-blue-600 h-1 rounded-full transition-all"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">{progress}%</span>
                                                </div>
                                            )}

                                            {result && !result.success && (
                                                <p className="text-xs text-red-600 mt-1">{result.error}</p>
                                            )}
                                        </div>
                                    </div>

                                    {!uploading && (
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            ❌
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Overall Upload Progress */}
            {uploading && files.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm text-gray-600">{getOverallProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${getOverallProgress()}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Upload Results Summary */}
            {uploadResults.length > 0 && !uploading && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                        Upload completed: {uploadResults.filter(r => r.success).length} successful, {' '}
                        {uploadResults.filter(r => !r.success).length} failed
                    </div>
                </div>
            )}
        </div>
    );
}
