'use client';

import { useEffect, useState } from 'react';
import {
    BarChart3, Calendar, ChevronRight, Inbox, Sparkles, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import { useInView } from './useInView';

const PILLARS = [
    {
        id: 'schedule',
        icon: Calendar,
        tag: 'Smart scheduling',
        title: 'Post when your audience is actually online',
        description: 'Drag posts onto a visual calendar. Viralix scores every slot per platform and queues your content automatically.',
        stat: '94% optimal-time match',
    },
    {
        id: 'ai',
        icon: Sparkles,
        tag: 'AI Studio',
        title: 'Captions & hashtags in seconds, not hours',
        description: 'Generate multiple caption variants, trending hashtags, and tone-matched replies — then edit and publish without leaving the editor.',
        stat: '3× faster content creation',
    },
    {
        id: 'crosspost',
        icon: Share2,
        tag: 'Cross-platform',
        title: 'One upload. Four platforms. Zero rework.',
        description: 'Upload once, preview how your post looks on Instagram, TikTok, YouTube, and Facebook, then publish or schedule in a single flow.',
        stat: '4 platforms · 1 workflow',
    },
    {
        id: 'inbox',
        icon: Inbox,
        tag: 'Unified inbox',
        title: 'Every comment & DM in one thread',
        description: 'Reply from a single inbox with AI suggestions, auto-reply rules, and sentiment tags — no more switching between apps.',
        stat: '60% less reply time',
    },
    {
        id: 'analytics',
        icon: BarChart3,
        tag: 'Analytics',
        title: 'See what’s working across every channel',
        description: 'Track reach, engagement, and top-performing posts with cross-platform breakdowns and best-time insights built in.',
        stat: '+34% avg. engagement lift',
    },
];

function SchedulePreview({ active }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const slots = [
        { day: 1, time: '6 PM', platform: 'instagram', title: 'Launch reel' },
        { day: 2, time: '10 AM', platform: 'youtube', title: 'Tutorial' },
        { day: 3, time: '7 PM', platform: 'tiktok', title: 'Behind scenes' },
        { day: 4, time: '2 PM', platform: 'facebook', title: 'Carousel' },
    ];

    return (
        <div className={cn('transition-all duration-500', active ? 'opacity-100' : 'opacity-0')}>
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-white/50">March 2026</span>
                <span className="rounded-full bg-[#84A98C]/20 px-2 py-0.5 text-[0.625rem] font-semibold text-[#84A98C]">
                    AI suggested times
                </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
                {days.map((d) => (
                    <div key={d} className="text-center text-[0.625rem] font-medium text-white/35">{d}</div>
                ))}
                {Array.from({ length: 5 }).map((_, col) => (
                    <div key={col} className="min-h-[100px] rounded-lg bg-white/5 p-1">
                        {slots.filter((s) => s.day === col).map((s) => {
                            const p = PLATFORM_CONFIG[s.platform];
                            return (
                                <div
                                    key={s.title}
                                    className="landing-feature-slide mb-1 rounded-md border border-white/10 p-1.5"
                                    style={{ borderLeftColor: p.color, borderLeftWidth: 2 }}
                                >
                                    <p className="truncate text-[0.5625rem] font-semibold text-white/90">{s.title}</p>
                                    <p className="text-[0.5rem] text-white/40">{s.time}</p>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

function AiPreview({ active }) {
    const [text, setText] = useState('');
    const full = 'Stop scrolling. Start growing.\nYour next viral post starts here.';

    useEffect(() => {
        if (!active) { setText(''); return undefined; }
        let i = 0;
        const t = setInterval(() => {
            i += 1;
            setText(full.slice(0, i));
            if (i >= full.length) clearInterval(t);
        }, 25);
        return () => clearInterval(t);
    }, [active, full]);

    const tags = ['ContentCreator', 'ReelsTips', 'SocialGrowth', 'Viralix'];

    return (
        <div className={cn('space-y-4 transition-all duration-500', active ? 'opacity-100' : 'opacity-0')}>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#84A98C]" />
                    <span className="text-[0.6875rem] font-medium text-white/50">Caption · Engaging tone</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                    {text}
                    {active && text.length < full.length && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#84A98C]" />
                    )}
                </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                    <span
                        key={tag}
                        className="landing-feature-chip rounded-full bg-[#84A98C]/15 px-2.5 py-1 text-[0.625rem] font-medium text-[#84A98C]"
                        style={{ animationDelay: `${i * 120}ms` }}
                    >
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

function CrossPostPreview({ active }) {
    const platforms = ['instagram', 'tiktok', 'youtube', 'facebook'];

    return (
        <div className={cn('transition-all duration-500', active ? 'opacity-100' : 'opacity-0')}>
            <div className="mx-auto mb-5 aspect-[4/5] max-w-[180px] overflow-hidden rounded-xl bg-gradient-to-br from-[#52796F]/40 to-[#84A98C]/30 ring-2 ring-white/10">
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <div className="mb-2 h-10 w-10 rounded-full bg-white/10" />
                    <p className="text-[0.6875rem] font-medium text-white/80">Summer launch reel</p>
                    <p className="mt-1 text-[0.5625rem] text-white/40">1 source file</p>
                </div>
            </div>
            <div className="relative mx-auto flex max-w-xs items-center justify-center">
                <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="relative flex w-full justify-between px-2">
                    {platforms.map((key, i) => {
                        const p = PLATFORM_CONFIG[key];
                        return (
                            <div
                                key={key}
                                className="landing-feature-chip flex flex-col items-center gap-1"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#2F3E46] shadow-lg">
                                    <p.icon className="h-4 w-4" style={{ color: p.color }} />
                                </div>
                                <span className="text-[0.5625rem] text-white/40">{p.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <p className="mt-5 text-center text-xs text-white/45">Optimized captions & formats per platform</p>
        </div>
    );
}

function InboxPreview({ active }) {
    const messages = [
        { from: 'them', text: 'How do I connect my TikTok?' },
        { from: 'them', text: 'Also — is there a free trial?' },
    ];

    return (
        <div className={cn('space-y-3 transition-all duration-500', active ? 'opacity-100' : 'opacity-0')}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400/30 to-purple-400/30 text-xs font-bold text-white">
                    SK
                </div>
                <div>
                    <p className="text-xs font-semibold text-white/90">Sarah Khan</p>
                    <p className="text-[0.625rem] text-white/40">Instagram · 2 new messages</p>
                </div>
            </div>
            {messages.map((m, i) => (
                <div key={i} className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-xs text-white/75">
                    {m.text}
                </div>
            ))}
            <div className="landing-feature-slide rounded-xl border border-[#84A98C]/30 bg-[#84A98C]/10 p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#84A98C]" />
                    <span className="text-[0.625rem] font-semibold text-[#84A98C]">AI suggestion</span>
                </div>
                <p className="text-[0.6875rem] leading-relaxed text-white/70">
                    Hey Sarah! Yes — start free at viralix.dev/signup. TikTok connects in under 2 min from Connect Accounts 🚀
                </p>
            </div>
        </div>
    );
}

function AnalyticsPreview({ active }) {
    const bars = [45, 62, 58, 78, 71, 88, 82, 94];
    const metrics = [
        { label: 'Reach', value: '24.8K', change: '+12%' },
        { label: 'Engagement', value: '8.4%', change: '+34%' },
        { label: 'Followers', value: '+892', change: '+18%' },
    ];

    return (
        <div className={cn('space-y-4 transition-all duration-500', active ? 'opacity-100' : 'opacity-0')}>
            <div className="grid grid-cols-3 gap-2">
                {metrics.map((m) => (
                    <div key={m.label} className="rounded-lg bg-white/5 px-2 py-2 text-center">
                        <p className="text-[0.5625rem] text-white/40">{m.label}</p>
                        <p className="text-sm font-bold text-white">{m.value}</p>
                        <p className="text-[0.5625rem] font-medium text-emerald-400">{m.change}</p>
                    </div>
                ))}
            </div>
            <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-2 text-[0.625rem] font-medium text-white/45">Weekly engagement</p>
                <div className="flex h-24 items-end gap-1">
                    {bars.map((h, i) => (
                        <div
                            key={i}
                            className="landing-bar-grow flex-1 rounded-sm bg-gradient-to-t from-[#52796F] to-[#84A98C]"
                            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

const PREVIEWS = {
    schedule: SchedulePreview,
    ai: AiPreview,
    crosspost: CrossPostPreview,
    inbox: InboxPreview,
    analytics: AnalyticsPreview,
};

export default function FeaturesBento() {
    const [active, setActive] = useState('schedule');
    const { ref, visible } = useInView();
    const pillar = PILLARS.find((p) => p.id === active);
    const Preview = PREVIEWS[active];

    useEffect(() => {
        if (!visible) return undefined;
        const interval = setInterval(() => {
            setActive((cur) => {
                const idx = PILLARS.findIndex((p) => p.id === cur);
                return PILLARS[(idx + 1) % PILLARS.length].id;
            });
        }, 6000);
        return () => clearInterval(interval);
    }, [visible]);

    return (
        <section id="features" className="relative overflow-hidden bg-[#F7FAF8] py-20 sm:py-28">
            {/* Grid bg */}
            <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    backgroundImage: 'linear-gradient(#E2E8E4 1px, transparent 1px), linear-gradient(90deg, #E2E8E4 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={ref}
                    className={cn(
                        'mb-12 max-w-2xl transition-all duration-700',
                        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    )}
                >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#84A98C]">
                        Built for creators
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight text-[#354F52] sm:text-4xl">
                        Your entire social workflow,
                        <span className="text-[#52796F]"> not another generic tool</span>
                    </h2>
                    <p className="mt-4 text-[#52796F] leading-relaxed">
                        Viralix replaces the patchwork of schedulers, inbox apps, and analytics tabs — with one system that actually talks to itself.
                    </p>
                </div>

                <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
                    {/* Left — feature picker */}
                    <div className="space-y-2">
                        {PILLARS.map((p, i) => {
                            const isActive = active === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setActive(p.id)}
                                    className={cn(
                                        'group w-full rounded-2xl border p-5 text-left transition-all duration-300',
                                        isActive
                                            ? 'border-[#B8C9C0] bg-white shadow-lg shadow-[#354F52]/5'
                                            : 'border-transparent bg-transparent hover:bg-white/60',
                                        visible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                                    )}
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                                                isActive ? 'bg-[#354F52] text-white' : 'bg-[#84A98C]/15 text-[#52796F]'
                                            )}
                                        >
                                            <p.icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#84A98C]">
                                                    {p.tag}
                                                </span>
                                                {isActive && (
                                                    <ChevronRight className="h-3.5 w-3.5 text-[#84A98C]" />
                                                )}
                                            </div>
                                            <h3 className={cn(
                                                'mt-0.5 text-base font-semibold transition-colors',
                                                isActive ? 'text-[#354F52]' : 'text-[#52796F]'
                                            )}>
                                                {p.title}
                                            </h3>
                                            {isActive && (
                                                <p className="landing-feature-expand mt-2 text-sm leading-relaxed text-[#52796F]">
                                                    {p.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <p className="landing-feature-expand mt-3 pl-14 text-xs font-semibold text-[#84A98C]">
                                            {p.stat}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right — live preview panel */}
                    <div
                        className={cn(
                            'sticky top-28 transition-all duration-700 delay-200',
                            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        )}
                    >
                        <div className="overflow-hidden rounded-2xl border border-[#354F52]/20 bg-gradient-to-br from-[#1a2428] via-[#2F3E46] to-[#354F52] shadow-2xl shadow-[#354F52]/20">
                            {/* Window chrome */}
                            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                                <div className="flex gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                                </div>
                                <span className="ml-2 text-[0.6875rem] text-white/35">
                                    Viralix · {pillar?.tag}
                                </span>
                            </div>

                            <div className="min-h-[320px] p-6 sm:p-8" key={active}>
                                <Preview active />
                            </div>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-1.5 border-t border-white/5 py-3">
                                {PILLARS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setActive(p.id)}
                                        aria-label={`Show ${p.tag}`}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-300',
                                            active === p.id ? 'w-6 bg-[#84A98C]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
