import AccountSettings from './components/AccountSettings';

export default function SettingsPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences.</p>
            </div>

            <div className="max-w-2xl">
                <AccountSettings />
            </div>
        </div>
    );
}
