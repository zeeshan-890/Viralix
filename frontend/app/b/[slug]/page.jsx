'use client';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bioPagesAPI } from '@/lib/api';

export default function PublicBioPage({ params }) {
    const { slug } = params;
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await bioPagesAPI.getPublic(slug);
                setPage(res.data);
            } catch (e) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    const handleClick = async (buttonId, url) => {
        try {
            await bioPagesAPI.trackClick(page._id, buttonId);
        } catch (_) { }
        window.open(url, '_blank');
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>;
    if (error || !page) return notFound();

    const { theme, profile, buttons, socials } = page;

    return (
        <div className="min-h-screen w-full flex flex-col items-center py-12 px-4 transition-colors duration-500 overflow-x-hidden"
            style={{
                background: theme.background,
                color: theme.textColor,
                fontFamily: theme.font || 'Inter, sans-serif'
            }}>

            <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center">
                {/* Profile Section */}
                <div className="mb-8 text-center animate-fade-in-up">
                    {profile.image && (
                        <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white/20 shadow-lg">
                            <img src={profile.image} alt={profile.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold mb-2 tracking-tight">{profile.title}</h1>
                    <p className="text-sm opacity-90 whitespace-pre-line leading-relaxed max-w-xs mx-auto">{profile.bio}</p>
                </div>

                {/* Social Icons */}
                {socials && socials.length > 0 && (
                    <div className="flex gap-4 justify-center mb-8 flex-wrap">
                        {socials.filter(s => s.isVisible).map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                className="text-2xl hover:scale-110 transition-transform opacity-80 hover:opacity-100 p-2">
                                {/* Simple icon mapping or generic fallback */}
                                {s.platform === 'instagram' && '📸'}
                                {s.platform === 'facebook' && '📘'}
                                {s.platform === 'twitter' && '🐦'}
                                {s.platform === 'tiktok' && '🎵'}
                                {s.platform === 'youtube' && '▶️'}
                                {s.platform === 'linkedin' && '💼'}
                                {s.platform === 'website' && '🌐'}
                                {s.platform === 'email' && '📧'}
                            </a>
                        ))}
                    </div>
                )}

                {/* Links */}
                <div className="w-full space-y-4">
                    {buttons.filter(b => b.isVisible).map((btn) => (
                        <div key={btn._id}
                            onClick={() => handleClick(btn._id, btn.url)}
                            className={`
                                w-full py-4 px-6 text-center font-semibold cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md
                                ${theme.buttonStyle === 'rounded' ? 'rounded-xl' : theme.buttonStyle === 'pill' ? 'rounded-full' : theme.buttonStyle === 'shadow' ? 'rounded-xl shadow-lg border-b-4 border-black/10' : 'rounded-none'}
                                ${btn.animation === 'pulse' ? 'animate-pulse' : btn.animation === 'shake' ? 'animate-shake' : ''}
                            `}
                            style={{
                                backgroundColor: theme.buttonColor,
                                color: theme.buttonTextColor
                            }}>
                            {btn.icon && <span className="mr-2">{btn.icon}</span>}
                            {btn.label}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 opacity-50 text-xs font-medium">
                    Powered by <a href="/" className="underline hover:opacity-100 transition-opacity">Viralix</a>
                </div>
            </div>

            {/* Background effects (optional based on theme) */}
            {theme.id.includes('gradient') && (
                <div className="fixed inset-0 pointer-events-none opacity-30 bg-noise mix-blend-overlay"></div>
            )}
        </div>
    );
}
