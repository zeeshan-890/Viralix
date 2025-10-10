'use client';
import { Button } from '../ui/Button';
import { Search, Bell, User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';

export default function Topbar({ onToggleSidebar = () => { } }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const logout = useAuthStore((state) => state.logout);
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
                    <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#354F52' }}>Dashboard</h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative hidden sm:block">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-56 md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                            style={{
                                focusRing: '#84A98C',
                                '--tw-ring-color': '#84A98C'
                            }}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 block h-2 w-2 rounded-full" style={{ backgroundColor: '#84A98C' }}></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#84A98C' }}>
                                U
                            </div>
                            <span className="text-sm font-medium" style={{ color: '#354F52' }}>Account</span>
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <button
                                    onClick={() => router.push('/dashboard/settings')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </button>
                                <hr className="my-2 border-gray-200" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
