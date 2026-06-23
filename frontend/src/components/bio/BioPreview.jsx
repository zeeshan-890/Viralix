'use client';

import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

const SOCIAL_ICONS = {
    instagram: '📸', facebook: '📘', twitter: '🐦', tiktok: '🎵', youtube: '▶️', linkedin: '💼', website: '🌐', email: '📧',
};

export default function BioPreview({ profile, theme, buttons, socials }) {
    const btnClass = (style) => {
        if (style === 'pill') return 'rounded-full';
        if (style === 'square') return 'rounded-none';
        if (style === 'shadow') return 'rounded-xl shadow-lg border-b-4 border-black/10';
        return 'rounded-xl';
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-[280px] shrink-0 overflow-hidden rounded-[2rem] border-[6px] border-[#2F3E46] bg-[#2F3E46] shadow-2xl sm:w-[300px]">
                <div className="absolute left-1/2 top-2 z-10 h-1 w-16 -translate-x-1/2 rounded-full bg-black/30" />
                <div
                    className="h-[520px] overflow-y-auto"
                    style={{ background: theme.background, color: theme.textColor, fontFamily: theme.font || 'Inter, sans-serif' }}
                >
                    <div className="flex min-h-full flex-col items-center p-6 pt-8">
                        <div className="mb-5 text-center">
                            {profile.image ? (
                                <img
                                    src={profile.image}
                                    alt=""
                                    className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-white/20 object-cover shadow-md"
                                />
                            ) : (
                                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl">👤</div>
                            )}
                            <h2 className="text-base font-bold leading-tight">{profile.title || 'My Page'}</h2>
                            <p className="mt-1 whitespace-pre-wrap text-xs opacity-80">{profile.bio}</p>
                        </div>

                        {socials?.length > 0 && (
                            <div className="mb-5 flex flex-wrap justify-center gap-2">
                                {socials.filter((s) => s.isVisible !== false).map((s, i) => (
                                    <span key={i} className="rounded-full bg-white/10 px-2 py-1 text-sm">
                                        {SOCIAL_ICONS[s.platform] || '🔗'}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="w-full space-y-2.5 pb-6">
                            {buttons.filter((b) => b.isVisible !== false).map((btn, i) => (
                                <div
                                    key={btn._id || i}
                                    className={cn(
                                        'w-full py-3 px-4 text-center text-sm font-medium transition hover:scale-[1.02]',
                                        btnClass(theme.buttonStyle),
                                        btn.animation === 'pulse' && 'animate-pulse'
                                    )}
                                    style={{ background: theme.buttonColor, color: theme.buttonTextColor }}
                                >
                                    {btn.label}
                                </div>
                            ))}
                            {buttons.filter((b) => b.isVisible !== false).length === 0 && (
                                <div className="rounded-xl border border-dashed border-white/20 py-6 text-center text-xs opacity-50">
                                    Add links to preview
                                </div>
                            )}
                        </div>

                        <p className="mt-auto text-[0.5625rem] opacity-40">Powered by Viralix</p>
                    </div>
                </div>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs text-[#52796F]">
                <ExternalLink className="h-3 w-3" />
                Live preview
            </p>
        </div>
    );
}

export { SOCIAL_ICONS };
