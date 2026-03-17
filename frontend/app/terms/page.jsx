export const metadata = {
    title: 'Terms of Service | Viralix',
    description: 'Terms governing the use of Viralix platform.'
};

const LAST_UPDATED = 'January 19, 2026';

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-12 prose prose-slate dark:prose-invert">
            <h1>Terms of Service</h1>
            <p><strong>Last Updated:</strong> {LAST_UPDATED}</p>
            <p>These Terms of Service ("Terms") form a binding agreement between you ("User" or "you") and <strong>Viralix</strong> ("Viralix", "we", "our"). By accessing or using the platform you agree to these Terms. If you do not agree, do not use the service.</p>

            <h2>1. Service Description</h2>
            <p>Viralix provides tools to draft, schedule, publish, and analyze social media content, and to generate AI-assisted captions/hashtags.</p>

            <h2>2. Eligibility</h2>
            <p>You represent you are at least 16 (or the age of digital consent in your region) and have authority to bind any organization you act for.</p>

            <h2>3. Account & Security</h2>
            <ul>
                <li>You must provide accurate registration information.</li>
                <li>You are responsible for safeguarding login credentials and tokens.</li>
                <li>Notify us of unauthorized access immediately.</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <ul>
                <li>No unlawful, infringing, defamatory, or abusive content.</li>
                <li>No circumvention of platform API limits or security.</li>
                <li>No automated scraping/harvesting outside documented APIs.</li>
                <li>No misleading impersonation or spam activity.</li>
            </ul>

            <h2>5. User Content</h2>
            <p>You retain ownership of content you supply. You grant Viralix a worldwide, non-exclusive license to host, process, transform, and transmit content solely to operate and improve the service.</p>

            <h2>6. Social Platform Integrations</h2>
            <p>Use of Facebook / Instagram features remains subject to Meta’s platform policies. Revoking permissions may limit functionality. We are not liable for third-party API changes or outages.</p>

            <h2>7. AI Features</h2>
            <p>AI outputs are generated algorithmically and provided “as is.” You are solely responsible for verifying accuracy and compliance with applicable law and platform policies.</p>

            <h2>8. Plans, Fees & Trials</h2>
            <p>If paid plans are introduced, billing terms will be provided separately. Non-payment may result in suspension or termination.</p>

            <h2>9. Intellectual Property</h2>
            <p>The platform, code, design, and trademarks are owned by Viralix or licensors. No rights are granted except as explicitly stated.</p>

            <h2>10. Feedback</h2>
            <p>Suggestions or feedback may be used without obligation or compensation.</p>

            <h2>11. Termination</h2>
            <p>We may suspend or terminate accounts for violations, suspected abuse, or legal compliance. You may cease use at any time; data deletion requests follow our Privacy Policy.</p>

            <h2>12. Disclaimer</h2>
            <p>THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES (EXPRESS OR IMPLIED) INCLUDING MERCHANTABILITY, FITNESS, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE UNINTERRUPTED OR ERROR-FREE OPERATION.</p>

            <h2>13. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIRALIX IS NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS, EVEN IF ADVISED OF POSSIBILITY. AGGREGATE LIABILITY SHALL NOT EXCEED FEES PAID (IF ANY) IN THE PRECEDING 3 MONTHS.</p>

            <h2>14. Indemnity</h2>
            <p>You agree to indemnify and hold harmless Viralix from claims arising from your content, misuse, or violation of these Terms.</p>

            <h2>15. Changes</h2>
            <p>We may update Terms; continued use after changes constitutes acceptance. Material changes may be communicated via notice.</p>

            <h2>16. Governing Law</h2>
            <p>Unless required otherwise by local law, these Terms are governed by the laws applicable where Viralix is primarily operated (to be specified by your business jurisdiction).</p>

            <h2>17. Contact</h2>
            <p>Questions: <a href="mailto:legal@viralix.dev">legal@viralix.dev</a></p>

            <p>By using the platform you acknowledge reading and agreeing to these Terms.</p>
        </main>
    );
}
