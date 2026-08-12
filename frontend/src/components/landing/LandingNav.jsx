'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
    { href: '#home', label: 'Home', id: 'home' },
    { href: '#features', label: 'Features', id: 'features' },
    { href: '#ai', label: 'AI Studio', id: 'ai' },
    { href: '#how-it-works', label: 'How it works', id: 'how-it-works' },
    { href: '#pricing', label: 'Pricing', id: 'pricing' },
];

export default function LandingNav() {
    const [active, setActive] = useState('home');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const sectionIds = LINKS.map((l) => l.id);
        const elements = sectionIds
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        if (!elements.length) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]?.target.id) setActive(visible[0].target.id);
            },
            { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <header className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:top-5 sm:px-6">
            <div className="pointer-events-auto mx-auto max-w-5xl">
                {/* Floating pill navbar */}
                <div className="flex items-center justify-between gap-3 rounded-full bg-white px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] sm:px-5 sm:py-2.5">
                    {/* Logo */}
                    <Link href="/" className="flex shrink-0 items-center gap-2 pl-1">
                        <img src="/logo.png" alt="Viralix" className="h-9 w-9 rounded-full sm:h-10 sm:w-10" />
                        <span className="hidden text-base font-bold tracking-tight text-[#354F52] sm:inline">
                            Viralix
                        </span>
                    </Link>

                    {/* Center links — desktop */}
                    <nav className="hidden items-center gap-0.5 lg:flex">
                        {LINKS.map((link) => (
                            <a
                                key={link.id}
                                href={link.href}
                                className={cn(
                                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                                    active === link.id
                                        ? 'bg-[#84A98C]/15 text-[#354F52]'
                                        : 'text-[#64748B] hover:text-[#354F52]'
                                )}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            href="/auth/login"
                            className="hidden rounded-xl bg-gradient-to-r from-[#52796F] via-[#6b8f78] to-[#84A98C] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#52796F]/20 transition hover:shadow-lg hover:brightness-105 sm:inline-flex"
                        >
                            Login
                        </Link>

                        <button
                            type="button"
                            className="rounded-full p-2 text-[#354F52] lg:hidden"
                            onClick={() => setOpen((v) => !v)}
                            aria-label={open ? 'Close menu' : 'Open menu'}
                        >
                            {open ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Menu className="h-6 w-6" strokeWidth={1.75} />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {open && (
                    <div className="mt-2 overflow-hidden rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04] lg:hidden">
                        <nav className="flex flex-col gap-0.5">
                            {LINKS.map((link) => (
                                <a
                                    key={link.id}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        'rounded-xl px-4 py-2.5 text-sm font-medium transition',
                                        active === link.id
                                            ? 'bg-[#84A98C]/15 text-[#354F52]'
                                            : 'text-[#64748B] hover:bg-[#F7FAF8]'
                                    )}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                        <div className="mt-2 border-t border-[#E2E8E4] pt-3">
                            <Link
                                href="/auth/login"
                                onClick={() => setOpen(false)}
                                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#52796F] to-[#84A98C] py-2.5 text-sm font-semibold text-white"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
