'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '../../hooks/useNavigation';
import { isTopLinkActive } from '../../config/navigation';
import { cn } from '../../lib/utils';
import Image from 'next/image';
import Breadcrumb from './Breadcrumb';

function SectionTabLink({ link }) {
    const pathname = usePathname();
    const active = isTopLinkActive(pathname, link);

    return (
        <Link
            href={link.href}
            className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                active
                    ? 'text-white'
                    : 'text-[#52796F] hover:bg-white hover:text-[#2F3E46]'
            )}
            style={active ? { backgroundColor: '#84A98C' } : undefined}
        >
            {link.name}
        </Link>
    );
}

export default function Topbar({ onToggleSidebar = () => {} }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const { sectionTitle, topLinks } = useNavigation();

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <header
            className="sticky top-0 z-30 shrink-0 border-b bg-white"
            style={{ borderColor: '#E2E8E4' }}
        >
            <div className="flex h-12 items-center justify-between gap-3 px-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="rounded-md p-1.5 text-[#354F52] hover:bg-[#F7FAF8] md:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-4 w-4" />
                    </button>
                    <div className="flex min-w-0 flex-col gap-0.5">
                    <h1 className="truncate text-sm font-semibold" style={{ color: '#2F3E46' }}>
                        {sectionTitle}
                    </h1>
                    <Breadcrumb />
                </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        className="hidden rounded-md p-1.5 text-[#52796F] hover:bg-[#F7FAF8] sm:inline-flex"
                        aria-label="Search"
                    >
                        <Search className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        className="relative rounded-md p-1.5 text-[#52796F] hover:bg-[#F7FAF8]"
                        aria-label="Notifications"
                    >
                        <Bell className="h-3.5 w-3.5" />
                        <span
                            className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: '#84A98C' }}
                        />
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-1.5 rounded-full border border-transparent py-0.5 pl-0.5 pr-1.5 hover:border-[#E2E8E4] hover:bg-[#F7FAF8]"
                        >
                            <div
                                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white"
                                style={{ backgroundColor: '#84A98C' }}
                            >
                                {user?.profilePicture ? (
                                    <Image
                                        src={user.profilePicture}
                                        alt={user.name || 'User'}
                                        width={28}
                                        height={28}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            <ChevronDown className="h-3 w-3 text-[#52796F]" />
                        </button>

                        {showUserMenu && (
                            <div
                                className="absolute right-0 mt-1.5 w-52 overflow-hidden rounded-lg border bg-white py-1 shadow-lg"
                                style={{ borderColor: '#E2E8E4' }}
                            >
                                <div
                                    className="border-b px-3 py-2"
                                    style={{ borderColor: '#E2E8E4', backgroundColor: '#F7FAF8' }}
                                >
                                    <p className="truncate text-xs font-semibold text-[#2F3E46]">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="truncate text-[11px] text-[#52796F]">
                                        {user?.email || 'demo@viralix.dev'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        router.push('/dashboard/settings');
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#354F52] hover:bg-[#F7FAF8]"
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                    Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {topLinks.length > 0 && (
                <div
                    className="tabs-scroll flex h-9 items-center gap-1 overflow-x-auto border-t px-4 sm:px-5"
                    style={{ borderColor: '#E2E8E4', backgroundColor: '#FAFCFB' }}
                >
                    {topLinks.map((link) => (
                        <SectionTabLink key={`${link.href}-${link.name}`} link={link} />
                    ))}
                </div>
            )}
        </header>
    );
}
