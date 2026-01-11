'use client';
import { Clock, CheckCircle2, FileText, Users, AlertCircle } from 'lucide-react';
import CalendarView from './components/CalendarView';
import { useAccounts } from '@/hooks/useAccounts';

export default function SchedulePage() {
    const { accounts, isLoading, error } = useAccounts();

    // Helper to get count of connected accounts per platform
    const getPlatformCount = (platform) => accounts.filter(a => a.platform === platform).length;

    const platforms = [
        {
            id: 'facebook',
            name: 'Facebook',
            icon: '📘',
            connected: getPlatformCount('facebook') > 0,
            count: getPlatformCount('facebook'),
            countLabel: 'pages connected',
            colors: { border: 'border-blue-100', hover: 'hover:border-blue-300', bg: '#eff6ff', iconBg: 'bg-blue-500' }
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: '📷',
            connected: getPlatformCount('instagram') > 0,
            count: getPlatformCount('instagram'),
            countLabel: 'accounts linked',
            colors: { border: 'border-pink-100', hover: 'hover:border-pink-300', bg: '#fdf2f8', iconBg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' }
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            icon: '🎵',
            connected: getPlatformCount('tiktok') > 0,
            count: getPlatformCount('tiktok'),
            countLabel: 'accounts linked',
            colors: { border: 'border-gray-100', hover: 'hover:border-gray-300', bg: '#fafafa', iconBg: 'bg-black' }
        },
        {
            id: 'youtube',
            name: 'YouTube',
            icon: '📺',
            connected: getPlatformCount('youtube') > 0,
            count: getPlatformCount('youtube'),
            countLabel: 'channels connected',
            colors: { border: 'border-red-100', hover: 'hover:border-red-300', bg: '#fef2f2', iconBg: 'bg-red-600' }
        }
    ];

    return (
        <div className="space-y-6" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-3">
                    <CalendarView />
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Quick Stats Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">This Week</h3>
                                    <p className="text-xs text-white text-opacity-90">Quick overview</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            {/* Placeholder Stats - Ideally should be dynamic from API */}
                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-700">Scheduled</div>
                                            <div className="text-xs text-gray-500">Ready to post</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold" style={{ color: '#52796F' }}>-</div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-700">Published</div>
                                            <div className="text-xs text-gray-500">Live posts</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">-</div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-100 hover:border-yellow-200 transition-all hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-700">Drafts</div>
                                            <div className="text-xs text-gray-500">In progress</div>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-600">-</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Platform Status Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100"
                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Connected</h3>
                                    <p className="text-xs text-white text-opacity-90">Active platforms</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            {isLoading && <div className="text-center text-sm text-gray-500 py-4">Loading accounts...</div>}
                            {error && <div className="text-center text-sm text-red-500 py-4">Failed to load accounts</div>}

                            {!isLoading && !error && platforms.map(p => (
                                <div key={p.id} className={`group relative overflow-hidden rounded-xl p-4 border-2 transition-all hover:shadow-lg cursor-pointer ${p.connected ? `${p.colors.border} ${p.colors.hover}` : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                                    style={{ background: p.connected ? `linear-gradient(135deg, ${p.colors.bg} 0%, #ffffff 100%)` : '' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${p.connected ? '' : 'opacity-50'} ${p.connected ? p.colors.iconBg : 'bg-gray-400'}`}
                                                style={{ background: p.connected ? '' : '#9ca3af' }}>
                                                <span className={`text-lg ${p.connected ? '' : 'grayscale'}`}>{p.icon}</span>
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${p.connected ? 'text-gray-900' : 'text-gray-500'}`}>{p.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {p.connected ? `${p.count} ${p.countLabel}` : 'Not connected'}
                                                </div>
                                            </div>
                                        </div>
                                        {p.connected ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                                                <span className="text-xs font-semibold text-green-600">Active</span>
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1 bg-gray-200 rounded-lg">
                                                <span className="text-xs font-semibold text-gray-600">Connect</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
