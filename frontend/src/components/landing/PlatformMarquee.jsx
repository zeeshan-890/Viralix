'use client';

import { PLATFORM_LIST } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';

function MarqueeTrack() {
    return (
        <>
            {PLATFORM_LIST.map((p) => (
                <div
                    key={p.id}
                    className="mx-6 flex shrink-0 items-center gap-2.5 rounded-full border border-[#E2E8E4] bg-white px-5 py-2.5 shadow-sm"
                >
                    <PlatformIcon platform={p.id} size={16} />
                    <span className="text-sm font-medium text-[#354F52]">{p.label}</span>
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
