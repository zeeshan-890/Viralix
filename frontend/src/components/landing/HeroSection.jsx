'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import DashboardMockup from './DashboardMockup';
import { PLATFORM_LIST } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';

export default function HeroSection() {
    return (
        <section id="home" className="relative overflow-hidden bg-[#1a2428] pb-20 pt-32 sm:pb-28 sm:pt-40">
            {/* Mesh background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="landing-orb absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#84A98C]/15 blur-[100px]" />
                <div className="landing-orb-delay absolute -right-20 top-20 h-[400px] w-[400px] rounded-full bg-[#52796F]/20 blur-[90px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <div className="landing-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84A98C] opacity-60" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#84A98C]" />
                            </span>
                            AI-powered social media OS
                        </div>

                        <h1 className="landing-fade-up-delay text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                            Create once.
                            <span className="mt-1 block bg-gradient-to-r from-[#84A98C] via-[#a8c4ae] to-[#84A98C] bg-clip-text text-transparent">
                                Publish everywhere.
                            </span>
                        </h1>

                        <p className="landing-fade-up-delay-2 mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
                            Schedule posts, reply with AI, track analytics, and manage Instagram, TikTok, YouTube & Facebook — all from one beautiful dashboard.
                        </p>

                        <div className="landing-fade-up-delay-2 mt-5 flex flex-wrap items-center gap-3">
                            {PLATFORM_LIST.map((p) => (
                                <span
                                    key={p.id}
                                    className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ${p.id === 'instagram' ? '' : ''}`}
                                >
                                    <PlatformIcon platform={p.id} size={16} />
                                    {p.label}
                                </span>
                            ))}
                        </div>

                        <div className="landing-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-3">
                            <Link
                                href="/auth/signup"
                                className="inline-flex items-center gap-2 rounded-full bg-[#84A98C] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#84A98C]/30 transition hover:bg-[#95b89d] hover:shadow-[#84A98C]/50"
                            >
                                Start for free
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                            >
                                <Play className="h-4 w-4 fill-current" />
                                See how it works
                            </a>
                        </div>

                        <div className="landing-fade-up-delay-3 mt-10 flex flex-wrap gap-6 text-sm text-white/45">
                            <span>No credit card</span>
                            <span className="text-white/20">·</span>
                            <span>Free plan available</span>
                            <span className="text-white/20">·</span>
                            <span>Setup in 2 minutes</span>
                        </div>
                    </div>

                    <div className="landing-fade-up-delay-2 lg:pl-4">
                        <DashboardMockup />
                    </div>
                </div>
            </div>
        </section>
    );
}
