"use client";

import { useState } from 'react';
import Sidebar from '../../src/components/layout/Sidebar';
import Topbar from '../../src/components/layout/Topbar';
import MockModeBanner from '../../src/components/MockModeBanner';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dashboard-shell flex min-h-screen">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-h-screen flex-1 flex-col md:pl-[15.5rem]">
                <Topbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="app-main flex-1 overflow-auto p-4 sm:p-5">
                    <MockModeBanner />
                    <div className="mx-auto max-w-[1400px]">{children}</div>
                </main>
            </div>
        </div>
    );
}
