/** @typedef {'month' | 'week' | 'day'} CalendarViewMode */

export const VIEW_MODES = [
    { id: 'month', label: '30 Days' },
    { id: 'week', label: '7 Days' },
    { id: 'day', label: 'Daily' },
];

export function toDateKey(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

/** @param {import('./types').CalendarPost} post */
export function getPostCalendarDate(post) {
    if (post.scheduledDate || post.scheduledAt) {
        return new Date(post.scheduledDate || post.scheduledAt);
    }
    const publishedAt = post.platforms?.find((p) => p.publishedAt)?.publishedAt;
    if (publishedAt) return new Date(publishedAt);
    return new Date(post.createdAt || Date.now());
}

/** @param {import('./types').CalendarPost} post */
export function getPostStatus(post) {
    if (post.status) return post.status;
    if (post.isPublished) return 'published';
    if (post.isScheduled) return 'scheduled';
    const statuses = (post.platforms || []).map((p) => p.status);
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('published')) return 'published';
    if (statuses.includes('scheduled')) return 'scheduled';
    return 'draft';
}

/** @param {import('./types').CalendarPost} post */
export function canDragPost(post) {
    const status = getPostStatus(post);
    return status === 'scheduled' || status === 'draft';
}

export function formatPostTime(post) {
    const d = getPostCalendarDate(post);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** @param {import('./types').CalendarPost[]} posts */
export function groupPostsByDateKey(posts) {
    /** @type {Record<string, import('./types').CalendarPost[]>} */
    const grouped = {};
    for (const post of posts) {
        const key = toDateKey(getPostCalendarDate(post));
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(post);
    }
    for (const key of Object.keys(grouped)) {
        grouped[key].sort(
            (a, b) => getPostCalendarDate(a).getTime() - getPostCalendarDate(b).getTime()
        );
    }
    return grouped;
}

/** @param {Date} anchor @param {CalendarViewMode} mode */
export function getViewRange(anchor, mode) {
    const date = new Date(anchor);

    if (mode === 'day') {
        return { start: startOfDay(date), end: endOfDay(date) };
    }

    if (mode === 'week') {
        const start = startOfDay(date);
        start.setDate(start.getDate() - start.getDay());
        const end = endOfDay(new Date(start));
        end.setDate(end.getDate() + 6);
        return { start, end };
    }

    // month — full grid including leading/trailing days (42 cells)
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridStart = startOfDay(first);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = endOfDay(new Date(gridStart));
    gridEnd.setDate(gridEnd.getDate() + 41);
    return { start: gridStart, end: gridEnd };
}

/** @param {Date} anchor @param {CalendarViewMode} mode */
export function getViewDays(anchor, mode) {
    const { start, end } = getViewRange(anchor, mode);
    const days = [];
    const cursor = startOfDay(start);
    const last = startOfDay(end);

    while (cursor <= last) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    if (mode === 'month') {
        while (days.length < 42) {
            const next = new Date(days[days.length - 1]);
            next.setDate(next.getDate() + 1);
            days.push(next);
        }
        return days.slice(0, 42);
    }

    return days;
}

/** @param {Date} anchor @param {CalendarViewMode} mode */
export function getViewTitle(anchor, mode) {
    if (mode === 'day') {
        return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (mode === 'week') {
        const { start, end } = getViewRange(anchor, 'week');
        const sameMonth = start.getMonth() === end.getMonth();
        if (sameMonth) {
            return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
        }
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** @param {Date} anchor @param {CalendarViewMode} mode @param {1 | -1} direction */
export function navigateDate(anchor, mode, direction) {
    const next = new Date(anchor);
    if (mode === 'day') next.setDate(next.getDate() + direction);
    else if (mode === 'week') next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    return next;
}

/** @param {import('./types').CalendarPost[]} posts @param {Date} start @param {Date} end */
export function computeTimelineAnalytics(posts, start, end) {
    const inRange = posts.filter((p) => {
        const d = getPostCalendarDate(p);
        return d >= start && d <= end;
    });

    const byStatus = { scheduled: 0, published: 0, draft: 0, failed: 0 };
    let totalViews = 0;
    let totalEngagement = 0;

    const dailyCounts = {};

    for (const post of inRange) {
        const status = getPostStatus(post);
        if (byStatus[status] !== undefined) byStatus[status]++;
        else byStatus.draft++;

        const key = toDateKey(getPostCalendarDate(post));
        dailyCounts[key] = (dailyCounts[key] || 0) + 1;

        for (const pl of post.platforms || []) {
            const e = pl.engagement || {};
            totalViews += e.views || 0;
            totalEngagement += (e.likes || 0) + (e.comments || 0) + (e.shares || 0);
        }
    }

    return {
        total: inRange.length,
        ...byStatus,
        totalViews,
        totalEngagement,
        dailyCounts,
        posts: inRange,
    };
}

/** @param {Date} anchor @param {CalendarViewMode} mode @param {string | null} selectedDateKey */
export function getAnalyticsRange(anchor, mode, selectedDateKey) {
    if (selectedDateKey) {
        const d = parseDateKey(selectedDateKey);
        return { start: startOfDay(d), end: endOfDay(d) };
    }
    if (mode === 'month') {
        const start = startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
        const end = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
        return { start, end };
    }
    return getViewRange(anchor, mode);
}

export function aggregatePostEngagement(post) {
    return (post.platforms || []).reduce(
        (acc, p) => {
            const e = p.engagement || {};
            acc.views += e.views || 0;
            acc.likes += e.likes || 0;
            acc.comments += e.comments || 0;
            acc.shares += e.shares || 0;
            return acc;
        },
        { views: 0, likes: 0, comments: 0, shares: 0 }
    );
}
