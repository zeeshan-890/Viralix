'use client';
import { useState, useEffect } from 'react';
import { watermarkAPI } from '@/lib/api';

export default function WatermarkSettings() {
    const [settings, setSettings] = useState({
        logoPublicId: null, logoUrl: null,
        position: 'southeast', opacity: 60, scale: 15, enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await watermarkAPI.get();
            setSettings(res.data);
        } catch (err) {
            console.error('Watermark load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('logo', file);
            const res = await watermarkAPI.upload(fd);
            setSettings(prev => ({ ...prev, logoPublicId: res.data.logoPublicId, logoUrl: res.data.logoUrl, enabled: true }));
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await watermarkAPI.update({
                position: settings.position,
                opacity: settings.opacity,
                scale: settings.scale,
                enabled: settings.enabled
            });
        } catch (err) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Remove watermark logo?')) return;
        try {
            await watermarkAPI.remove();
            setSettings({ logoPublicId: null, logoUrl: null, position: 'southeast', opacity: 60, scale: 15, enabled: false });
        } catch (err) {
            alert('Remove failed');
        }
    };

    const positions = [
        { value: 'northwest', label: '↖ Top Left' },
        { value: 'north', label: '↑ Top' },
        { value: 'northeast', label: '↗ Top Right' },
        { value: 'west', label: '← Left' },
        { value: 'center', label: '● Center' },
        { value: 'east', label: '→ Right' },
        { value: 'southwest', label: '↙ Bottom Left' },
        { value: 'south', label: '↓ Bottom' },
        { value: 'southeast', label: '↘ Bottom Right' },
    ];

    if (loading) return <div className="text-center py-8 text-gray-400">Loading watermark settings...</div>;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    🎨 Visual Watermark
                </h2>
                <p className="text-sm text-gray-500 mt-1">Brand your content with automatic watermarking via Cloudinary</p>
            </div>

            {/* Logo Upload */}
            <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                    {settings.logoUrl ? (
                        <div className="relative">
                            <img src={settings.logoUrl} alt="Watermark" className="w-16 h-16 object-contain border rounded bg-white p-1" />
                            <button onClick={handleRemove} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                        </div>
                    ) : (
                        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                            Logo
                        </div>
                    )}
                    <div className="flex-1">
                        <label className={`inline-block px-4 py-2 text-sm rounded-lg cursor-pointer ${uploading ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                            {uploading ? 'Uploading...' : settings.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">PNG with transparency works best. Max 5MB.</p>
                    </div>
                </div>
            </div>

            {settings.logoUrl && (
                <>
                    {/* Toggle */}
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Enable Watermark</span>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                            className={`w-10 h-6 rounded-full transition ${settings.enabled ? 'bg-green-500' : 'bg-gray-300'} relative`}
                        >
                            <span className={`absolute top-1 ${settings.enabled ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full shadow transition-all`} />
                        </button>
                    </div>

                    {/* Position Grid */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Position</label>
                        <div className="grid grid-cols-3 gap-1.5 max-w-xs">
                            {positions.map(pos => (
                                <button
                                    key={pos.value}
                                    onClick={() => setSettings(prev => ({ ...prev, position: pos.value }))}
                                    className={`px-2 py-1.5 text-xs rounded border transition ${settings.position === pos.value
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {pos.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Opacity: {settings.opacity}%</label>
                            <input
                                type="range" min="10" max="100" value={settings.opacity}
                                onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Scale: {settings.scale}%</label>
                            <input
                                type="range" min="5" max="50" value={settings.scale}
                                onChange={(e) => setSettings(prev => ({ ...prev, scale: parseInt(e.target.value) }))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </>
            )}
        </div>
    );
}
