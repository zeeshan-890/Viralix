import Link from 'next/link';
import { PLATFORM_LIST } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';

export default function LandingFooter() {
    const links = {
        Product: [
            { label: 'Features', href: '/#features' },
            { label: 'Pricing', href: '/#pricing' },
            { label: 'How it works', href: '/#how-it-works' },
        ],
        Resources: [
            { label: 'Instagram Guide', href: '/guide/instagram-linking' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
        ],
    };

    return (
        <footer className="border-t border-[#E2E8E4] bg-white">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Viralix" className="h-8 w-8 rounded-full" />
                            <span className="text-lg font-semibold text-[#354F52]">Viralix</span>
                        </div>
                        <p className="mt-3 max-w-sm text-sm text-[#52796F]">
                            The all-in-one social media workspace for creators and brands.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {PLATFORM_LIST.map((p) => (
                                <span
                                    key={p.id}
                                    className={`inline-flex items-center gap-1.5 rounded-full border border-[#E2E8E4] px-3 py-1.5 text-xs font-medium text-[#354F52] ${p.lightBg}`}
                                >
                                    <PlatformIcon platform={p.id} size={14} />
                                    {p.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    {Object.entries(links).map(([title, items]) => (
                        <div key={title}>
                            <h4 className="text-sm font-semibold text-[#354F52]">{title}</h4>
                            <ul className="mt-3 space-y-2">
                                {items.map((item) => (
                                    <li key={item.href}>
                                        <Link href={item.href} className="text-sm text-[#52796F] hover:text-[#354F52]">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-10 border-t border-[#E2E8E4] pt-6 text-center text-xs text-[#94A3B8]">
                    © {new Date().getFullYear()} Viralix. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
