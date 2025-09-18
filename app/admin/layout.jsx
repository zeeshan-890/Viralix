import Sidebar from '../../src/components/layout/Sidebar';
import DashboardHeader from '../../src/components/layout/DashboardHeader';
import Breadcrumb from '../../src/components/layout/Breadcrumb';
export default function AdminLayout({ children, }) {
    return (<div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader title="Admin Dashboard" subtitle="Manage users, content, and platform settings"/>
                <main className="flex-1 overflow-auto p-6">
                    <Breadcrumb />
                    {children}
                </main>
            </div>
        </div>);
}
