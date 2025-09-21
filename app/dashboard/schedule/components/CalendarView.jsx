'use client';
import { useEffect, useMemo, useState } from 'react';
import { postsAPI } from '@/lib/api';
import PostEditModal from './PostEditModal';

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [posts, setPosts] = useState([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

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

    const handlePostSave = () => {
        // Refresh posts after save/delete
        loadPosts();
        setModalOpen(false);
        setSelectedPost(null);
    };

    const openNewPostModal = () => {
        setSelectedPost(null);
        setModalOpen(true);
    };

    const openEditPostModal = (post) => {
        setSelectedPost(post);
        setModalOpen(true);
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
            tiktok: '🎵',
            youtube: '📺',
            instagram: '📷',
            linkedin: '💼',
            facebook: '💻',
        };
        return icons[platform] || '📱';
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
    return (<div className="bg-white rounded-lg border border-gray-200">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    {formatMonth(currentDate)}
                </h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        ←
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">
                        Today
                    </button>
                    <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        →
                    </button>
                </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map((mode) => (<button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === mode
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'}`}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>))}
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-px mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (<div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                    {day}
                </div>))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {getDaysInMonth(currentDate).map((day, index) => (<div key={index} className={`min-h-[120px] bg-white p-2 ${day ? 'hover:bg-gray-50 cursor-pointer' : ''}`}>
                    {day && (<>
                        <div className={`text-sm font-medium mb-1 ${isToday(day)
                            ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                            : 'text-gray-900'}`}>
                            {day}
                        </div>

                        {/* Posts for this day */}
                        <div className="space-y-1">
                            {(postsByDay.get(day) || []).map((post) => {
                                const d = new Date(post.scheduledDate);
                                const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                let agg = 'draft';
                                const statuses = (post.platforms || []).map(p => p.status);
                                if (statuses.includes('failed')) agg = 'failed';
                                else if (statuses.includes('scheduled')) agg = 'scheduled';
                                else if (statuses.includes('published')) agg = 'published';
                                const platforms = (post.platforms || []).map(p => p.name);
                                return (
                                    <div
                                        key={post._id}
                                        className="text-xs p-1 rounded bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100"
                                        onClick={() => openEditPostModal(post)}
                                    >
                                        <div className="flex items-center space-x-1 mb-1">
                                            {platforms.map((platform) => (
                                                <span key={platform} className="text-xs">
                                                    {getPlatformIcon(platform)}
                                                </span>
                                            ))}
                                            <span className="text-blue-700 font-medium">{time}</span>
                                        </div>
                                        <div className="text-gray-700 truncate">{post.title}</div>
                                        <div className={`inline-block px-1 rounded text-xs ${getStatusColor(agg)}`}>{agg}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </>)}
                </div>))}
            </div>
            {loading && (<div className="mt-3 text-sm text-gray-500">Loading posts...</div>)}
            {error && (<div className="mt-3 text-sm text-red-600">{error}</div>)}
        </div>

        {/* New Post Button */}
        <div className="p-6 border-t border-gray-200">
            <button
                onClick={openNewPostModal}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
                + Create New Post
            </button>
        </div>

        {/* Post Edit Modal */}
        <PostEditModal
            isOpen={modalOpen}
            onClose={() => {
                setModalOpen(false);
                setSelectedPost(null);
            }}
            post={selectedPost}
            onSave={handlePostSave}
        />
    </div>);
}
