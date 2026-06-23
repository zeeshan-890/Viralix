'use client';

import { BarChart3, Calendar, Inbox, Sparkles, TrendingUp } from 'lucide-react';

const BARS = [42, 68, 55, 82, 71, 94, 78];

export default function DashboardMockup() {
    return (
        <div className="landing-animate relative mx-auto w-full max-w-lg">
            {/* Floating cards */}
            <div className="landing-float absolute -left-6 top-8 z-20 hidden rounded-xl border border-white/10 bg-[#2F3E46]/90 px-3 py-2 shadow-xl backdrop-blur-sm sm:block">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[0.625rem] text-white/50">Engagement</p>
                        <p className="text-xs font-semibold text-white">+34% this week</p>
                    </div>
                </div>
            </div>

            <div className="landing-float-delay absolute -right-4 top-24 z-20 hidden rounded-xl border border-white/10 bg-[#2F3E46]/90 px-3 py-2 shadow-xl backdrop-blur-sm sm:block">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#84A98C]/30">
                        <Sparkles className="h-3.5 w-3.5 text-[#84A98C]" />
                    </div>
                    <div>
                        <p className="text-[0.625rem] text-white/50">AI caption ready</p>
                        <p className="text-xs font-semibold text-white">3 variants generated</p>
                    </div>
                </div>
            </div>

            {/* Main window */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1e2a2e] shadow-2xl shadow-black/40 ring-1 ring-white/5">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                    <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="ml-2 text-[0.6875rem] text-white/40">viralix.dev/dashboard</span>
                </div>

                <div className="flex">
                    {/* Mini sidebar */}
                    <div className="hidden w-14 shrink-0 flex-col gap-3 border-r border-white/5 bg-[#2F3E46] p-3 sm:flex">
                        {[Calendar, BarChart3, Inbox, Sparkles].map((Icon, i) => (
                            <div
                                key={i}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? 'bg-[#84A98C]/30 text-[#84A98C]' : 'text-white/40'}`}
                            >
                                <Icon className="h-4 w-4" />
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                        <div className="mb-4 grid grid-cols-3 gap-2">
                            {[
                                { label: 'Scheduled', val: '12', color: 'text-amber-400' },
                                { label: 'Published', val: '48', color: 'text-emerald-400' },
                                { label: 'Reach', val: '24K', color: 'text-[#84A98C]' },
                            ].map((s) => (
                                <div key={s.label} className="rounded-xl bg-white/5 px-2 py-2">
                                    <p className="text-[0.625rem] text-white/40">{s.label}</p>
                                    <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Animated chart */}
                        <div className="rounded-xl bg-white/5 p-3">
                            <p className="mb-2 text-[0.625rem] font-medium text-white/50">Weekly performance</p>
                            <div className="flex h-20 items-end gap-1.5">
                                {BARS.map((h, i) => (
                                    <div
                                        key={i}
                                        className="landing-bar-grow flex-1 rounded-sm bg-gradient-to-t from-[#52796F] to-[#84A98C]"
                                        style={{
                                            height: `${h}%`,
                                            animationDelay: `${i * 80}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Post rows */}
                        <div className="mt-3 space-y-2">
                            {['Summer launch reel', 'Product tips carousel'].map((title, i) => (
                                <div key={title} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                                    <div className={`h-8 w-8 shrink-0 rounded-md ${i === 0 ? 'bg-gradient-to-br from-pink-500/40 to-purple-500/40' : 'bg-gradient-to-br from-blue-500/40 to-cyan-500/40'}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[0.6875rem] font-medium text-white/80">{title}</p>
                                        <p className="text-[0.625rem] text-white/35">{i === 0 ? 'Today · 6:00 PM' : 'Thu · 10:00 AM'}</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[0.5625rem] font-medium text-emerald-400">
                                        {i === 0 ? 'Scheduled' : 'Draft'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
