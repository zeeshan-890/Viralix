'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { platformsAPI } from '@/lib/api';
import ContentCalendar from '@/components/calendar/ContentCalendar';
import CalendarAutofillWizard from './components/CalendarAutofillWizard';

export default function SchedulePage() {
    const router = useRouter();
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [showWizard, setShowWizard] = useState(false);
    const [calendarKey, setCalendarKey] = useState(0);

    useEffect(() => {
        loadPlatforms();
    }, []);

    const loadPlatforms = async () => {
        try {
            const res = await platformsAPI.getConnected();
            setConnectedAccounts(res.data?.accounts || []);
        } catch {
            console.error('Failed to load platforms');
        }
    };

    const handleNewPost = (date) => {
        if (connectedAccounts.length === 0) {
            if (confirm('Connect a social account first. Go to Connect Accounts?')) {
                router.push('/dashboard/connect-accounts');
            }
            return;
        }
        const q = date ? `?date=${encodeURIComponent(date.toISOString())}` : '';
        router.push(`/dashboard/upload${q}`);
    };

    const handleEditPost = (post) => {
        router.push(`/dashboard/preview/${post._id}`);
    };

    return (
        <div className="pb-6">
            <ContentCalendar
                key={calendarKey}
                connectedAccounts={connectedAccounts}
                onNewPost={handleNewPost}
                onEditPost={handleEditPost}
                onOpenAutofill={() => setShowWizard(true)}
            />

            {showWizard && (
                <CalendarAutofillWizard
                    onClose={() => setShowWizard(false)}
                    onComplete={() => {
                        setShowWizard(false);
                        setCalendarKey((k) => k + 1);
                    }}
                />
            )}
        </div>
    );
}
