/** Shared Viralix calendar color tokens */
export const cal = {
    page: 'bg-[#F7FAF8]',
    surface: 'bg-white border border-[#C8D4CE] shadow-sm',
    surfaceRaised: 'bg-white border border-[#B8C9C0] shadow-md',
    grid: 'bg-[#D5DFD9] border border-[#B8C9C0] rounded-lg p-2',
    day: 'bg-white border border-[#C8D4CE] shadow-sm rounded-lg overflow-hidden',
    dayHeader: 'bg-[#EEF3F0] border-b border-[#D5DFD9]',
    dayHeaderWeekend: 'bg-[#F5F0E6] border-b border-[#D5DFD9]',
    dayHeaderToday: 'bg-[#E8F0ED] border-b border-[#84A98C]',
    dayBody: 'bg-[#FAFCFB]',
    analyticsHeader: 'bg-gradient-to-r from-[#354F52] to-[#2F3E46] text-white',
    analyticsBody: 'bg-[#F0F4F2]',
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
