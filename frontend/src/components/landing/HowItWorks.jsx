'use client';

import { Calendar, Link2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from './useInView';

const STEPS = [
    {
        step: '01',
        icon: Link2,
        title: 'Connect your accounts',
        description: 'Secure OAuth for Instagram, TikTok, YouTube, and Facebook — no passwords stored.',
    },
    {
        step: '02',
        icon: Sparkles,
        title: 'Create with AI',
        description: 'Upload media, generate captions & hashtags, and preview how posts look on each platform.',
    },
    {
        step: '03',
        icon: Calendar,
        title: 'Schedule & grow',
        description: 'Queue posts at AI-recommended times, track analytics, and reply from one inbox.',
    },
];

export default function HowItWorks() {
    const { ref, visible } = useInView();

    return (
        <section id="how-it-works" className="bg-[#F7FAF8] py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={cn('mb-14 text-center transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#84A98C]">How it works</p>
                    <h2 className="text-3xl font-bold tracking-tight text-[#354F52] sm:text-4xl">
                        Up and running in minutes
                    </h2>
                </div>

                <div className="relative grid gap-8 md:grid-cols-3">
                    <div className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[#B8C9C0] to-transparent md:block" />

                    {STEPS.map((s, i) => (
                        <div
                            key={s.step}
                            className={cn(
                                'relative text-center transition-all duration-700',
                                visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            )}
                            style={{ transitionDelay: `${i * 120}ms` }}
                        >
                            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#B8C9C0] bg-white shadow-sm">
                                <s.icon className="h-7 w-7 text-[#52796F]" />
                                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#354F52] text-[0.625rem] font-bold text-white">
                                    {s.step}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-[#354F52]">{s.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#52796F]">{s.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
