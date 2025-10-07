import Sidebar from '../../src/components/layout/Sidebar';
import Topbar from '../../src/components/layout/Topbar';
import Breadcrumb from '../../src/components/layout/Breadcrumb';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen" style={{ backgroundColor: '#F7FAF8' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-auto p-6">
                    <Breadcrumb />
                    {children}
                </main>
            </div>
        </div>
    );
}
