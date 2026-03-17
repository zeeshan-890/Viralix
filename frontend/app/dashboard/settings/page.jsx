import AccountSettings from './components/AccountSettings';
import TeamManagement from './components/TeamManagement';
import WatermarkSettings from './components/WatermarkSettings';
import BulkUpload from './components/BulkUpload';

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences.</p>
            </div>

            <div className="space-y-8">
                <AccountSettings />
                <TeamManagement />
                <WatermarkSettings />
                <BulkUpload />
            </div>
        </div>
    );
}

