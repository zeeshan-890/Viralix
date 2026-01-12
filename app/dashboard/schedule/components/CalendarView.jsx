'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { postsAPI } from '@/lib/api';

import { useRouter } from 'next/navigation';

export default function CalendarView() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [posts, setPosts] = useState([]);

    // Modal state removed


    const month = currentDate.getMonth() + 1; // 1-based
    const year = currentDate.getFullYear();

    useEffect(() => {
        loadPosts();
    }, [month, year]);

    const loadPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await postsAPI.list({ month, year, limit: 200 });
            setPosts(response.data?.posts || []);
        } catch (e) {
            setError(e?.response?.data?.message || e.message || 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const openNewPostModal = () => {
        router.push('/dashboard/upload');
    };

    const openEditPostModal = (post) => {
        router.push(`/dashboard/preview/${post._id}`);
    };
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        return days;
    };
    const formatMonth = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };
    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            }
            else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };
    const isToday = (day) => {
        if (!day)
            return false;
        const today = new Date();
        return (day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear());
    };
    const postsByDay = useMemo(() => {
        const map = new Map();
        for (const p of posts) {
            if (!p.scheduledDate) continue;
            const d = new Date(p.scheduledDate);
            if (d.getMonth() !== currentDate.getMonth() || d.getFullYear() !== currentDate.getFullYear()) continue;
            const day = d.getDate();
            if (!map.has(day)) map.set(day, []);
            map.get(day).push(p);
        }
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
            map.set(k, arr);
        }
        return map;
    }, [posts, currentDate]);
    const getPlatformIcon = (platform) => {
        const icons = {
            tiktok: '/tiktok.png',
            youtube: '/youtube.png',
            instagram: '/instagram.png',
            facebook: '/facebook.png',
        };

        if (icons[platform]) {
            return (
                <Image
                    src={icons[platform]}
                    alt={platform}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                />
            );
        }

        const fallbackIcons = {
            linkedin: '💼',
            twitter: '🐦'
        };
        return fallbackIcons[platform] || '📱';
    };
    const getStatusColor = (status) => {
        const colors = {
            scheduled: 'bg-blue-100 text-blue-800',
            published: 'bg-green-100 text-green-800',
            draft: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };
    return (<div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
        {/* Calendar Header */}
        <div className="px-6 py-5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {formatMonth(currentDate)}
                        </h2>
                        <p className="text-sm text-white text-opacity-90">Manage your content schedule</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/20 shadow-lg hover:scale-110">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-5 py-2.5 text-sm font-bold rounded-xl bg-white text-gray-900 hover:shadow-2xl transition-all hover:scale-105">
                        Today
                    </button>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/20 shadow-lg hover:scale-110">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-white/20">
                {['month', 'week', 'day'].map((mode) => (<button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === mode
                    ? 'bg-white text-gray-900 shadow-lg scale-105'
                    : 'text-white hover:bg-white/10'}`}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>))}
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-3 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 xs:grid-cols-7 gap-1 sm:gap-2 mb-3 text-[11px] sm:text-sm">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (<div key={day} className="p-3 text-center text-sm font-bold rounded-xl shadow-sm"
                    style={{
                        background: idx === 0 || idx === 6
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        color: idx === 0 || idx === 6 ? '#92400e' : '#4b5563'
                    }}>
                    {day}
                </div>))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
                {getDaysInMonth(currentDate).map((day, index) => {
                    const isWeekend = index % 7 === 0 || index % 7 === 6;
                    return (
                        <div
                            key={index}
                            className={`min-h-[110px] sm:min-h-[140px] rounded-2xl p-2 sm:p-3 transition-all ${day
                                ? 'bg-white border-2 hover:border-gray-300 hover:shadow-xl cursor-pointer transform hover:scale-105'
                                : 'bg-transparent border-2 border-transparent'
                                }`}
                            style={day ? {
                                borderColor: isToday(day) ? '#84A98C' : isWeekend ? '#fed7aa' : '#e5e7eb',
                                boxShadow: isToday(day) ? '0 4px 20px rgba(132, 169, 140, 0.3)' : ''
                            } : {}}>
                            {day && (<>
                                <div className={`text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 flex items-center justify-center transition-all ${isToday(day)
                                    ? 'w-8 h-8 rounded-full text-white shadow-lg scale-110'
                                    : 'text-gray-900'
                                    }`}
                                    style={isToday(day) ? {
                                        background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)'
                                    } : {}}>
                                    {day}
                                </div>

                                {/* Posts for this day */}
                                <div className="space-y-2">
                                    {(postsByDay.get(day) || []).slice(0, 3).map((post) => {
                                        const d = new Date(post.scheduledDate);
                                        const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                        let agg = 'draft';
                                        const statuses = (post.platforms || []).map(p => p.status);
                                        if (statuses.includes('failed')) agg = 'failed';
                                        else if (statuses.includes('processing')) agg = 'processing';
                                        else if (statuses.includes('scheduled')) agg = 'scheduled';
                                        else if (statuses.includes('published')) agg = 'published';
                                        const platforms = (post.platforms || []).map(p => p.name);

                                        const statusColors = {
                                            scheduled: { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '#3b82f6', text: '#1e40af' },
                                            published: { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '#10b981', text: '#065f46' },
                                            draft: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#f59e0b', text: '#92400e' },
                                            failed: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '#ef4444', text: '#991b1b' },
                                            processing: { bg: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)', border: '#a855f7', text: '#6b21a8' }
                                        };
                                        const colors = statusColors[agg] || statusColors.draft;

                                        return (
                                            <div
                                                key={post._id}
                                                className="text-[11px] sm:text-xs p-2 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
                                                style={{
                                                    background: colors.bg,
                                                    borderColor: colors.border
                                                }}
                                                onClick={() => openEditPostModal(post)}
                                            >
                                                <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                                                    {platforms.map((platform) => (
                                                        <span key={platform} className="text-sm">
                                                            {getPlatformIcon(platform)}
                                                        </span>
                                                    ))}
                                                    <span className="font-bold ml-auto text-xs" style={{ color: colors.text }}>{time}</span>
                                                </div>
                                                <div className="text-gray-800 font-semibold truncate text-[11px] sm:text-xs mb-1">{post.title}</div>
                                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm"
                                                    style={{
                                                        background: colors.bg,
                                                        color: colors.text,
                                                        border: `1px solid ${colors.border}`
                                                    }}>
                                                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.border }}></div>
                                                    {agg}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(postsByDay.get(day) || []).length > 3 && (
                                        <div className="text-xs text-center py-1.5 px-2 bg-gray-100 rounded-lg font-semibold text-gray-600 border border-gray-200">
                                            +{(postsByDay.get(day) || []).length - 3} more
                                        </div>
                                    )}
                                </div>
                            </>)}
                        </div>
                    );
                })}
            </div>
            {loading && (
                <div className="mt-6 flex items-center justify-center gap-3 p-5 rounded-2xl shadow-lg border-2 border-gray-200"
                    style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#84A98C' }} />
                    <span className="text-sm font-bold text-gray-700">Loading posts...</span>
                </div>
            )}
            {error && (
                <div className="mt-6 p-5 rounded-2xl border-2 border-red-300 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                    <span className="text-sm font-bold text-red-800">{error}</span>
                </div>
            )}
        </div>

        {/* New Post Button */}
        <div className="px-6 pb-6 pt-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <button
                onClick={openNewPostModal}
                className="w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}
            >
                <Plus className="w-6 h-6" />
                <span className="text-lg">Create New Post</span>
            </button>
        </div>

    </div>);
}
