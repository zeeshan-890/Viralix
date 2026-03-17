'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { postsAPI } from '@/lib/api';

import { useRouter } from 'next/navigation';

export default function CalendarView({ onStatsChange = () => { } }) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [posts, setPosts] = useState([]);

    const month = currentDate.getMonth() + 1; // 1-based
    const year = currentDate.getFullYear();

    useEffect(() => {
        loadPosts();
    }, [month, year]);

    // Calculate stats whenever posts, viewMode, or currentDate changes
    useEffect(() => {
        if (!posts.length) {
            onStatsChange({ scheduled: 0, published: 0, title: getHeaderTitle() });
            return;
        }

        let filteredPosts = [];
        const startOfView = getStartDateForView();
        const endOfView = getEndDateForView();

        filteredPosts = posts.filter(post => {
            if (!post.scheduledDate) return false;
            const d = new Date(post.scheduledDate);
            return d >= startOfView && d <= endOfView;
        });

        const stats = filteredPosts.reduce((acc, post) => {
            const statuses = (post.platforms || []).map(p => p.status);
            // Count as visible if it has at least one valid status
            if (statuses.includes('published')) acc.published++;
            else if (statuses.includes('scheduled')) acc.scheduled++;
            return acc;
        }, { scheduled: 0, published: 0 });

        onStatsChange({
            scheduled: stats.scheduled,
            published: stats.published,
            title: getHeaderTitle()
        });
    }, [posts, viewMode, currentDate]);

    const getStartDateForView = () => {
        const date = new Date(currentDate);
        date.setHours(0, 0, 0, 0);

        if (viewMode === 'day') return date;

        if (viewMode === 'week') {
            const day = date.getDay(); // 0 is Sunday
            const diff = date.getDate() - day;
            return new Date(date.setDate(diff));
        }

        // Month
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const getEndDateForView = () => {
        const date = new Date(currentDate);
        date.setHours(23, 59, 59, 999);

        if (viewMode === 'day') return date;

        if (viewMode === 'week') {
            const day = date.getDay();
            const diff = date.getDate() + (6 - day);
            return new Date(date.setDate(diff));
        }

        // Month
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    };

    const getHeaderTitle = () => {
        if (viewMode === 'day') {
            return currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        if (viewMode === 'week') {
            const start = getStartDateForView();
            const end = getEndDateForView();
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        return formatMonth(currentDate);
    };

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

    // Original helper simplified/removed as we use new logic
    const formatMonth = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewMode === 'day') {
                newDate.setDate(prev.getDate() + (direction === 'prev' ? -1 : 1));
            } else if (viewMode === 'week') {
                newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7));
            } else {
                newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
            }
            return newDate;
        });
    };
    const isToday = (day) => {
        if (!day) return false;
        const today = new Date();
        // Check if full date matches
        if (day instanceof Date) {
            return (day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear());
        }
        // Fallback for number passed from getDaysInMonth
        return (day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear());
    };
    const postsByDay = useMemo(() => {
        const map = new Map();
        for (const p of posts) {
            if (!p.scheduledDate) continue;
            const d = new Date(p.scheduledDate);
            // Relaxed filter: include if it matches current date logic? 
            // Actually reusing existing logic but adapting for render
            // Store by full date string key to handle week spanning months
            const key = d.toDateString();
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(p);
        }
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
            map.set(k, arr);
        }
        return map;
    }, [posts]);

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

    // Determine grid days based on view mode
    const getVisibleGridDays = () => {
        if (viewMode === 'day') {
            return [currentDate];
        }
        if (viewMode === 'week') {
            const start = getStartDateForView();
            const days = [];
            const temp = new Date(start);
            for (let i = 0; i < 7; i++) {
                days.push(new Date(temp));
                temp.setDate(temp.getDate() + 1);
            }
            return days;
        }

        // Month view (original logic adapted)
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    };

    const gridDays = getVisibleGridDays();

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
                            {getHeaderTitle()}
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
            <div className={`grid gap-2 sm:gap-3 ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
                {gridDays.map((day, index) => {
                    const isWeekend = day ? (day.getDay() === 0 || day.getDay() === 6) : false;
                    const dateKey = day ? day.toDateString() : `empty-${index}`;

                    if (viewMode === 'day' && day) {
                        // Day View Render
                        const dayPosts = postsByDay.get(dateKey) || [];
                        return (
                            <div key={dateKey} className="min-h-[500px] bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">{day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                        {dayPosts.length} posts
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {dayPosts.length === 0 ? (
                                        <div className="text-center py-20 text-gray-500">No posts scheduled for this day</div>
                                    ) : (
                                        dayPosts.map(post => {
                                            const d = new Date(post.scheduledDate);
                                            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                            let agg = 'draft';
                                            const statuses = (post.platforms || []).map(p => p.status);
                                            if (statuses.includes('failed')) agg = 'failed';
                                            else if (statuses.includes('processing')) agg = 'processing';
                                            else if (statuses.includes('scheduled')) agg = 'scheduled';
                                            else if (statuses.includes('published')) agg = 'published';

                                            const statusColors = {
                                                scheduled: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
                                                published: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
                                                draft: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
                                                failed: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
                                                processing: { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' }
                                            };
                                            const colors = statusColors[agg];

                                            return (
                                                <div key={post._id} onClick={() => openEditPostModal(post)}
                                                    className="flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-md transition-all cursor-pointer"
                                                    style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                                                    <div className="text-lg font-bold" style={{ color: colors.text }}>{time}</div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">{post.title}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {(post.platforms || []).map(p => (
                                                                <span key={p.name}>{getPlatformIcon(p.name)}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-lg text-sm font-semibold capitalize"
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: colors.text }}>
                                                        {agg}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={dateKey}
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
                                    {day.getDate()}
                                </div>

                                {/* Posts for this day */}
                                <div className="space-y-2">
                                    {(postsByDay.get(day.toDateString()) || []).slice(0, 3).map((post) => {
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
                                    {(postsByDay.get(day.toDateString()) || []).length > 3 && (
                                        <div className="text-xs text-center py-1.5 px-2 bg-gray-100 rounded-lg font-semibold text-gray-600 border border-gray-200">
                                            +{(postsByDay.get(day.toDateString()) || []).length - 3} more
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
