'use client';

import { useState, useEffect } from 'react';
import { bioPagesAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import notify from '@/lib/notify';
import BioPreview, { SOCIAL_ICONS } from './BioPreview';
import {
    Link2, Loader2, Save, Plus, Trash2, Eye, EyeOff, ExternalLink, Copy, Palette, Settings, GripVertical,
} from 'lucide-react';

const THEMES = [
    {
        id: 'gradient-sage', label: 'Viralix',
        background: 'linear-gradient(135deg, #2F3E46 0%, #354F52 50%, #52796F 100%)',
        textColor: '#ffffff', buttonColor: '#84A98C', buttonTextColor: '#ffffff',
    },
    {
        id: 'cream', label: 'Cream',
        background: '#F7FAF8', textColor: '#354F52', buttonColor: '#52796F', buttonTextColor: '#ffffff',
    },
    {
        id: 'simple-light', label: 'Light',
        background: '#ffffff', textColor: '#354F52', buttonColor: '#84A98C', buttonTextColor: '#ffffff',
    },
    {
        id: 'simple-dark', label: 'Dark',
        background: '#1a1a1a', textColor: '#ffffff', buttonColor: '#52796F', buttonTextColor: '#ffffff',
    },
    {
        id: 'gradient-mist', label: 'Mist',
        background: 'linear-gradient(to bottom, var(--viralix-border), var(--viralix-bg))',
        textColor: '#2F3E46', buttonColor: '#354F52', buttonTextColor: '#ffffff',
    },
];

const TABS = [
    { id: 'links', label: 'Links', icon: Link2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'website'];

function PanelLabel({ children }) {
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--viralix-muted)]">{children}</p>;
}

export default function BioLinkPage() {
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ title: '', bio: '', image: '' });
    const [theme, setTheme] = useState(THEMES[0]);
    const [buttons, setButtons] = useState([]);
    const [socials, setSocials] = useState([]);
    const [activeTab, setActiveTab] = useState('links');
    const [saving, setSaving] = useState(false);
    const [slugInput, setSlugInput] = useState('');

    useEffect(() => { loadPage(); }, []);

    const loadPage = async () => {
        try {
            const res = await bioPagesAPI.list();
            if (res.data.pages?.length > 0) {
                const p = res.data.pages[0];
                setPage(p);
                setProfile(p.profile || { title: '', bio: '', image: '' });
                setTheme({ ...THEMES[0], ...p.theme });
                setButtons(p.buttons || []);
                setSocials(p.socials || []);
            }
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePage = async (e) => {
        e.preventDefault();
        const slug = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (!slug) return;
        setLoading(true);
        try {
            const res = await bioPagesAPI.create({ slug });
            const p = res.data.page;
            setPage(p);
            setProfile(p.profile);
            setTheme({ ...THEMES[0], ...p.theme });
            notify.success('Bio page created!');
        } catch (err) {
            notify.error(err.response?.data?.message || 'Failed to create page');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!page) return;
        setSaving(true);
        try {
            await bioPagesAPI.update(page._id, { profile, theme, buttons, socials });
            notify.success('Changes saved');
        } catch {
            notify.error('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const copyUrl = () => {
        const url = `${window.location.origin}/b/${page.slug}`;
        navigator.clipboard.writeText(url);
        notify.success('Link copied');
    };

    const addButton = () => {
        setButtons([...buttons, { label: 'New Link', url: 'https://', isVisible: true, animation: 'none' }]);
    };

    const updateButton = (index, field, value) => {
        const next = [...buttons];
        next[index] = { ...next[index], [field]: value };
        setButtons(next);
    };

    const removeButton = (index) => {
        setButtons(buttons.filter((_, i) => i !== index));
    };

    const updateSocial = (index, field, value) => {
        const next = [...socials];
        next[index] = { ...next[index], [field]: value };
        setSocials(next);
    };

    const addSocial = () => {
        setSocials([...socials, { platform: 'instagram', url: 'https://', isVisible: true }]);
    };

    const totalClicks = buttons.reduce((a, b) => a + (b.clicks || 0), 0);
    const pageViews = page?.stats?.views || 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
                <p className="text-sm text-[var(--viralix-muted)]">Loading bio page…</p>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="dash-card overflow-hidden rounded-2xl border border-[var(--viralix-border)]">
                <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-8 text-center text-white sm:px-6">
                    <Link2 className="mx-auto h-10 w-10 opacity-80" />
                    <h1 className="mt-3 text-xl font-semibold">Create your bio link</h1>
                    <p className="mt-1 text-sm text-white/60">One link for everything you share</p>
                </div>
                <form onSubmit={handleCreatePage} className="mx-auto max-w-md p-6 sm:p-8">
                    <PanelLabel>Choose your URL</PanelLabel>
                    <div className="mt-2 flex overflow-hidden rounded-xl border border-[var(--viralix-border)] focus-within:border-[#84A98C]">
                        <span className="flex items-center bg-[var(--viralix-inset)] px-3 text-sm text-[var(--viralix-muted)]">/b/</span>
                        <input
                            value={slugInput}
                            onChange={(e) => setSlugInput(e.target.value)}
                            placeholder="username"
                            required
                            className="flex-1 px-3 py-2.5 text-sm text-[var(--viralix-accent)] outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="mt-4 w-full btn btn-confirm"
                    >
                        Claim URL
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="dash-card overflow-hidden rounded-2xl border border-[var(--viralix-border)]">
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-4 text-white sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <Link2 className="h-5 w-5 opacity-80" />
                            Bio Link
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <code className="rounded-lg bg-white/10 px-2 py-1 text-xs">/b/{page.slug}</code>
                            <button type="button" onClick={copyUrl} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-[var(--viralix-surface)]/20">
                                <Copy className="h-3 w-3" /> Copy
                            </button>
                            <a href={`/b/${page.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-[var(--viralix-surface)]/20">
                                <ExternalLink className="h-3 w-3" /> Visit
                            </a>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold tabular-nums leading-none">{pageViews.toLocaleString()}</p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">Views</p>
                        </div>
                        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold tabular-nums leading-none">{totalClicks.toLocaleString()}</p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">Clicks</p>
                        </div>
                        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold tabular-nums leading-none">{buttons.filter((b) => b.isVisible !== false).length}</p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">Links</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-[#84A98C] px-4 py-2 text-sm font-medium text-white hover:bg-[#6B9080] disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-5 p-4 lg:flex-row lg:p-5">
                {/* Editor */}
                <div className="min-w-0 flex-1">
                    <div className="dash-card overflow-hidden rounded-xl border border-[var(--viralix-border)]">
                        <div className="flex gap-1 overflow-x-auto border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-3 py-2">
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveTab(id)}
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition',
                                        activeTab === id ? 'bg-[var(--viralix-surface)] text-[var(--viralix-accent)] shadow-sm ring-1 ring-[var(--viralix-border)]' : 'text-[var(--viralix-muted)] hover:text-[var(--viralix-accent)]'
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-4 sm:p-5">
                            {activeTab === 'links' && (
                                <div className="space-y-6">
                                    <section>
                                        <PanelLabel>Profile</PanelLabel>
                                        <div className="mt-3 flex gap-4">
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--viralix-border)] bg-[var(--viralix-inset)]">
                                                {profile.image ? (
                                                    <img src={profile.image} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl opacity-40">👤</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <input
                                                    value={profile.title}
                                                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                                    placeholder="Page title"
                                                    className="w-full rounded-lg border border-[var(--viralix-border)] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                                                />
                                                <textarea
                                                    value={profile.bio}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    placeholder="Bio description"
                                                    rows={2}
                                                    className="w-full resize-none rounded-lg border border-[var(--viralix-border)] px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                                                />
                                                <input
                                                    value={profile.image}
                                                    onChange={(e) => setProfile({ ...profile, image: e.target.value })}
                                                    placeholder="Profile image URL"
                                                    className="w-full rounded-lg border border-[var(--viralix-border)] px-3 py-2 text-xs text-[var(--viralix-muted)] focus:border-[#84A98C] focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center justify-between">
                                            <PanelLabel>Links</PanelLabel>
                                            <button type="button" onClick={addButton} className="inline-flex items-center gap-1 rounded-lg bg-[#84A98C]/15 px-2 py-1 text-xs font-medium text-[var(--viralix-muted)] hover:bg-[#84A98C]/25">
                                                <Plus className="h-3 w-3" /> Add link
                                            </button>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {buttons.map((btn, i) => (
                                                <div key={btn._id || i} className="group rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-3 transition hover:border-[#84A98C]/40">
                                                    <div className="flex items-start gap-2">
                                                        <GripVertical className="mt-2 h-4 w-4 shrink-0 text-[var(--viralix-border)] opacity-0 group-hover:opacity-100" />
                                                        <div className="min-w-0 flex-1 space-y-2">
                                                            <input
                                                                value={btn.label}
                                                                onChange={(e) => updateButton(i, 'label', e.target.value)}
                                                                placeholder="Label"
                                                                className="w-full border-none bg-transparent p-0 text-sm font-semibold text-[var(--viralix-accent)] focus:outline-none focus:ring-0"
                                                            />
                                                            <input
                                                                value={btn.url}
                                                                onChange={(e) => updateButton(i, 'url', e.target.value)}
                                                                placeholder="https://"
                                                                className="w-full border-none bg-transparent p-0 text-xs text-[var(--viralix-muted)] focus:outline-none focus:ring-0"
                                                            />
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateButton(i, 'isVisible', !btn.isVisible)}
                                                                className={cn(
                                                                    'rounded-lg p-1.5 transition',
                                                                    btn.isVisible !== false ? 'text-[var(--viralix-muted)] hover:bg-emerald-50' : 'text-[#94A3B8] hover:bg-[var(--viralix-bg)]'
                                                                )}
                                                                title={btn.isVisible !== false ? 'Visible' : 'Hidden'}
                                                            >
                                                                {btn.isVisible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                            </button>
                                                            <button type="button" onClick={() => removeButton(i)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {buttons.length === 0 && (
                                                <p className="py-8 text-center text-sm text-[var(--viralix-muted)]">No links yet — add your first one</p>
                                            )}
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center justify-between">
                                            <PanelLabel>Social icons</PanelLabel>
                                            <button type="button" onClick={addSocial} className="inline-flex items-center gap-1 rounded-lg bg-[#84A98C]/15 px-2 py-1 text-xs font-medium text-[var(--viralix-muted)] hover:bg-[#84A98C]/25">
                                                <Plus className="h-3 w-3" /> Add
                                            </button>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {socials.map((s, i) => (
                                                <div key={i} className="flex items-center gap-2 rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-2">
                                                    <span className="w-6 text-center text-sm">{SOCIAL_ICONS[s.platform] || '🔗'}</span>
                                                    <select
                                                        value={s.platform}
                                                        onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                                                        className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-2 py-1.5 text-xs capitalize focus:border-[#84A98C] focus:outline-none"
                                                    >
                                                        {SOCIAL_PLATFORMS.map((p) => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        value={s.url}
                                                        onChange={(e) => updateSocial(i, 'url', e.target.value)}
                                                        placeholder="https://"
                                                        className="min-w-0 flex-1 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-2 py-1.5 text-xs focus:border-[#84A98C] focus:outline-none"
                                                    />
                                                    <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-6">
                                    <section>
                                        <PanelLabel>Theme</PanelLabel>
                                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {THEMES.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setTheme({ ...theme, ...t })}
                                                    className={cn(
                                                        'flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition',
                                                        theme.id === t.id ? 'border-[#84A98C] ring-2 ring-[#84A98C]/20' : 'border-[var(--viralix-border)] hover:border-[var(--viralix-border)]'
                                                    )}
                                                    style={{ background: t.background }}
                                                >
                                                    <div className="h-3 w-12 rounded" style={{ background: t.buttonColor }} />
                                                    <span className="text-[0.625rem] font-medium" style={{ color: t.textColor }}>{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                    <section>
                                        <PanelLabel>Button style</PanelLabel>
                                        <div className="mt-3 flex rounded-xl bg-[var(--viralix-inset)] p-1">
                                            {['rounded', 'pill', 'square', 'shadow'].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setTheme({ ...theme, buttonStyle: s })}
                                                    className={cn(
                                                        'flex-1 rounded-lg py-2 text-xs font-medium capitalize transition',
                                                        theme.buttonStyle === s ? 'bg-[var(--viralix-surface)] text-[var(--viralix-accent)] shadow-sm' : 'text-[var(--viralix-muted)]'
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-4">
                                        <PanelLabel>Public URL</PanelLabel>
                                        <div className="mt-2 flex gap-2">
                                            <code className="flex-1 truncate rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-sm text-[var(--viralix-muted)]">
                                                {typeof window !== 'undefined' ? `${window.location.origin}/b/${page.slug}` : `/b/${page.slug}`}
                                            </code>
                                            <button type="button" onClick={copyUrl} className="shrink-0 btn btn-confirm btn-sm">
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-4 text-center">
                                            <p className="text-2xl font-bold tabular-nums text-[var(--viralix-accent)]">{pageViews.toLocaleString()}</p>
                                            <p className="text-xs text-[var(--viralix-muted)]">Page views</p>
                                        </div>
                                        <div className="rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-bg)] p-4 text-center">
                                            <p className="text-2xl font-bold tabular-nums text-[var(--viralix-accent)]">{totalClicks.toLocaleString()}</p>
                                            <p className="text-xs text-[var(--viralix-muted)]">Link clicks</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex shrink-0 items-start justify-center lg:sticky lg:top-4">
                    <BioPreview profile={profile} theme={theme} buttons={buttons} socials={socials} />
                </div>
            </div>
        </div>
    );
}
