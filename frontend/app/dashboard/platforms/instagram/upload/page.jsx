'use client';

import InstagramPublishPanel from '@/components/instagram/InstagramPublishPanel';
import { instagramPublishAPI, instagramOAuthAPI } from '@/lib/api';

const productionInstagramAPI = {
    accounts: instagramPublishAPI.accounts,
    disconnect: instagramPublishAPI.disconnect,
    connect: instagramOAuthAPI.connect,
    publish: instagramPublishAPI.publish,
    publishStatus: instagramPublishAPI.publishStatus,
    publishLimit: instagramPublishAPI.publishLimit,
    logs: instagramPublishAPI.logs,
};

export default function InstagramUploadPage() {
    return (
        <InstagramPublishPanel
            api={productionInstagramAPI}
            title="Instagram Upload"
            subtitle="Publish with Instagram Login — no Facebook Page required"
            accountsTitle="Connected Accounts"
            unavailableMessage={
                <>
                    Instagram publish API unavailable (
                    <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs">/api/instagram-publish/*</code>
                    ). Deploy the latest backend.
                </>
            }
        />
    );
}
