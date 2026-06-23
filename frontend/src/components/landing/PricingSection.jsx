'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from './useInView';

const PLANS = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Perfect for getting started',
        features: ['2 connected accounts', 'Basic scheduler', 'Limited AI hashtags', '7-day analytics'],
        cta: 'Start free',
        popular: false,
    },
    {
        name: 'Pro',
        price: '$19',
        period: '/month',
        description: 'For serious creators',
        features: ['Unlimited accounts', 'Full AI studio', 'Advanced analytics', 'Unified inbox', 'Auto-reply rules'],
        cta: 'Get Pro',
        popular: true,
    },
    {
        name: 'Agency',
        price: '$49',
        period: '/month',
        description: 'For teams & agencies',
        features: ['Everything in Pro', 'Team collaboration', 'Bulk scheduling', 'Priority support', 'White-label reports'],
        cta: 'Contact sales',
        popular: false,
    },
];

export default function PricingSection() {
    const { ref, visible } = useInView();

    return (
        <section id="pricing" className="bg-[#F7FAF8] py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={cn('mb-14 text-center transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#84A98C]">Pricing</p>
                    <h2 className="text-3xl font-bold tracking-tight text-[#354F52] sm:text-4xl">
                        Simple, transparent pricing
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-[#52796F]">
                        Start free. Upgrade when you&apos;re ready to scale.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3 md:items-start">
                    {PLANS.map((plan, i) => (
                        <div
                            key={plan.name}
                            className={cn(
                                'relative rounded-2xl border bg-white p-7 transition-all duration-700',
                                plan.popular
                                    ? 'border-[#84A98C] shadow-xl shadow-[#84A98C]/10 md:-translate-y-2'
                                    : 'border-[#E2E8E4] hover:border-[#B8C9C0]',
                                visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            )}
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#84A98C] px-3 py-0.5 text-xs font-semibold text-white">
                                    Most popular
                                </span>
                            )}
                            <h3 className="text-lg font-semibold text-[#354F52]">{plan.name}</h3>
                            <p className="mt-1 text-sm text-[#52796F]">{plan.description}</p>
                            <div className="mt-5 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-[#354F52]">{plan.price}</span>
                                <span className="text-sm text-[#52796F]">{plan.period}</span>
                            </div>
                            <ul className="mt-6 space-y-3">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#52796F]">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#84A98C]" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/auth/signup"
                                className={cn(
                                    'mt-7 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition',
                                    plan.popular
                                        ? 'bg-[#84A98C] text-white shadow-lg shadow-[#84A98C]/25 hover:bg-[#95b89d]'
                                        : 'border border-[#B8C9C0] text-[#354F52] hover:bg-[#F7FAF8]'
                                )}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
