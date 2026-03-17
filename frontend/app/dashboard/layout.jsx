"use client";
import { useState } from 'react';
import Sidebar from '../../src/components/layout/Sidebar';
import Topbar from '../../src/components/layout/Topbar';
import Breadcrumb from '../../src/components/layout/Breadcrumb';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen" style={{ backgroundColor: '#F7FAF8' }}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
                <Topbar onToggleSidebar={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
