import AccountSettings from './components/AccountSettings';
import PlatformConnections from './components/PlatformConnections';
import NotificationSettings from './components/NotificationSettings';
import BillingSettings from './components/BillingSettings';
export default function SettingsPage() {
    return (<div>
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <nav className="space-y-2">
                        <a href="#account" className="flex items-center px-3 py-2 text-blue-700 bg-blue-50 rounded-lg">
                            <span className="mr-3">👤</span>
                            Account
                        </a>
                        <a href="#platforms" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <span className="mr-3">🔗</span>
                            Platform Connections
                        </a>
                        <a href="#notifications" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <span className="mr-3">🔔</span>
                            Notifications
                        </a>
                        <a href="#billing" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <span className="mr-3">💳</span>
                            Billing
                        </a>
                        <a href="#privacy" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <span className="mr-3">🔒</span>
                            Privacy & Security
                        </a>
                        <a href="#team" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <span className="mr-3">👥</span>
                            Team Management
                        </a>
                    </nav>
                </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                <AccountSettings />
                <PlatformConnections />
                <NotificationSettings />
                <BillingSettings />
            </div>
        </div>
    </div>);
}
