// Instagram Linking Guide Page
// Provides end-user instructions to create/convert a Facebook Page, link an Instagram Business/Creator account,
// grant required permissions, and verify publishing capability inside Viralix.

import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, ExternalLink, Shield, Settings, RefreshCw, HelpCircle, Layers, Link2, Camera, Users, Key, Eye } from 'lucide-react';

export const metadata = {
  title: 'Instagram Publishing Setup Guide | Viralix',
  description: 'Step-by-step instructions to create a Facebook Page, convert Instagram to Business/Creator, link them, and enable publishing in Viralix.'
};

const steps = [
  {
    id: 1,
    title: 'Convert Instagram Account to Professional (Business or Creator)',
    icon: Camera,
    details: [
      'Open the Instagram mobile app.',
      'Go to: Profile → Menu (≡) → Settings & privacy → Account type and tools.',
      'Tap “Switch to Professional Account”.',
      'Choose Creator (flexible personal branding) or Business (brands/shops).',
      'Select a category and finish conversion.'
    ],
    tip: 'Personal accounts cannot publish through the Graph API.'
  },
  {
    id: 2,
    title: 'Create or Select a Facebook Page',
    icon: Users,
    details: [
      'In the Instagram app (recommended): Settings & privacy → Business tools & controls → Connect a Facebook Page.',
      'Choose an existing Page you manage OR tap “Create Facebook Page”.',
      'Follow prompts (name + category is enough).',
      'Confirm the Page is now shown as “Connected”.'
    ],
    tip: 'A Page acts as the bridge between your IG Professional account and Meta’s publishing infrastructure.'
  },
  {
    id: 3,
    title: '(Alternative) Link via Facebook Business Interface',
    icon: Link2,
    details: [
      'Go to https://business.facebook.com (desktop).',
      'Open Business Settings → Accounts → Instagram accounts.',
      'Click “Add” → Log in to your Instagram account → Select the Page to connect.',
      'Verify the IG account now appears with a linked Page.'
    ],
    tip: 'Use this if the Instagram app flow fails or you manage multiple assets.'
  },
  {
    id: 4,
    title: 'Grant Required Permissions During Viralix Connection',
    icon: Key,
    details: [
      'Use the “Connect Instagram” button inside Viralix (uses Meta OAuth dialog).',
      'When prompted, DO NOT uncheck Pages or Instagram assets — allow all you intend to manage.',
      'Ensure these scopes are visible/approved: instagram_basic (or instagram_business_basic), instagram_content_publish, pages_show_list.',
      'If you removed permissions previously: go to https://www.facebook.com/settings?tab=business_tools and remove Viralix, then reconnect fresh.'
    ],
    tip: 'Unchecking assets often causes silent publish failures later.'
  },
  {
    id: 5,
    title: 'Resolve Page Publishing Authorization (If Required)',
    icon: Shield,
    details: [
      'Some Pages require Page Publishing Authorization (PPA) before connected IG publishing succeeds.',
      'If Meta flags your Page, finish identity / security steps in the Page Quality or Security Center.',
      'Re-attempt the connection afterwards.'
    ],
    tip: 'Meta does not expose a direct API to check PPA status — user action may be necessary.'
  },
  {
    id: 6,
    title: 'Verify Capability in Viralix',
    icon: Eye,
    details: [
      'Return to Viralix Dashboard → Connect Accounts.',
      'Click “Refresh Accounts”.',
      'You should now see the Instagram account with a “Linked” or “Ready” status.',
      'Attempt a small image publish test (one JPG).'
    ],
    tip: 'Use a simple image under 2MB to reduce processing time.'
  },
  {
    id: 7,
    title: '(Optional) Upgrade for Insights & Advanced Scheduling',
    icon: Layers,
    details: [
      'Grant additional scopes: pages_read_engagement for richer metrics.',
      'Re-connect if you later need reel/video metrics or follower insights.',
      'Confirm metrics appear in the Analytics section.'
    ],
    tip: 'Add only what you need — fewer scopes => fewer consent issues.'
  },
  {
    id: 8,
    title: 'Troubleshoot Common Errors',
    icon: HelpCircle,
    details: [
      'Code 100 (Unsupported request - method type: post): You are using a Basic Display token; reconnect with Page link.',
      'Code 190 (Invalid OAuth access token): Token expired/revoked → re-authenticate.',
      'Code 10 / 200 (Permissions / Access denied): Missing instagram_content_publish or unchecked asset during login.',
      'Publishing stuck at IN_PROGRESS: Media too large or transient processing issue — retry with smaller file.'
    ],
    tip: 'If errors persist, remove the app in Facebook Business Integrations and reconnect clean.'
  }
];

function Callout({ type = 'info', title, children }) {
  const palette = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <AlertCircle className="w-5 h-5 text-blue-600" /> },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
    warning: { bg: 'bg-amber-50', border: 'border-amber-300', icon: <AlertCircle className="w-5 h-5 text-amber-600" /> },
    danger: { bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle className="w-5 h-5 text-red-600" /> },
  };
  const cfg = palette[type] || palette.info;
  return (
    <div className={`rounded-xl p-4 border flex gap-3 items-start ${cfg.bg} ${cfg.border}`}>
      <div className="mt-0.5">{cfg.icon}</div>
      <div>
        {title && <div className="font-semibold mb-1 text-sm tracking-wide uppercase text-gray-700">{title}</div>}
        <div className="text-gray-700 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function InstagramLinkingGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F8F6] to-white" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
      <div className="max-w-5xl mx-auto px-5 py-12 md:py-16">
        <div className="mb-10">
          <div className="inline-flex items-center text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full bg-[#CAD2C5] text-[#2F3E46] shadow-sm">Guide</div>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight" style={{ color: '#2F3E46' }}>
            Enable Instagram Publishing
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl leading-relaxed">
            Follow this step-by-step guide to create (or select) a Facebook Page, link your Instagram Professional
            account, grant the correct permissions, and successfully publish content using the Meta Graph API via Viralix.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Callout type="info" title="Why a Facebook Page?">
            Meta requires every Instagram Business/Creator account used for publishing to be linked to a Facebook Page. The Page is an identity + permissions bridge.
          </Callout>
          <Callout type="success" title="Fastest Path">
            Convert → Link Page inside IG app → Connect in Viralix with all assets checked → Test publish.
          </Callout>
          <Callout type="warning" title="Skipping Steps?">
            If you only authenticate with Instagram Basic Display (graph.instagram.com), publishing will always fail with <code>Unsupported request</code>.
          </Callout>
        </div>

        <ol className="space-y-10">
          {steps.map(step => (
            <li key={step.id} className="relative">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white" style={{ backgroundColor: '#84A98C' }}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-semibold mb-3" style={{ color: '#354F52' }}>Step {step.id}. {step.title}</h2>
                  <ul className="list-disc ml-5 space-y-1 text-gray-700 text-sm md:text-base">
                    {step.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                  {step.tip && (
                    <div className="mt-4">
                      <Callout type="info" title="Tip">{step.tip}</Callout>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 space-y-10">
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#2F3E46' }}>API Verification (Optional)</h3>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-gray-700 text-sm mb-4">Use these Graph API requests (replace placeholders) after successful linking:</p>
              <pre className="text-xs md:text-sm bg-[#2F3E46] text-green-100 rounded-lg p-4 overflow-x-auto"><code>{`# List Pages you manage
GET https://graph.facebook.com/v19.0/me/accounts?access_token=USER_TOKEN

# For each page: retrieve connected IG account
GET https://graph.facebook.com/v19.0/{PAGE_ID}?fields=connected_instagram_account&access_token=USER_TOKEN

# Create a media container (image example)
POST https://graph.facebook.com/v19.0/{IG_USER_ID}/media?image_url=PUBLIC_IMAGE_URL&caption=Hello&access_token=USER_OR_PAGE_TOKEN

# Poll container status
GET https://graph.facebook.com/v19.0/{CREATION_ID}?fields=status_code&access_token=USER_OR_PAGE_TOKEN

# Publish
POST https://graph.facebook.com/v19.0/{IG_USER_ID}/media_publish?creation_id={CREATION_ID}&access_token=USER_OR_PAGE_TOKEN`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#2F3E46' }}>Frequently Asked Questions</h3>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I publish without a Facebook Page?',
                  a: 'No. Meta requires a linked Page for Business/Creator Instagram publishing via the Graph API.'
                },
                {
                  q: 'Why do I see Unsupported request errors?',
                  a: 'You are using a Basic Display token (graph.instagram.com). Reconnect with the proper Facebook Login flow and keep all assets checked.'
                },
                {
                  q: 'Do I have to post to the Facebook Page too?',
                  a: 'No. The Page only acts as a linkage layer; you can post solely to Instagram.'
                },
                {
                  q: 'My video never finishes processing — what now?',
                  a: 'Try a smaller/shorter MP4. For larger videos you may need the resumable upload workflow using a Page access token.'
                },
                {
                  q: 'Can I disconnect later?',
                  a: 'Yes, but publishing will stop working until re-linked.'
                }
              ].map((f, i) => (
                <div key={i} className="border rounded-xl p-5 bg-white shadow-sm">
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#354F52' }}><HelpCircle className="w-5 h-5 text-[#84A98C]" /> {f.q}</h4>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-8 bg-gradient-to-r from-[#424c3b] to-[#4e6653] text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Ready to Finish Setup?</h3>
            <p className="text-white/80 mb-6 max-w-2xl">Once your Instagram account is linked to a Facebook Page, return to Viralix and refresh the connection. You can begin scheduling posts immediately.</p>
            <Link href="/dashboard/connect-accounts" className="inline-flex items-center gap-2 bg-white text-[#2F3E46] font-semibold px-6 py-3 rounded-xl shadow hover:shadow-lg transition">
              Go to Connect Accounts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
