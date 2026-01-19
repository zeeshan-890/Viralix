export const metadata = {
    title: 'Data Deletion Instructions | Viralix',
    description: 'How to request deletion of your data from Viralix.'
};

const LAST_UPDATED = 'January 19, 2026';

export default function DataDeletionPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 prose prose-slate dark:prose-invert">
            <h1>Data Deletion / Erasure Request</h1>
            <p><strong>Last Updated:</strong> {LAST_UPDATED}</p>
            <p>This page explains how you can request deletion of your account and associated data from <strong>Viralix</strong>. These instructions also satisfy Facebook / Instagram data deletion compliance requirements.</p>

            <h2>1. In-App Deletion (When Available)</h2>
            <p>If a self-service delete button is available in your account settings, using it will queue your account and associated data (posts, drafts, tokens, analytics snapshots) for deletion. Media stored in third-party storage (e.g. Cloudinary) is also removed where feasible.</p>

            <h2>2. Manual Deletion Request</h2>
            <p>If self-service deletion is not present or fails, email us at <a href="mailto:privacy@viralix.dev">privacy@viralix.dev</a> with the subject <em>Account Deletion Request</em> from the email tied to your account. Include:</p>
            <ul>
                <li>Your account email</li>
                <li>Optional reason (for product improvement)</li>
            </ul>
            <p>We will confirm receipt and complete deletion (or anonymization) within 30 days, typically much sooner.</p>

            <h2>3. Immediate Revocation of Platform Access</h2>
            <p>At any time you can revoke connected Facebook or Instagram permissions directly in Meta’s Business Integrations or Page settings. Revoking access prevents further token refreshes or analytics retrieval.</p>

            <h2>4. What Gets Deleted</h2>
            <ul>
                <li>User account record & profile fields</li>
                <li>Social access tokens and page/account metadata</li>
                <li>Drafts, scheduled posts, AI suggestions stored with your user context</li>
                <li>Analytics snapshots and engagement logs</li>
                <li>Uploaded media (subject to cache/backup windows)</li>
            </ul>

            <h2>5. What May Be Retained Temporarily</h2>
            <ul>
                <li>Server logs (rotated; used for security & fraud detection)</li>
                <li>Database backups (time-limited, then purged)</li>
                <li>Aggregated, non-identifiable statistics</li>
            </ul>

            <h2>6. Irreversible Deletion</h2>
            <p>Deletion requests are irreversible. After removal you must re-register to use the platform again.</p>

            <h2>7. Verification</h2>
            <p>For security, we may request email re-verification or additional proof of ownership before executing a deletion request.</p>

            <h2>8. Contact</h2>
            <p>Data Protection / Privacy inquiries: <a href="mailto:privacy@viralix.dev">privacy@viralix.dev</a></p>

            <p>We are committed to promptly honoring valid deletion requests in compliance with applicable data protection laws.</p>
        </main>
    );
}
