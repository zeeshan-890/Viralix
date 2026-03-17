'use client';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
export default function DashboardHeader({ title = "Dashboard", subtitle, showNotifications = true, showSearch = true, showUserMenu = true }) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notifications = [
        { id: 1, message: "New comment on your Instagram post", time: "2 min ago", unread: true },
        { id: 2, message: "Scheduled post published successfully", time: "1 hour ago", unread: true },
        { id: 3, message: "Analytics report ready", time: "3 hours ago", unread: false },
    ];
    const unreadCount = notifications.filter(n => n.unread).length;
    return (<header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Title Section */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {subtitle && (<p className="text-sm text-gray-600 mt-1">{subtitle}</p>)}
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-4">
                    {/* Search */}
                    {showSearch && (<div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                            <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"/>
                        </div>)}

                    {/* Notifications */}
                    {showNotifications && (<div className="relative">
                            <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell className="w-5 h-5"/>
                                {unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadCount}
                                    </span>)}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotificationOpen && (<div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.map((notification) => (<div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notification.unread ? 'bg-blue-50' : ''}`}>
                                                <p className="text-sm text-gray-900">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                            </div>))}
                                    </div>
                                    <div className="p-4 border-t border-gray-200">
                                        <button className="text-sm text-blue-600 hover:text-blue-800">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>)}
                        </div>)}

                    {/* User Menu */}
                    {showUserMenu && (<div className="relative">
                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white"/>
                                </div>
                                <span className="text-sm font-medium hidden md:block">John Doe</span>
                            </button>

                            {/* User Dropdown */}
                            {isUserMenuOpen && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-3 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">John Doe</p>
                                        <p className="text-xs text-gray-500">john@example.com</p>
                                    </div>
                                    <div className="py-1">
                                        <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <Settings className="w-4 h-4 mr-2"/>
                                            Settings
                                        </Link>
                                        <Link href="/dashboard/settings/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <User className="w-4 h-4 mr-2"/>
                                            Profile
                                        </Link>
                                        <button className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                                            <LogOut className="w-4 h-4 mr-2"/>
                                            Sign out
                                        </button>
                                    </div>
                                </div>)}
                        </div>)}
                </div>
            </div>
        </header>);
}
