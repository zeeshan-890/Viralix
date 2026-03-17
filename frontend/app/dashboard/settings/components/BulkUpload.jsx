'use client';
import { useState, useRef } from 'react';
import { bulkUploadAPI } from '@/lib/api';

export default function BulkUpload() {
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [file, setFile] = useState(null);
    const inputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setResult(null);
        setLoading(true);

        try {
            const fd = new FormData();
            fd.append('file', f);
            const res = await bulkUploadAPI.preview(fd);
            setPreview(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Parse failed');
            setPreview(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!file) return;
        setCreating(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await bulkUploadAPI.create(fd);
            setResult(res.data);
            setPreview(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Bulk create failed');
        } finally {
            setCreating(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    📋 Bulk CSV Upload
                </h2>
                <p className="text-sm text-gray-500 mt-1">Create multiple posts at once from a CSV file</p>
            </div>

            {/* CSV Format Guide */}
            <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-1">CSV Column Format:</p>
                <p className="text-xs text-blue-600 font-mono">
                    title, content, platform, hashtags, scheduled_date, media_url
                </p>
                <p className="text-xs text-blue-500 mt-1">
                    Multiple platforms: <code className="bg-blue-100 px-1 rounded">instagram;facebook</code> |
                    Multiple hashtags: <code className="bg-blue-100 px-1 rounded">tag1;tag2;tag3</code>
                </p>
            </div>

            {/* File Upload */}
            {!preview && !result && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <span className="text-4xl block mb-3">📄</span>
                    <label className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition">
                        {loading ? 'Parsing CSV...' : 'Select CSV File'}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={loading}
                        />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Max 200 rows per upload</p>
                </div>
            )}

            {/* Preview */}
            {preview && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">
                                Preview: {preview.validCount} valid / {preview.totalRows} total rows
                            </span>
                            {preview.errorCount > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                    {preview.errorCount} errors
                                </span>
                            )}
                        </div>
                        <button onClick={handleReset} className="text-xs text-gray-500 hover:underline">Reset</button>
                    </div>

                    {/* Error Report */}
                    {preview.errors?.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 max-h-32 overflow-y-auto">
                            <p className="text-xs font-medium text-red-700 mb-1">Validation Errors:</p>
                            {preview.errors.map((err, i) => (
                                <p key={i} className="text-xs text-red-600">
                                    Row {err.row}: {err.field} — {err.message}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Preview Table */}
                    <div className="overflow-x-auto rounded-lg border mb-4 max-h-64 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-500">#</th>
                                    <th className="px-3 py-2 text-left text-gray-500">Title</th>
                                    <th className="px-3 py-2 text-left text-gray-500">Content</th>
                                    <th className="px-3 py-2 text-left text-gray-500">Platforms</th>
                                    <th className="px-3 py-2 text-left text-gray-500">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.preview?.map((row, i) => (
                                    <tr key={i} className="border-t hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-400">{row.index}</td>
                                        <td className="px-3 py-2 text-gray-800 truncate max-w-[150px]">{row.title}</td>
                                        <td className="px-3 py-2 text-gray-600 truncate max-w-[200px]">{row.content?.substring(0, 60)}...</td>
                                        <td className="px-3 py-2 text-gray-600">{row.platforms?.join(', ')}</td>
                                        <td className="px-3 py-2 text-gray-400">{row.scheduledDate || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            disabled={creating || preview.validCount === 0}
                            className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {creating ? 'Creating posts...' : `Create ${preview.validCount} Posts`}
                        </button>
                        <button onClick={handleReset} className="px-5 py-2 border text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                </>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-3">
                    <div className={`p-4 rounded-lg ${result.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                        <p className="text-sm font-medium text-gray-800">{result.message}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-green-600">✅ {result.created} created</span>
                            {result.failed > 0 && <span className="text-red-600">❌ {result.failed} failed</span>}
                        </div>
                    </div>

                    {result.failedRows?.length > 0 && (
                        <div className="p-3 bg-red-50 rounded-lg max-h-32 overflow-y-auto">
                            {result.failedRows.map((f, i) => (
                                <p key={i} className="text-xs text-red-600">
                                    Row {f.row}: {f.errors.map(e => e.message).join(', ')}
                                </p>
                            ))}
                        </div>
                    )}

                    <button onClick={handleReset} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Upload More
                    </button>
                </div>
            )}
        </div>
    );
}
