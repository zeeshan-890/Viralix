export const metadata = {
    title: 'Privacy Policy | AutoReach',
    description: 'Privacy Policy describing how AutoReach collects, uses, and protects your data.'
};

const LAST_UPDATED = 'October 7, 2025';

export default function PrivacyPolicyPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-12 prose prose-slate dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p><strong>Last Updated:</strong> {LAST_UPDATED}</p>
            <p>Thank you for using <strong>AutoReach</strong> ("AutoReach", "we", "our", or "us"). This Privacy Policy explains what information we collect, how we use it, how we share it, and the choices you have. By using our platform, you agree to the practices described here.</p>

            <h2>1. Information We Collect</h2>
            <h3>1.1 Account Information</h3>
            <p>Name, email, password (hashed), verification status, and settings.</p>
            <h3>1.2 Social Platform Data</h3>
            <p>When you connect Facebook / Instagram Pages or Accounts, we store tokens and limited metadata (page IDs, names, categories, linked Instagram business IDs) required to publish content and fetch analytics. We never store your Facebook/Instagram password.</p>
            <h3>1.3 Content & Media</h3>
            <p>Uploaded media (images / videos) is stored via third-party storage (e.g. Cloudinary). Captions, drafts, scheduled posts, publishing metadata, and AI-generated suggestions are retained for product functionality.</p>
            <h3>1.4 Analytics & Engagement Data</h3>
            <p>We retrieve performance metrics (impressions, reach, likes, comments, views, engagement ratios) made available through official platform APIs. We only request scopes necessary for the features you use.</p>
            <h3>1.5 AI Processing</h3>
            <p>Text you submit for AI rewriting or caption/hashtag generation is sent to our integrated AI provider for inference. We do not use your private content to train internal models beyond transient processing.</p>
            <h3>1.6 Technical Data</h3>
            <p>IP address, device/browser info, timestamps, request logs, and error diagnostics to secure and improve the service.</p>

            <h2>2. How We Use Information</h2>
            <ul>
                <li>Authenticate users & secure access</li>
                <li>Generate, schedule, publish, and manage social content</li>
                <li>Provide analytics dashboards and performance insights</li>
                <li>Improve AI caption/hashtag quality (aggregate + anonymized trends)</li>
                <li>Send transactional email (verification, password reset)</li>
                <li>Detect abuse, fraud, or unauthorized access</li>
            </ul>

            <h2>3. Legal Bases (EEA / UK)</h2>
            <ul>
                <li><strong>Performance of Contract</strong> – delivering core platform features.</li>
                <li><strong>Legitimate Interests</strong> – product improvement, security, usage analytics.</li>
                <li><strong>Consent</strong> – email marketing (if ever applicable) or optional features.</li>
            </ul>

            <h2>4. Sharing & Disclosure</h2>
            <p>We do <strong>not sell</strong> personal data. We share data only with:</p>
            <ul>
                <li>Infrastructure & processing vendors (hosting, storage, AI inference, email delivery)</li>
                <li>Social platform APIs per your explicit connection and scopes</li>
                <li>Legal authorities if required to comply with law or protect rights</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>We retain data while your account remains active or as needed to provide services. You may request deletion (see Data Deletion section). Backups may persist for a limited period before irreversible purge.</p>

            <h2>6. Security</h2>
            <p>We employ encryption in transit (HTTPS), hashed passwords, token-based auth, scoped access tokens, least-privilege access controls, rate limiting, and monitoring. No system can guarantee 100% security; report issues promptly.</p>

            <h2>7. Your Rights</h2>
            <p>Depending on jurisdiction (GDPR / CCPA etc.) you may have rights to access, correct, delete, restrict, port, or object to processing. Contact us to exercise these.</p>

            <h2>8. Cookies & Local Storage</h2>
            <p>We currently rely on localStorage tokens for session handling and may use minimal cookies for OAuth state/security. Third parties (e.g. analytics) may use their own technologies if enabled in the future.</p>

            <h2>9. AI Generated Content Disclaimer</h2>
            <p>AI suggestions may be imperfect, outdated, or contain unintended biases. You are responsible for reviewing generated content before publishing. Do not input confidential or regulated data into AI features.</p>

            <h2>10. Third-Party Links</h2>
            <p>Links to external sites are not controlled by us. Review their policies independently.</p>

            <h2>11. Children</h2>
            <p>The service is not directed to individuals under 16 (or higher local age of digital consent). We do not knowingly collect such data; contact us for removal if discovered.</p>

            <h2>12. Changes</h2>
            <p>We may update this Privacy Policy. Material changes will be indicated via updated date or in-app notice. Continued use after changes = acceptance.</p>

            <h2>13. Contact</h2>
            <p>Questions or requests: <a href="mailto:privacy@autoreach.ai">privacy@autoreach.ai</a> (replace with your actual contact if different).</p>
        </main>
    );
}
