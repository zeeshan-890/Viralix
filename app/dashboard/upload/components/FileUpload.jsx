'use client';
import { useState, useCallback } from 'react';
export default function FileUpload() {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        }
        else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, []);
    const handleFileSelect = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, []);
    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    return (<div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Files</h3>

            {/* Drop Zone */}
            <div className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>

                <div className="space-y-4">
                    <div className="text-4xl">📁</div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">
                            Drop files here or click to browse
                        </p>
                        <p className="text-sm text-gray-600">
                            Support for videos and images up to 100MB
                        </p>
                    </div>
                    <button type="button" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Choose Files
                    </button>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (<div className="mt-6 space-y-3">
                    <h4 className="font-medium text-gray-900">Uploaded Files ({files.length})</h4>
                    <div className="space-y-2">
                        {files.map((file, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                        {file.type.startsWith('video/') ? '🎥' : '🖼️'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 p-1">
                                    ❌
                                </button>
                            </div>))}
                    </div>
                </div>)}

            {/* Upload Progress */}
            {files.length > 0 && (<div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                        <span className="text-sm text-gray-600">0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                </div>)}
        </div>);
}
