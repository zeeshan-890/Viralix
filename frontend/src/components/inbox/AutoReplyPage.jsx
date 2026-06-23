'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { autoReplyAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import RuleEditor from './RuleEditor';
import { toast } from 'react-hot-toast';
import {
    Bot, Sparkles, Loader2, Plus, Pencil, Trash2, Zap, Clock, MessageSquare,
    ChevronLeft, ToggleLeft, ToggleRight,
} from 'lucide-react';

const RULE_TYPE_LABELS = {
    comment_dm: 'Comment → DM',
    dm_keyword: 'DM keyword',
    away: 'Away',
    welcome: 'Welcome',
};

const TONES = ['friendly', 'professional', 'concise', 'empathetic'];

function PanelLabel({ children }) {
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">{children}</p>;
}

function Toggle({ enabled, onChange, label }) {
    return (
        <button type="button" onClick={() => onChange(!enabled)} className="flex w-full items-center justify-between rounded-xl border border-[#E8EDEA] bg-[#FAFCFB] px-4 py-3 text-left transition hover:border-[#B8C9C0]">
            <span className="text-sm font-medium text-[#354F52]">{label}</span>
            {enabled ? <ToggleRight className="h-6 w-6 text-[#52796F]" /> : <ToggleLeft className="h-6 w-6 text-[#94A3B8]" />}
        </button>
    );
}

export default function AutoReplyPage() {
    const [tab, setTab] = useState('ai');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [settingsRes, rulesRes] = await Promise.all([
                autoReplyAPI.getSettings(),
                autoReplyAPI.getRules(),
            ]);
            setSettings(settingsRes.data);
            setRules(rulesRes.data.rules || []);
        } catch {
            toast.error('Failed to load auto-reply settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const saveSettings = async (patch) => {
        setSaving(true);
        try {
            const res = await autoReplyAPI.updateSettings(patch);
            setSettings(res.data);
            toast.success('Settings saved');
        } catch {
            toast.error('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleSettingsChange = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
    };

    const saveSettingsDebounced = () => saveSettings(settings);

    const handleSaveRule = async (form) => {
        setSaving(true);
        try {
            if (editingRule?._id) {
                await autoReplyAPI.updateRule(editingRule._id, form);
                toast.success('Rule updated');
            } else {
                await autoReplyAPI.createRule(form);
                toast.success('Rule created');
            }
            setShowEditor(false);
            setEditingRule(null);
            await load();
        } catch {
            toast.error('Failed to save rule');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRule = async (id) => {
        try {
            const res = await autoReplyAPI.toggleRule(id);
            setRules((prev) => prev.map((r) => (r._id === id ? res.data.rule : r)));
        } catch {
            toast.error('Toggle failed');
        }
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Delete this rule?')) return;
        try {
            await autoReplyAPI.deleteRule(id);
            setRules((prev) => prev.filter((r) => r._id !== id));
            toast.success('Rule deleted');
        } catch {
            toast.error('Delete failed');
        }
    };

    const activeRules = rules.filter((r) => r.enabled).length;
    const totalSent = rules.reduce((s, r) => s + (r.stats?.sent || 0), 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
                <p className="text-sm text-[#52796F]">Loading auto-reply system…</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#B8C9C0] bg-white shadow-[0_8px_30px_rgba(47,62,70,0.08)]">
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-4 text-white sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link href="/dashboard/inbox" className="mb-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
                            <ChevronLeft className="h-3 w-3" /> Back to inbox
                        </Link>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <Bot className="h-5 w-5 opacity-80" />
                            Auto-Reply & AI
                        </h1>
                        <p className="mt-0.5 text-sm text-white/60">Automate responses and let AI draft replies in your inbox</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold tabular-nums leading-none">{activeRules}</p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">Active rules</p>
                        </div>
                        <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                            <p className="text-lg font-bold tabular-nums leading-none">{totalSent.toLocaleString()}</p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">Auto-sent</p>
                        </div>
                        <div className={cn('rounded-lg px-3 py-1.5 text-center', settings?.aiEnabled ? 'bg-emerald-500/20' : 'bg-white/10')}>
                            <p className="flex items-center justify-center gap-1 text-lg font-bold leading-none">
                                <Sparkles className="h-4 w-4" />
                                {settings?.aiEnabled ? 'On' : 'Off'}
                            </p>
                            <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">AI assist</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 border-b border-[#E8EDEA] bg-[#FAFCFB] px-4 py-2">
                {[
                    { id: 'ai', label: 'AI assistant', icon: Sparkles },
                    { id: 'rules', label: 'Auto-reply rules', icon: Zap },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => { setTab(id); setShowEditor(false); }}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition',
                            tab === id ? 'bg-white text-[#354F52] shadow-sm ring-1 ring-[#D5DFD9]' : 'text-[#52796F] hover:text-[#354F52]'
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            <div className="p-4 sm:p-5">
                {tab === 'ai' && settings && (
                    <div className="mx-auto max-w-2xl space-y-5">
                        <Toggle
                            label="Enable AI reply assistant"
                            enabled={settings.aiEnabled}
                            onChange={(v) => { handleSettingsChange('aiEnabled', v); saveSettings({ aiEnabled: v }); }}
                        />
                        <Toggle
                            label="Enable auto-reply rules"
                            enabled={settings.autoReplyEnabled}
                            onChange={(v) => { handleSettingsChange('autoReplyEnabled', v); saveSettings({ autoReplyEnabled: v }); }}
                        />

                        <section className="rounded-xl border border-[#E8EDEA] bg-[#FAFCFB] p-4">
                            <PanelLabel>AI behavior</PanelLabel>
                            <div className="mt-3 flex gap-2">
                                {[
                                    { id: 'suggest', label: 'Suggest only', desc: 'AI drafts — you approve before sending' },
                                    { id: 'auto_send', label: 'Auto-send', desc: 'Send when confidence is high enough' },
                                ].map(({ id, label, desc }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => { handleSettingsChange('aiMode', id); saveSettings({ aiMode: id }); }}
                                        disabled={!settings.aiEnabled}
                                        className={cn(
                                            'flex-1 rounded-xl border p-3 text-left transition disabled:opacity-40',
                                            settings.aiMode === id ? 'border-[#84A98C] bg-[#84A98C]/10' : 'border-[#E8EDEA] bg-white'
                                        )}
                                    >
                                        <p className="text-xs font-semibold text-[#354F52]">{label}</p>
                                        <p className="mt-0.5 text-[0.625rem] text-[#52796F]">{desc}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-xl border border-[#E8EDEA] bg-[#FAFCFB] p-4">
                            <PanelLabel>Default tone</PanelLabel>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {TONES.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { handleSettingsChange('defaultTone', t); saveSettings({ defaultTone: t }); }}
                                        disabled={!settings.aiEnabled}
                                        className={cn(
                                            'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition disabled:opacity-40',
                                            settings.defaultTone === t ? 'bg-[#354F52] text-white' : 'bg-white text-[#52796F] ring-1 ring-[#D5DFD9]'
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {settings.aiMode === 'auto_send' && (
                            <section className="rounded-xl border border-[#E8EDEA] bg-[#FAFCFB] p-4">
                                <div className="flex items-center justify-between">
                                    <PanelLabel>Confidence threshold</PanelLabel>
                                    <span className="text-sm font-bold tabular-nums text-[#354F52]">{settings.confidenceThreshold}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={60}
                                    max={99}
                                    value={settings.confidenceThreshold}
                                    onChange={(e) => handleSettingsChange('confidenceThreshold', Number(e.target.value))}
                                    onMouseUp={saveSettingsDebounced}
                                    onTouchEnd={saveSettingsDebounced}
                                    disabled={!settings.aiEnabled}
                                    className="mt-3 w-full accent-[#52796F] disabled:opacity-40"
                                />
                                <p className="mt-1 text-[0.625rem] text-[#94A3B8]">Only auto-send when AI confidence meets this bar</p>
                            </section>
                        )}

                        <section className="rounded-xl border border-[#E8EDEA] bg-[#FAFCFB] p-4 space-y-3">
                            <Toggle
                                label="Business hours only"
                                enabled={settings.businessHoursOnly}
                                onChange={(v) => { handleSettingsChange('businessHoursOnly', v); saveSettings({ businessHoursOnly: v }); }}
                            />
                            {settings.businessHoursOnly && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#84A98C]" />
                                    <input
                                        type="time"
                                        value={settings.businessHours?.start || '09:00'}
                                        onChange={(e) => {
                                            const bh = { ...settings.businessHours, start: e.target.value };
                                            handleSettingsChange('businessHours', bh);
                                            saveSettings({ businessHours: bh });
                                        }}
                                        className="rounded-lg border border-[#D5DFD9] px-2 py-1 text-sm"
                                    />
                                    <span className="text-xs text-[#52796F]">to</span>
                                    <input
                                        type="time"
                                        value={settings.businessHours?.end || '18:00'}
                                        onChange={(e) => {
                                            const bh = { ...settings.businessHours, end: e.target.value };
                                            handleSettingsChange('businessHours', bh);
                                            saveSettings({ businessHours: bh });
                                        }}
                                        className="rounded-lg border border-[#D5DFD9] px-2 py-1 text-sm"
                                    />
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border border-[#E8EDEA] bg-[#FAFCFB] p-4">
                            <PanelLabel>Sign-off (appended to AI replies)</PanelLabel>
                            <input
                                value={settings.signOff || ''}
                                onChange={(e) => handleSettingsChange('signOff', e.target.value)}
                                onBlur={saveSettingsDebounced}
                                placeholder="— The Viralix Team"
                                className="mt-2 w-full rounded-lg border border-[#D5DFD9] bg-white px-3 py-2 text-sm focus:border-[#84A98C] focus:outline-none"
                            />
                        </section>
                    </div>
                )}

                {tab === 'rules' && (
                    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
                        <div className="overflow-hidden rounded-xl border border-[#B8C9C0] bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-[#E8EDEA] bg-[#FAFCFB] px-4 py-3">
                                <PanelLabel>Rules ({rules.length})</PanelLabel>
                                <button
                                    type="button"
                                    onClick={() => { setEditingRule(null); setShowEditor(true); }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#52796F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#354F52]"
                                >
                                    <Plus className="h-3.5 w-3.5" /> New rule
                                </button>
                            </div>
                            {rules.length === 0 ? (
                                <div className="py-16 text-center">
                                    <MessageSquare className="mx-auto h-10 w-10 text-[#B8C9C0]" />
                                    <p className="mt-3 text-sm text-[#52796F]">No rules yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-[#E8EDEA] text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">
                                                <th className="px-4 py-2.5">Rule</th>
                                                <th className="px-4 py-2.5">Type</th>
                                                <th className="hidden px-4 py-2.5 sm:table-cell">Platforms</th>
                                                <th className="px-4 py-2.5 text-right">Sent</th>
                                                <th className="px-4 py-2.5">On</th>
                                                <th className="px-4 py-2.5" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rules.map((rule) => (
                                                <tr key={rule._id} className="border-b border-[#E8EDEA] last:border-b-0 hover:bg-[#F4F8F6]">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-[#354F52]">{rule.name}</p>
                                                        <p className="text-[0.625rem] text-[#94A3B8]">
                                                            {rule.replyType === 'ai' ? `AI · ${rule.aiTone}` : 'Fixed message'}
                                                            {rule.keywords?.length > 0 && ` · ${rule.keywords.slice(0, 3).join(', ')}`}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-[#52796F]">{RULE_TYPE_LABELS[rule.type] || rule.type}</td>
                                                    <td className="hidden px-4 py-3 sm:table-cell">
                                                        <div className="flex -space-x-1">
                                                            {(rule.platforms || []).slice(0, 4).map((p) => {
                                                                const cfg = PLATFORM_CONFIG[p];
                                                                if (!cfg) return null;
                                                                const Icon = cfg.icon;
                                                                return (
                                                                    <span key={p} className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white" style={{ backgroundColor: cfg.bg }}>
                                                                        <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-[#354F52]">{rule.stats?.sent || 0}</td>
                                                    <td className="px-4 py-3">
                                                        <button type="button" onClick={() => handleToggleRule(rule._id)} className="text-[#52796F]">
                                                            {rule.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5 text-[#94A3B8]" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <button type="button" onClick={() => { setEditingRule(rule); setShowEditor(true); }} className="rounded-lg p-1.5 text-[#52796F] hover:bg-[#F4F8F6]">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button type="button" onClick={() => handleDeleteRule(rule._id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={cn('rounded-xl border border-[#B8C9C0] bg-white p-4 shadow-sm', !showEditor && 'hidden lg:block')}>
                            {showEditor ? (
                                <RuleEditor
                                    rule={editingRule}
                                    onSave={handleSaveRule}
                                    onCancel={() => { setShowEditor(false); setEditingRule(null); }}
                                    saving={saving}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-[#52796F]">
                                    <Zap className="h-10 w-10 text-[#B8C9C0]" />
                                    <p className="mt-3 text-sm font-medium text-[#354F52]">Select or create a rule</p>
                                    <p className="mt-1 text-xs">Keyword triggers, comment-to-DM, and AI-powered replies</p>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingRule(null); setShowEditor(true); }}
                                        className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[#52796F] px-4 py-2 text-xs font-medium text-white"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> New rule
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
