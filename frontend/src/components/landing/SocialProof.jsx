'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp, useInView } from './useInView';

const STATS = [
    { end: 4, suffix: '', label: 'Platforms supported' },
    { end: 12, suffix: 'K+', label: 'Posts scheduled' },
    { end: 60, suffix: '%', label: 'Time saved weekly' },
    { end: 98, suffix: '%', label: 'Uptime SLA' },
];

const TESTIMONIALS = [
    {
        quote: 'Viralix replaced three tools for us. The unified inbox alone saves my team hours every week.',
        name: 'Sarah Khan',
        role: 'Content Creator',
        initials: 'SK',
    },
    {
        quote: 'Managing 20+ client accounts used to be chaos. Now scheduling and analytics live in one place.',
        name: 'DigitalBoost Agency',
        role: 'Marketing Agency',
        initials: 'DB',
    },
    {
        quote: 'AI captions are surprisingly good. I tweak 10% and publish — my engagement jumped 40%.',
        name: 'Ali Raza',
        role: 'Entrepreneur',
        initials: 'AR',
    },
];

function StatItem({ end, suffix, label, active }) {
    const value = useCountUp(end, active);
    return (
        <div className="text-center">
            <p className="text-3xl font-bold tabular-nums text-[#354F52] sm:text-4xl">
                {value}{suffix}
            </p>
            <p className="mt-1 text-sm text-[#52796F]">{label}</p>
        </div>
    );
}

export default function SocialProof() {
    const { ref, visible } = useInView();

    return (
        <section className="bg-white py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div
                    ref={ref}
                    className={cn(
                        'mb-16 grid grid-cols-2 gap-8 rounded-2xl border border-[#E2E8E4] bg-[#FAFCFB] px-6 py-10 sm:grid-cols-4 sm:px-10 transition-all duration-700',
                        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    )}
                >
                    {STATS.map((s) => (
                        <StatItem key={s.label} {...s} active={visible} />
                    ))}
                </div>

                <div className={cn('mb-10 text-center transition-all duration-700 delay-100', visible ? 'opacity-100' : 'opacity-0')}>
                    <h2 className="text-3xl font-bold tracking-tight text-[#354F52] sm:text-4xl">
                        Loved by creators & teams
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((t, i) => (
                        <div
                            key={t.name}
                            className={cn(
                                'rounded-2xl border border-[#E2E8E4] bg-white p-6 transition-all duration-700 hover:border-[#B8C9C0] hover:shadow-lg',
                                visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                            )}
                            style={{ transitionDelay: `${200 + i * 80}ms` }}
                        >
                            <div className="mb-4 flex gap-0.5">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm leading-relaxed text-[#52796F]">&ldquo;{t.quote}&rdquo;</p>
                            <div className="mt-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#84A98C] text-xs font-bold text-white">
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#354F52]">{t.name}</p>
                                    <p className="text-xs text-[#52796F]">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
