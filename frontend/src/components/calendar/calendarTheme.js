/** Shared Viralix calendar color tokens (aligned with dashboard-shell theme) */
export const cal = {
    page: 'bg-[var(--viralix-bg)]',
    surface: 'dash-card border border-[var(--viralix-border)]',
    surfaceRaised: 'dash-card border border-[var(--viralix-border)]',
    grid: 'bg-[var(--viralix-border)] border border-[var(--viralix-border)] rounded-lg p-2',
    day: 'dash-card border border-[var(--viralix-border)] rounded-lg overflow-hidden',
    dayHeader: 'bg-[var(--viralix-inset)] border-b border-[var(--viralix-border)]',
    dayHeaderWeekend: 'bg-[#F5F0E6] border-b border-[var(--viralix-border)]',
    dayHeaderToday: 'bg-[#E8F0ED] border-b border-[#84A98C]',
    dayBody: 'bg-[var(--viralix-bg)]',
    analyticsHeader: 'bg-gradient-to-r from-[#354F52] to-[#2F3E46] text-white',
    analyticsBody: 'bg-[var(--viralix-bg)]',
    weekday: 'bg-[#52796F] text-white',
    weekdayWeekend: 'bg-[#627F75] text-white',
};

export const statusBorder = {
    scheduled: 'border-l-[#D97706]',
    published: 'border-l-[#059669]',
    draft: 'border-l-[#94A3B8]',
    failed: 'border-l-[#DC2626]',
    processing: 'border-l-[#7C3AED]',
};

export const statusBadge = {
    scheduled: 'bg-amber-100 text-amber-800',
    published: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-slate-100 text-slate-600',
    failed: 'bg-red-100 text-red-700',
    processing: 'bg-violet-100 text-violet-700',
};
