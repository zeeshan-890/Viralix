'use client';

import { Facebook, Instagram, Music2, Youtube } from 'lucide-react';

const PLATFORMS = [
    { name: 'Instagram', icon: Instagram, color: '#E4405F' },
    { name: 'TikTok', icon: Music2, color: '#010101' },
    { name: 'YouTube', icon: Youtube, color: '#FF0000' },
    { name: 'Facebook', icon: Facebook, color: '#1877F2' },
];

function MarqueeTrack() {
    return (
        <>
            {PLATFORMS.map((p) => (
                <div
                    key={p.name}
                    className="mx-6 flex shrink-0 items-center gap-2.5 rounded-full border border-[#E2E8E4] bg-white px-5 py-2.5 shadow-sm"
                >
                    <p.icon className="h-4 w-4" style={{ color: p.color }} />
                    <span className="text-sm font-medium text-[#354F52]">{p.name}</span>
                </div>
            ))}
        </>
    );
}

export default function PlatformMarquee() {
    return (
        <section className="border-y border-[#E2E8E4] bg-[#F7FAF8] py-5">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#52796F]">
                Publish to every platform you use
            </p>
            <div className="landing-marquee-mask overflow-hidden">
                <div className="landing-marquee flex w-max">
                    <MarqueeTrack />
                    <MarqueeTrack />
                    <MarqueeTrack />
                </div>
            </div>
        </section>
    );
}
