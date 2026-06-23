import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const FOOTER_LINKS = {
    Product: [
        { label: 'Features', href: '#features' },
        { label: 'AI Studio', href: '#ai' },
        { label: 'Pricing', href: '#pricing' },
    ],
    Support: [
        { label: 'Instagram Guide', href: '/guide/instagram-linking' },
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Data Deletion', href: '/data-deletion' },
    ],
};

export default function LandingFooter() {
    return (
        <footer className="border-t border-white/5 bg-[#1a2428]">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.png" alt="Viralix" className="h-9 w-9 rounded-full" />
                            <span className="text-lg font-semibold text-white">Viralix</span>
                        </div>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
                            AI-powered social media management for creators, brands, and agencies.
                        </p>
                        <div className="mt-5 flex gap-4">
                            {[Facebook, Instagram, Twitter].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    aria-label="Social link"
                                    className="text-white/35 transition hover:text-white/70"
                                >
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="text-sm font-semibold text-white">{title}</h3>
                            <ul className="mt-4 space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        {link.href.startsWith('#') ? (
                                            <a href={link.href} className="text-sm text-white/45 transition hover:text-white/80">
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link href={link.href} className="text-sm text-white/45 transition hover:text-white/80">
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-white/30">
                    © {new Date().getFullYear()} Viralix. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
