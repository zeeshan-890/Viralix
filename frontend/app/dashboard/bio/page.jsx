'use client';
import BioPageBuilder from './components/BioPageBuilder';

export default function BioDashboardPage() {
    return (
        <div className="h-full p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Your Bio Link</h1>
                <p className="text-gray-500">Manage your "Link in Bio" page to showcase all your content in one place.</p>
            </div>
            <BioPageBuilder />
        </div>
    );
}
