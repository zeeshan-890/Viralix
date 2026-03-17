export const metadata = {
    title: 'Privacy Policy | Viralix',
    description: 'Privacy Policy describing how Viralix collects, uses, and protects your data.'
};

const LAST_UPDATED = 'January 19, 2026';

export default function PrivacyPolicyPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-12 prose prose-slate dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p><strong>Last Updated:</strong> {LAST_UPDATED}</p>
            <p>Thank you for using <strong>Viralix</strong> ("Viralix", "we", "our", or "us"). This Privacy Policy explains what information we collect, how we use it, how we share it, and the choices you have. By using our platform, you agree to the practices described here.</p>

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

            <h2>13. Google API Services User Data Policy</h2>
            <p>Our application, <strong>Viralix</strong>, accesses certain user data from your Google account via the YouTube Data API to provide our social media management services. We are committed to ensuring the privacy and security of your data.</p>

            <h3>13.1 Data Accessed</h3>
            <p>We request access to the following Google user data:</p>
            <ul>
                <li><strong>YouTube Channel Information:</strong> We access your channel's basic profile information (channel title, description, custom URL, and thumbnail) to display your connected account identity within our dashboard.</li>
                <li><strong>YouTube Video Management:</strong> We access your video library to display your uploaded videos and their performance metrics (views, likes, comments).</li>
                <li><strong>YouTube Upload Functionality:</strong> We request permission to upload videos directly to your YouTube channel as initiated by you through our platform.</li>
            </ul>

            <h3>13.2 Data Usage</h3>
            <p>The Google user data we access is used solely for the following purposes:</p>
            <ul>
                <li><strong>Account Connection:</strong> To link your YouTube channel to your Viralix dashboard, allowing you to manage your presence from a single interface.</li>
                <li><strong>Content Publishing:</strong> To enable the "Direct Publishing" feature, allowing you to upload, schedule, and publish video content to your YouTube channel directly from our application.</li>
                <li><strong>Analytics Display:</strong> To aggregate and display performance insights (such as view counts and engagement metrics) for your videos within our dashboard, helping you analyze your content strategy.</li>
            </ul>
            <p><strong>We do not use your Google user data for any other purpose, including advertising or surveillance.</strong></p>

            <h3>13.3 Data Sharing</h3>
            <p><strong>We do not share your Google user data with any third parties</strong>, except in the following limited circumstances:</p>
            <ul>
                <li><strong>Service Providers:</strong> We may share data with cloud infrastructure providers (e.g., database hosting) solely for the purpose of storing and retrieving your data to provide the application's functionality. These providers are bound by strict confidentiality and security obligations.</li>
                <li><strong>Legal Requirements:</strong> If required by law, regulation, or legal process.</li>
            </ul>
            <p>We do <em>not</em> sell, rent, or trade your Google user data to any third parties.</p>

            <h3>13.4 Data Storage and Protection</h3>
            <p>Your data is stored securely in our encrypted database.</p>
            <ul>
                <li><strong>Encryption:</strong> All sensitive tokens (Access Tokens and Refresh Tokens) are encrypted at rest using industry-standard encryption protocols.</li>
                <li><strong>Access Control:</strong> Access to our database is strictly limited to authorized engineering personnel and is protected by multi-factor authentication and strict firewall rules.</li>
                <li><strong>Transmission:</strong> All data transmission between your browser, our servers, and Google's APIs occurs over secure HTTPS connections.</li>
            </ul>

            <h3>13.5 Data Retention and Deletion</h3>
            <ul>
                <li><strong>Retention:</strong> We retain your Google user data (access tokens and channel metadata) only for as long as you maintain a connected YouTube account on our platform.</li>
                <li><strong>Deletion:</strong> You can revoke our access to your data at any time by:
                    <ol>
                        <li>Disconnecting your YouTube account from the "Connected Accounts" section of your Viralix dashboard.</li>
                        <li>Visiting <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Security Settings</a> and revoking access for our app.</li>
                    </ol>
                </li>
            </ul>
            <p><strong>Upon disconnection, all your stored Google access tokens and related personal metadata are permanently deleted from our database immediately.</strong></p>

            <h2>14. Contact</h2>
            <p>Questions or requests: <a href="mailto:privacy@viralix.dev">privacy@viralix.dev</a></p>
        </main>
    );
}
