'use client';
import { Button } from '../ui/Button';
import { User, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import Breadcrumb from './Breadcrumb';
import Image from 'next/image';

export default function Topbar({ onToggleSidebar = () => { } }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { logout, user } = useAuthStore((state) => ({ logout: state.logout, user: state.user }));
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-sm sticky top-0 z-30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onToggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                        <Menu className="w-5 h-5 text-gray-700" />
                    </button>
                    <Breadcrumb />
                </div>

                <div className="flex items-center gap-4">
                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1 pl-2 pr-2 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ backgroundColor: '#84A98C' }}>
                                {user?.avatar ? (
                                    <Image src={user.avatar} alt={user.name || 'User'} width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        onClick={() => router.push('/dashboard/settings')}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile Settings
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
