'use client';

import InstagramPublishPanel from '@/components/instagram/InstagramPublishPanel';
import { igTestAPI } from '@/lib/api';

export default function IgTestPage() {
    return (
        <InstagramPublishPanel
            api={igTestAPI}
            title="Instagram Publishing Test"
            subtitle="Isolated sandbox — Instagram Login only, no Facebook Page"
            accountsTitle="Test Accounts"
            disconnectConfirm="Disconnect this test account?"
            unavailableMessage={
                <>
                    IG Test endpoints are unavailable (
                    <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs">/api/ig-test/*</code>
                    returned 404). Deploy the latest backend to{' '}
                    <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs">api.viralix.dev</code>.
                </>
            }
        />
    );
}
