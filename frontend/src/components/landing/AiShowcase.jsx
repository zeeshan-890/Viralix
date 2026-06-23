'use client';

import { useEffect, useState } from 'react';
import { Clock, Hash, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from './useInView';

const TABS = [
    {
        id: 'caption',
        label: 'Captions',
        icon: Sparkles,
        demo: 'Stop scrolling. Start growing.\nYour audience is waiting — give them something worth sharing. 🚀',
        meta: 'Tone: Engaging · Platform: Instagram',
    },
    {
        id: 'hashtags',
        label: 'Hashtags',
        icon: Hash,
        demo: '#ContentCreator #SocialMediaTips #GrowOnInstagram #ReelsStrategy #CreatorEconomy #ViralContent',
        meta: '20 tags · Niche: Marketing',
    },
    {
        id: 'reply',
        label: 'Auto-reply',
        icon: MessageSquare,
        demo: 'Hey Sarah! Thanks for reaching out 😊 Great question — you can start free at viralix.dev/signup. Let me know if you need help connecting your accounts!',
        meta: 'Tone: Friendly · Trigger: "info"',
    },
    {
        id: 'times',
        label: 'Best times',
        icon: Clock,
        demo: 'Instagram  ·  Tue 6:00 PM  ·  94% score\nTikTok     ·  Thu 7:30 PM  ·  89% score\nYouTube    ·  Sat 11:00 AM ·  82% score',
        meta: 'Based on your last 30 days',
    },
];

function Typewriter({ text, active }) {
    const [display, setDisplay] = useState('');

    useEffect(() => {
        if (!active) {
            setDisplay('');
            return undefined;
        }
        let i = 0;
        setDisplay('');
        const interval = setInterval(() => {
            i += 1;
            setDisplay(text.slice(0, i));
            if (i >= text.length) clearInterval(interval);
        }, 18);
        return () => clearInterval(interval);
    }, [text, active]);

    return (
        <span className="whitespace-pre-wrap">
            {display}
            {active && display.length < text.length && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#84A98C]" />
            )}
        </span>
    );
}

export default function AiShowcase() {
    const [active, setActive] = useState('caption');
    const { ref, visible } = useInView();
    const tab = TABS.find((t) => t.id === active);

    return (
        <section id="ai" className="relative overflow-hidden bg-[#2F3E46] py-20 sm:py-28">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#84A98C]/40 to-transparent" />
                <div className="landing-orb absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[#84A98C]/10 blur-[80px]" />
            </div>

            <div ref={ref} className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className={cn('mb-12 text-center transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#84A98C]">AI Studio</p>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Your creative co-pilot
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-white/55">
                        Captions, hashtags, replies, and scheduling intelligence — powered by AI, tuned to your brand.
                    </p>
                </div>

                <div className={cn('grid gap-8 lg:grid-cols-[240px_1fr] transition-all duration-700 delay-150', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')}>
                    <div className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActive(t.id)}
                                className={cn(
                                    'flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all',
                                    active === t.id
                                        ? 'bg-[#84A98C] text-white shadow-lg shadow-[#84A98C]/25'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                )}
                            >
                                <t.icon className="h-4 w-4 shrink-0" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a2428] shadow-2xl">
                        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                            <Sparkles className="h-4 w-4 text-[#84A98C]" />
                            <span className="text-xs font-medium text-white/50">Viralix AI · {tab?.label}</span>
                        </div>
                        <div className="min-h-[180px] p-6">
                            <p className="text-base leading-relaxed text-white/85">
                                <Typewriter key={active} text={tab?.demo || ''} active={visible} />
                            </p>
                            <p className="mt-4 text-xs text-white/35">{tab?.meta}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
