'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from './useInView';

export default function CtaBanner() {
    const { ref, visible } = useInView();

    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div
                    ref={ref}
                    className={cn(
                        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#354F52] via-[#2F3E46] to-[#1a2428] px-8 py-16 text-center sm:px-16 sm:py-20 transition-all duration-700',
                        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    )}
                >
                    <div className="landing-orb pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#84A98C]/20 blur-[80px]" />
                    <div className="landing-orb-delay pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#52796F]/20 blur-[80px]" />

                    <div className="relative">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ready to grow on autopilot?
                        </h2>
                        <p className="mx-auto mt-4 max-w-lg text-white/60">
                            Join creators who schedule smarter, reply faster, and track everything in one place.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#354F52] shadow-xl transition hover:bg-white/90"
                        >
                            Get started — it&apos;s free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
