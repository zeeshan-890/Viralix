'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { NAV_SECTIONS, isNavItemActive } from '../../config/navigation';
import { useAuthStore } from '../../store/authStore';
import Image from 'next/image';

export default function Sidebar({ open = false, onClose = () => {} }) {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const [expandedSections, setExpandedSections] = useState(() => NAV_SECTIONS.map((s) => s.id));

    const toggleSection = (id) => {
        setExpandedSections((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 flex h-full w-[15.5rem] flex-col border-r transition-transform md:translate-x-0',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
                style={{
                    background: 'linear-gradient(180deg, #2F3E46 0%, #354F52 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                }}
            >
                {/* Brand */}
                <div
                    className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <img src="/logo.png" className="h-8 w-8 rounded-full" alt="Viralix" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">Viralix</p>
                        <p className="truncate text-[11px] text-white/50">Social workspace</p>
                    </div>
                </div>

                {/* Section navigation */}
                <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-3">
                    {NAV_SECTIONS.map((section) => {
                        const isExpanded = expandedSections.includes(section.id);
                        const sectionActive = section.items.some((item) =>
                            isNavItemActive(pathname, item)
                        );

                        return (
                            <div key={section.id} className="mb-1">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.id)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors',
                                        sectionActive ? 'text-white/90' : 'text-white/45 hover:text-white/70'
                                    )}
                                >
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                                        {section.label}
                                    </span>
                                    <span className="text-[11px] text-white/40">{isExpanded ? '−' : '+'}</span>
                                </button>

                                {isExpanded && (
                                    <ul className="mt-0.5 space-y-0.5 pb-2">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isNavItemActive(pathname, item);
                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={onClose}
                                                        className={cn(
                                                            'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all',
                                                            active
                                                                ? 'text-white shadow-sm'
                                                                : 'text-white/65 hover:bg-[var(--viralix-surface)]/8 hover:text-white'
                                                        )}
                                                        style={active ? { backgroundColor: '#84A98C' } : undefined}
                                                    >
                                                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />}
                                                        <span className="truncate">{item.name}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User */}
                <div
                    className="shrink-0 border-t p-3"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2 py-2">
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: '#84A98C' }}
                        >
                            {user?.profilePicture ? (
                                <Image
                                    src={user.profilePicture}
                                    alt={user.name || 'User'}
                                    width={32}
                                    height={32}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{user?.name || 'User'}</p>
                            <p className="truncate text-[11px] text-white/45">{user?.email || 'demo@viralix.dev'}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
