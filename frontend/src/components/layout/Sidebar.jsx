'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Upload,
    Eye,
    Calendar,
    BarChart3,
    Link2,
    Settings,
    ChevronDown,
    ChevronRight,
    Layers,
    MessageSquare,
    LayoutTemplate
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Image from 'next/image';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Preview', href: '/dashboard/preview', icon: Eye },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
    { name: 'Bio Link', href: '/dashboard/bio', icon: LayoutTemplate },
    {
        name: 'Platforms',
        href: '/dashboard/platforms',
        icon: Layers,
        subItems: [
            { name: 'All Platforms', href: '/dashboard/platforms' },
            { name: 'Instagram', href: '/dashboard/platforms/instagram' },
            { name: 'TikTok', href: '/dashboard/platforms/tiktok' },
            { name: 'YouTube', href: '/dashboard/platforms/youtube' },
            { name: 'Facebook', href: '/dashboard/platforms/facebook' },
        ]
    },
    { name: 'Connect Accounts', href: '/dashboard/connect-accounts', icon: Link2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ open = false, onClose = () => { } }) {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const [expandedItems, setExpandedItems] = useState([]);
    const toggleExpanded = (itemName) => {
        setExpandedItems(prev => prev.includes(itemName)
            ? prev.filter(name => name !== itemName)
            : [...prev, itemName]);
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            {/* Sidebar panel */}
            <div className={`fixed md:fixed top-0 left-0 h-full md:h-screen w-72 md:w-64 z-50 transform transition-transform md:transition-none flex flex-col ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                style={{ background: 'linear-gradient(to bottom, #2F3E46, #354F52)' }}>
                {/* Logo */}
                <div className="p-6 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" className='w-10 h-10 rounded-full' alt="Viralix Logo" />
                        <h1 className="text-xl font-bold text-white">Viralix</h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const isExpanded = expandedItems.includes(item.name);

                        return (
                            <div key={item.name}>
                                {item.subItems ? (
                                    <div>
                                        <button
                                            onClick={() => toggleExpanded(item.name)}
                                            className={cn(
                                                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                                            )}
                                            style={isActive ? { backgroundColor: '#84A98C' } : {}}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5" />
                                                {item.name}
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                        {isExpanded && (
                                            <div className="ml-6 mt-1 space-y-1">
                                                {item.subItems.map((subItem) => (
                                                    <Link
                                                        key={subItem.name}
                                                        href={subItem.href}
                                                        className={cn(
                                                            'flex items-center px-3 py-2 rounded-lg text-sm transition-all',
                                                            pathname === subItem.href
                                                                ? 'text-white bg-white/20'
                                                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                                        )}
                                                    >
                                                        {subItem.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                            isActive
                                                ? 'text-white'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                        )}
                                        style={isActive ? { backgroundColor: '#84A98C' } : {}}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ backgroundColor: '#84A98C' }}>
                            {user?.profilePicture ? (
                                <Image src={user.profilePicture} alt={user.name || 'User'} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email || 'Free Plan'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
