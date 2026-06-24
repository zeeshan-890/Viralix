'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Loader2 } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import CalendarAnalytics from './CalendarAnalytics';
import CalendarDayCell from './CalendarDayCell';
import {
    VIEW_MODES,
    toDateKey,
    parseDateKey,
    getViewDays,
    getViewTitle,
    navigateDate,
    groupPostsByDateKey,
    computeTimelineAnalytics,
    getAnalyticsRange,
    getPostCalendarDate,
    canDragPost,
} from './calendarUtils';
import { cal } from './calendarTheme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContentCalendar({
    onNewPost,
    onEditPost,
    onOpenAutofill,
    connectedAccounts = [],
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDateKey, setSelectedDateKey] = useState(null);

    const viewDays = useMemo(() => getViewDays(currentDate, viewMode), [currentDate, viewMode]);
    const postsByDate = useMemo(() => groupPostsByDateKey(posts), [posts]);

    const analyticsRange = useMemo(
        () => getAnalyticsRange(currentDate, viewMode, selectedDateKey),
        [currentDate, viewMode, selectedDateKey]
    );

    const analytics = useMemo(
        () => computeTimelineAnalytics(posts, analyticsRange.start, analyticsRange.end),
        [posts, analyticsRange]
    );

    const loadPosts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await postsAPI.getAllPosts({ limit: 200 });
            setPosts(res.data?.posts || []);
        } catch (err) {
            setError('Failed to load calendar posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const sourceKey = result.source.droppableId;
        const destKey = result.destination.droppableId;
        const postId = result.draggableId;

        if (sourceKey === destKey && result.source.index === result.destination.index) return;

        const post = posts.find((p) => p._id === postId);
        if (!post || !canDragPost(post)) return;

        const oldDate = getPostCalendarDate(post);
        const newDate = parseDateKey(destKey);
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

        const updatedPost = {
            ...post,
            scheduledDate: newDate.toISOString(),
            scheduledAt: newDate.toISOString(),
            isScheduled: true,
            status: 'scheduled',
        };

        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));

        try {
            await postsAPI.update(postId, {
                scheduledDate: newDate.toISOString(),
                isScheduled: true,
            });
        } catch (err) {
            console.error('Failed to reschedule post:', err);
            loadPosts();
        }
    };

    const handleNavigate = (direction) => {
        setCurrentDate((prev) => navigateDate(prev, viewMode, direction));
        setSelectedDateKey(null);
    };

    const handleViewChange = (mode) => {
        setViewMode(mode);
        setSelectedDateKey(null);
    };

    const currentMonth = currentDate.getMonth();

    return (
        <div className="flex flex-col gap-4">
            <div className={cn(cal.surface, 'flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between')}>
                <div>
                    <h1 className="text-lg font-semibold text-[var(--viralix-accent)]">Content Calendar</h1>
                    <p className="text-xs text-[var(--viralix-muted)]">{getViewTitle(currentDate, viewMode)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-inset)] p-0.5">
                        {VIEW_MODES.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => handleViewChange(id)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    viewMode === id
                                        ? 'bg-[#354F52] text-white shadow-sm'
                                        : 'text-[var(--viralix-muted)] hover:bg-[var(--viralix-surface)] hover:text-[var(--viralix-accent)]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-inset)]">
                        <button
                            type="button"
                            onClick={() => handleNavigate(-1)}
                            className="rounded-l-lg p-2 text-[var(--viralix-muted)] hover:bg-[var(--viralix-surface)]"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentDate(new Date());
                                setSelectedDateKey(null);
                            }}
                            className="border-x border-[var(--viralix-border)] px-3 py-1.5 text-xs font-medium text-[var(--viralix-accent)] hover:bg-[var(--viralix-surface)]"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNavigate(1)}
                            className="rounded-r-lg p-2 text-[var(--viralix-muted)] hover:bg-[var(--viralix-surface)]"
                            aria-label="Next"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {onOpenAutofill && (
                        <button
                            type="button"
                            onClick={onOpenAutofill}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white"
                            style={{ background: 'linear-gradient(135deg, #52796F, #354F52)' }}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Auto-Fill
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onNewPost?.(selectedDateKey ? parseDateKey(selectedDateKey) : new Date())}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: 'var(--viralix-primary)' }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Post
                    </button>
                </div>
            </div>

            {/* Timeline analytics */}
            <CalendarAnalytics
                title={getViewTitle(currentDate, viewMode)}
                analytics={analytics}
                selectedDateKey={selectedDateKey}
                onClearSelection={() => setSelectedDateKey(null)}
            />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
            )}

            {loading ? (
                <div className={cn(cal.surface, 'flex items-center justify-center gap-2 rounded-xl py-16 text-sm text-[var(--viralix-muted)]')}>
                    <Loader2 className="h-5 w-5 animate-spin text-[#84A98C]" />
                    Loading calendar…
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className={cn(cal.surfaceRaised, 'rounded-xl p-4')}>
                        {viewMode !== 'day' && (
                            <div className="mb-3 grid grid-cols-7 gap-1.5">
                                {WEEKDAYS.map((day, i) => (
                                    <div
                                        key={day}
                                        className={cn(
                                            'rounded-md py-2 text-center text-[0.6875rem] font-semibold uppercase tracking-wide',
                                            i === 0 || i === 6 ? cal.weekdayWeekend : cal.weekday
                                        )}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={cal.grid}>

                        {viewMode === 'day' ? (
                            <CalendarDayCell
                                date={currentDate}
                                posts={postsByDate[toDateKey(currentDate)] || []}
                                isToday={toDateKey(currentDate) === toDateKey(new Date())}
                                isWeekend={[0, 6].includes(currentDate.getDay())}
                                isSelected={selectedDateKey === toDateKey(currentDate)}
                                onSelectDay={setSelectedDateKey}
                                onAddPost={(key) => onNewPost?.(parseDateKey(key))}
                                onEditPost={onEditPost}
                            />
                        ) : (
                            <div
                                className={`grid gap-1.5 ${
                                    viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7 min-h-[480px]'
                                }`}
                            >
                                {viewDays.map((day) => {
                                    const key = toDateKey(day);
                                    const dow = day.getDay();
                                    return (
                                        <CalendarDayCell
                                            key={key}
                                            date={day}
                                            posts={postsByDate[key] || []}
                                            isToday={key === toDateKey(new Date())}
                                            isWeekend={dow === 0 || dow === 6}
                                            isCurrentMonth={
                                                viewMode === 'week' ? true : day.getMonth() === currentMonth
                                            }
                                            isSelected={selectedDateKey === key}
                                            compact={viewMode === 'month'}
                                            onSelectDay={setSelectedDateKey}
                                            onAddPost={(dateKey) => onNewPost?.(parseDateKey(dateKey))}
                                            onEditPost={onEditPost}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        </div>
                    </div>
                </DragDropContext>
            )}

            {connectedAccounts.length === 0 && !loading && (
                <p className="text-center text-xs text-gray-400">
                    Connect a social account to start scheduling posts.
                </p>
            )}
        </div>
    );
}
