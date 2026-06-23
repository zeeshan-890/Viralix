'use client';

import { isMockMode } from '@/lib/mock';

export default function MockModeBanner() {
    if (!isMockMode()) return null;

    return (
        <div
            className="mb-3 flex items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-medium"
            style={{ backgroundColor: '#CAD2C5', color: '#2F3E46' }}
        >
            <span aria-hidden>🧪</span>
            <span>Demo mode — dummy data, no backend required</span>
        </div>
    );
}
