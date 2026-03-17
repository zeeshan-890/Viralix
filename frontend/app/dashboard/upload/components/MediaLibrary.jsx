'use client';
import { useState } from 'react';

export default function MediaLibrary({ files, loading, onRefresh }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const toggleFileSelection = (file) => {
        setSelectedFiles(prev => {
            const isSelected = prev.some(f => f.publicId === file.publicId);
            if (isSelected) {
                return prev.filter(f => f.publicId !== file.publicId);
            } else {
                return [...prev, file];
            }
        });
    };

    const selectAllFiles = () => {
        setSelectedFiles(filteredFiles);
    };

    const deselectAllFiles = () => {
        setSelectedFiles([]);
    };

    const deleteSelectedFiles = async () => {
        if (selectedFiles.length === 0) return;

        try {
            // TODO: Implement bulk delete API call
            console.log('Deleting files:', selectedFiles);
            setSelectedFiles([]);
            onRefresh();
        } catch (error) {
            console.error('Failed to delete files:', error);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds) => {
        if (!seconds) return null;
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Filter and sort files
    const filteredFiles = files
        .filter(file => {
            if (filterType === 'all') return true;
            return file.type === filterType;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'largest':
                    return b.size - a.size;
                case 'smallest':
                    return a.size - b.size;
                case 'name':
                    return a.filename.localeCompare(b.filename);
                default:
                    return 0;
            }
        });

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center py-12">
                    <div className="text-gray-500">Loading media library...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Media Library</h3>
                        <p className="text-sm text-gray-600">
                            {filteredFiles.length} of {files.length} files
                            {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
                        </p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Files</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="largest">Largest First</option>
                            <option value="smallest">Smallest First</option>
                            <option value="name">Name A-Z</option>
                        </select>

                        {/* View Mode */}
                        <div className="flex border border-gray-300 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                            >
                                🔷 Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                            >
                                📋 List
                            </button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center space-x-2">
                        {selectedFiles.length > 0 ? (
                            <>
                                <button
                                    onClick={deselectAllFiles}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Deselect All
                                </button>
                                <button
                                    onClick={deleteSelectedFiles}
                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Selected ({selectedFiles.length})
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={selectAllFiles}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Select All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {filteredFiles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">📁</div>
                        <h3 className="text-lg font-medium mb-2">No media files found</h3>
                        <p>Upload some files to see them in your library</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {filteredFiles.map((file) => {
                            const isSelected = selectedFiles.some(f => f.publicId === file.publicId);
                            return (
                                <div
                                    key={file.publicId}
                                    className={`group relative bg-gray-50 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
                                        }`}
                                    onClick={() => toggleFileSelection(file)}
                                >
                                    {/* Media Preview */}
                                    <div className="aspect-square relative">
                                        {file.type === 'image' ? (
                                            <img
                                                src={file.url}
                                                alt={file.filename}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <div className="text-white text-center">
                                                    <div className="text-2xl mb-1">🎥</div>
                                                    {file.duration && (
                                                        <div className="text-xs">
                                                            {formatDuration(file.duration)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Selection Overlay */}
                                        <div className={`absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-white'
                                                }`}>
                                                {isSelected && <span className="text-white text-sm">✓</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="p-2">
                                        <div className="text-xs text-gray-600 truncate">
                                            {file.filename}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-2">
                        {filteredFiles.map((file) => {
                            const isSelected = selectedFiles.some(f => f.publicId === file.publicId);
                            return (
                                <div
                                    key={file.publicId}
                                    className={`flex items-center space-x-4 p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    onClick={() => toggleFileSelection(file)}
                                >
                                    {/* Checkbox */}
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                        }`}>
                                        {isSelected && <span className="text-white text-xs">✓</span>}
                                    </div>

                                    {/* Preview */}
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                        {file.type === 'image' ? (
                                            <img
                                                src={file.url}
                                                alt={file.filename}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-lg">🎥</span>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {file.filename}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {file.type} • {formatFileSize(file.size)}
                                            {file.duration && ` • ${formatDuration(file.duration)}`}
                                        </div>
                                    </div>

                                    {/* Dimensions */}
                                    <div className="text-sm text-gray-500">
                                        {file.width}×{file.height}
                                    </div>

                                    {/* Date */}
                                    <div className="text-sm text-gray-500">
                                        {new Date(file.createdAt).toLocaleDateString()}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(file.url, '_blank');
                                            }}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(file.url);
                                            }}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}