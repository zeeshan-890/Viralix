'use client';
import { useState, useEffect } from 'react';
import { bioPagesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function BioPageBuilder() {
    const router = useRouter();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [profile, setProfile] = useState({ title: '', bio: '', image: '' });
    const [theme, setTheme] = useState({
        id: 'simple-light', background: '#ffffff', textColor: '#000000',
        buttonColor: '#f3f4f6', buttonTextColor: '#000000', buttonStyle: 'rounded'
    });
    const [buttons, setButtons] = useState([]);
    const [socials, setSocials] = useState([]);
    const [activeTab, setActiveTab] = useState('links');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPage();
    }, []);

    const loadPage = async () => {
        try {
            const res = await bioPagesAPI.list();
            if (res.data.pages?.length > 0) {
                const p = res.data.pages[0];
                setPage(p);
                setProfile(p.profile);
                setTheme(p.theme);
                setButtons(p.buttons || []);
                setSocials(p.socials || []);
            } else {
                // Initial creation on first load
                // prompt user for slug or generate one
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePage = async (slug) => {
        setLoading(true);
        try {
            const res = await bioPagesAPI.create({ slug });
            const p = res.data.page;
            setPage(p);
            setProfile(p.profile);
            setTheme(p.theme);
            setButtons([]);
            setSocials([]);
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to create page');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!page) return;
        setSaving(true);
        try {
            await bioPagesAPI.update(page._id, {
                profile, theme, buttons, socials
            });
            alert('Changes saved!');
        } catch (e) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const addButton = () => {
        setButtons([...buttons, { label: 'New Link', url: 'https://', isVisible: true, animation: 'none' }]);
    };

    const updateButton = (index, field, value) => {
        const newButtons = [...buttons];
        newButtons[index][field] = value;
        setButtons(newButtons);
    };

    const removeButton = (index) => {
        if (!confirm('Remove this button?')) return;
        setButtons(buttons.filter((_, i) => i !== index));
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading builder...</div>;

    if (!page) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-lg border shadow-sm text-center">
                <h2 className="text-xl font-bold mb-4">Create your Bio Page</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleCreatePage(e.target.slug.value); }}>
                    <div className="flex gap-2">
                        <span className="py-2 text-gray-500 bg-gray-50 px-3 rounded-l-lg border-y border-l">viralix.com/b/</span>
                        <input name="slug" placeholder="username" required className="flex-1 border rounded-r-lg px-3 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Claim URL</button>
                </form>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* 🛠️ Editor Panel */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex gap-4">
                        {['links', 'appearance', 'settings'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'links' && (
                        <div className="space-y-6">
                            {/* Profile Section */}
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border">
                                            {profile.image ? <img src={profile.image} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">👤</span>}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })}
                                                placeholder="Page Title" className="w-full border rounded px-3 py-1.5 text-sm" />
                                            <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                                placeholder="Bio description" rows={2} className="w-full border rounded px-3 py-1.5 text-sm resize-none" />
                                            <input value={profile.image} onChange={e => setProfile({ ...profile, image: e.target.value })}
                                                placeholder="Image URL" className="w-full border rounded px-3 py-1.5 text-xs text-gray-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons Section */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Links</h3>
                                    <button onClick={addButton} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">+ Add Link</button>
                                </div>
                                <div className="space-y-3">
                                    {buttons.map((btn, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 group hover:border-blue-300 transition shadow-sm">
                                            <div className="flex gap-3 items-start">
                                                <div className="flex-1 space-y-2">
                                                    <input value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)}
                                                        placeholder="Label" className="w-full font-medium border-none p-0 focus:ring-0 text-sm" />
                                                    <input value={btn.url} onChange={e => updateButton(i, 'url', e.target.value)}
                                                        placeholder="https://" className="w-full text-xs text-gray-500 border-none p-0 focus:ring-0" />
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => updateButton(i, 'isVisible', !btn.isVisible)}
                                                        className={`text-xs px-2 py-1 rounded ${btn.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {btn.isVisible ? 'Visible' : 'Hidden'}
                                                    </button>
                                                    <button onClick={() => removeButton(i)} className="text-red-400 hover:text-red-600">🗑️</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {buttons.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No buttons yet. Add one!</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            {/* Themes */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Themes</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'simple-light', label: 'Light', bg: '#ffffff', text: '#000000', btn: '#f3f4f6', btnText: '#000000' },
                                        { id: 'simple-dark', label: 'Dark', bg: '#111827', text: '#ffffff', btn: '#374151', btnText: '#ffffff' },
                                        { id: 'gradient-blue', label: 'Ocean', bg: 'linear-gradient(to bottom right, #e0f2fe, #dbeafe)', text: '#1e3a8a', btn: '#ffffff', btnText: '#2563eb' },
                                        { id: 'gradient-purple', label: 'Nebula', bg: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', text: '#581c87', btn: '#ffffff', btnText: '#7e22ce' },
                                    ].map(t => (
                                        <button key={t.id} onClick={() => setTheme({ ...theme, id: t.id, background: t.bg, textColor: t.text, buttonColor: t.btn, buttonTextColor: t.btnText })}
                                            className={`h-24 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition ${theme.id === t.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                                            style={{ background: t.bg }}>
                                            <div className="w-16 h-4 rounded" style={{ background: t.btn }}></div>
                                            <div className="w-16 h-4 rounded" style={{ background: t.btn }}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Button Style */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Style</h3>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {['rounded', 'square', 'pill', 'shadow'].map(s => (
                                        <button key={s} onClick={() => setTheme({ ...theme, buttonStyle: s })}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition ${theme.buttonStyle === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="text-sm font-semibold text-blue-900 mb-1">Your Bio Link</h3>
                                <div className="flex gap-2 items-center">
                                    <code className="text-sm bg-white px-2 py-1 rounded text-blue-600 flex-1">
                                        {typeof window !== 'undefined' ? window.location.origin : ''}/b/{page.slug}
                                    </code>
                                    <a href={`/b/${page.slug}`} target="_blank" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                                        Visit
                                    </a>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Analytics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded border text-center">
                                        <div className="text-2xl font-bold text-gray-900">{page.stats?.views || 0}</div>
                                        <div className="text-xs text-gray-500">Page Views</div>
                                    </div>
                                    <div className="bg-white p-3 rounded border text-center">
                                        <div className="text-2xl font-bold text-gray-900">{buttons.reduce((a, b) => a + (b.clicks || 0), 0)}</div>
                                        <div className="text-xs text-gray-500">Button Clicks</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 📱 Mobile Preview */}
            <div className="w-[320px] shrink-0 flex flex-col items-center justify-center p-4 bg-gray-100 rounded-3xl border-8 border-gray-800 shadow-2xl h-[calc(100vh-140px)] relative overflow-hidden">
                {/* Live Preview IFrame could go here, but doing CSS emulation for simplicity */}
                <div className="w-full h-full overflow-y-auto no-scrollbar rounded-lg"
                    style={{ background: theme.background, color: theme.textColor }}>

                    <div className="p-6 flex flex-col items-center min-h-full">
                        {/* Profile */}
                        <div className="mb-6 text-center">
                            {profile.image && (
                                <img src={profile.image} alt="" className="w-20 h-20 rounded-full mx-auto object-cover mb-3 border-2 border-white/20 shadow-sm" />
                            )}
                            <h1 className="font-bold text-lg leading-tight mb-1">{profile.title || 'My Page'}</h1>
                            <p className="text-sm opacity-80 whitespace-pre-wrap">{profile.bio}</p>
                        </div>

                        {/* Buttons */}
                        <div className="w-full space-y-3 pb-8">
                            {buttons.filter(b => b.isVisible).map((btn, i) => (
                                <div key={i} className={`w-full py-3 px-4 text-center text-sm font-medium transition hover:scale-[1.02] active:scale-95 cursor-pointer
                                    ${theme.buttonStyle === 'rounded' ? 'rounded-lg' : theme.buttonStyle === 'pill' ? 'rounded-full' : theme.buttonStyle === 'shadow' ? 'rounded-lg shadow-lg' : 'rounded-none'}
                                 `}
                                    style={{ background: theme.buttonColor, color: theme.buttonTextColor }}>
                                    {btn.label}
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto text-[10px] opacity-40 pt-4">
                            Powered by Viralix
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
