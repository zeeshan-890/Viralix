# Viralix — AI-Powered Social Media Management Platform (Client)

> The frontend client for **Viralix**, an all-in-one AI-powered platform to manage, schedule, publish, and analyze social media content across **Facebook**, **Instagram**, **TikTok**, and **YouTube**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4, Inline styles (brand palette) |
| **State Management** | Zustand 5 |
| **Server State** | TanStack React Query 5 |
| **Forms** | React Hook Form 7 + Zod 4 validation |
| **HTTP Client** | Axios |
| **UI Primitives** | Radix UI (Dialog, Dropdown, Select, Tabs) |
| **Charts** | Recharts 3 |
| **Icons** | Lucide React |
| **Notifications** | React Hot Toast |
| **Date Utilities** | date-fns, react-datepicker |
| **Fonts** | Geist Sans & Geist Mono (Google Fonts) |

---

## Project Structure

```
client-autoreach-ai/
├── app/                          # Next.js App Router pages
│   ├── layout.jsx                # Root layout (fonts, providers, toaster)
│   ├── page.jsx                  # Landing page (public)
│   ├── globals.css               # Global CSS imports
│   ├── landing-theme.css         # Landing page specific theme
│   │
│   ├── auth/                     # Authentication pages
│   │   ├── login/                #   Email/password login + Google/Facebook OAuth
│   │   ├── signup/               #   Registration with name/email/password
│   │   ├── verify-otp/           #   OTP verification after signup
│   │   ├── forgot-password/      #   Request password reset email
│   │   ├── reset-password/       #   Set new password via token
│   │   └── callback/             #   OAuth callback handler (Google/Facebook)
│   │
│   ├── dashboard/                # Protected dashboard area
│   │   ├── layout.jsx            #   Dashboard shell (Sidebar + Topbar)
│   │   ├── page.jsx              #   Dashboard home (stats, activity, actions)
│   │   │
│   │   ├── upload/               #   Upload & publish content
│   │   │   ├── page.jsx          #     Multi-file upload, platform targeting, scheduling
│   │   │   └── components/       #     UploadZone, AICaption, MediaPreview, PlatformTargets
│   │   │
│   │   ├── preview/              #   Content management & preview
│   │   │   ├── page.jsx          #     List all posts (draft/scheduled/published)
│   │   │   └── [contentId]/      #     Single post detail view
│   │   │       ├── page.jsx      #       Edit, schedule, publish, delete post
│   │   │       └── components/   #       CaptionEditor, HashtagEditor, MediaEditor,
│   │   │                         #       PlatformSelector, PlatformTabs, PublishModal,
│   │   │                         #       ScheduleModal, ScheduleSection
│   │   │
│   │   ├── schedule/             #   Scheduling calendar
│   │   │   ├── page.jsx          #     Calendar view with account status
│   │   │   └── components/       #     CalendarView
│   │   │
│   │   ├── analytics/            #   Analytics dashboard
│   │   │   ├── page.jsx          #     Overview stats (views, engagement, likes, followers)
│   │   │   └── components/       #     AnalyticsCharts, PlatformMetrics, ContentPerformance
│   │   │
│   │   ├── platforms/            #   Platform-specific content feeds
│   │   │   ├── page.jsx          #     Platform overview (all connected accounts)
│   │   │   ├── facebook/         #     Facebook page feed + post creation + post insights
│   │   │   ├── instagram/        #     Instagram feed + post creation + post insights
│   │   │   ├── tiktok/           #     TikTok video feed + post creation + video insights
│   │   │   ├── youtube/          #     YouTube video feed + upload + video insights
│   │   │   └── components/       #     PlatformPageLayout (shared layout)
│   │   │
│   │   ├── connect-accounts/     #   OAuth account management
│   │   │   ├── page.jsx          #     Connect/disconnect all platforms
│   │   │   ├── facebook/         #     Facebook page selection + [pageId] detail
│   │   │   ├── instagram/        #     Instagram account detail + [igUserId]
│   │   │   ├── instagram-oauth/  #     Instagram OAuth redirect handler
│   │   │   ├── tiktok/           #     TikTok OAuth connection
│   │   │   └── youtube/          #     YouTube OAuth connection
│   │   │
│   │   ├── editor/               #   Media editor
│   │   │   ├── page.jsx          #     Editor page (placeholder)
│   │   │   └── components/       #     ImageEditor, VideoEditor, ffmpegClient
│   │   │
│   │   ├── settings/             #   Account settings
│   │   │   ├── page.jsx          #     Settings wrapper
│   │   │   └── components/       #     AccountSettings
│   │   │
│   │   └── components/           #   Dashboard-specific stubs
│   │       ├── Sidebar.jsx       #     (stub/legacy)
│   │       ├── Topbar.jsx        #     (stub/legacy)
│   │       └── StatsCard.jsx     #     (stub/legacy)
│   │
│   ├── data-deletion/            # Facebook data deletion callback page
│   ├── guide/                    # Help guides
│   │   └── instagram-linking/    #   Instagram linking tutorial
│   ├── privacy/                  # Privacy policy page
│   └── terms/                    # Terms of service page
│
├── src/                          # Shared source modules
│   ├── components/
│   │   ├── layout/               # App shell components
│   │   │   ├── Sidebar.jsx       #   Main sidebar navigation with expandable sub-menus
│   │   │   ├── Topbar.jsx        #   Top navigation bar with user menu
│   │   │   ├── DashboardHeader.jsx #  Reusable page header
│   │   │   └── Breadcrumb.jsx    #   Breadcrumb navigation
│   │   └── ui/                   # Reusable UI primitives
│   │       ├── Badge.jsx         #   Status/label badge (CVA variants)
│   │       ├── Button.jsx        #   Button component (CVA variants)
│   │       ├── Card.jsx          #   Card container with header/content/footer
│   │       ├── Dropdown.jsx      #   Radix dropdown menu wrapper
│   │       ├── Input.jsx         #   Form input component
│   │       ├── Loader.jsx        #   Loading spinner
│   │       └── Modal.jsx         #   Radix dialog wrapper
│   │
│   ├── hooks/
│   │   └── useAccounts.js        # React Query hook for social account management
│   │
│   ├── items/
│   │   └── QueryProvider.js      # TanStack Query client provider (1min stale, 1 retry)
│   │
│   ├── lib/
│   │   ├── api.js                # Axios instance + all API modules (12 API namespaces)
│   │   ├── auth.js               # Auth helpers (token/user localStorage, logout, redirects)
│   │   ├── utils.js              # Utility functions (cn, formatDate, formatNumber, etc.)
│   │   └── validators.js         # Zod schemas (login, signup, campaign, profile, settings)
│   │
│   ├── store/
│   │   ├── authStore.js          # Zustand auth store (user, login, signup, logout, init)
│   │   ├── themeStore.js         # Zustand theme store (light/dark/system, system listener)
│   │   ├── useStore.js           # Zustand UI store (sidebar toggle, online status)
│   │   ├── AuthInit.jsx          # Client component to initialize auth on mount
│   │   └── ThemeInit.jsx         # Client component to initialize theme on mount
│   │
│   └── types/                    # Type definition stubs
│       ├── analytics.js
│       ├── billing.js
│       ├── campaign.js
│       └── user.js
│
├── public/                       # Static assets
│   ├── logo.png                  # Viralix logo
│   ├── viralix_logo.png          # Viralix logo (favicon)
│   ├── hero-dashboard.png        # Landing page hero image
│   ├── facebook.png              # Facebook platform icon
│   ├── instagram.png             # Instagram platform icon
│   ├── tiktok.png                # TikTok platform icon
│   └── youtube.png               # YouTube platform icon
│
├── next.config.js                # Next.js config (remote image patterns)
├── tailwind.config.js            # Tailwind config (shadcn/ui theme tokens)
├── postcss.config.mjs            # PostCSS config
├── jsconfig.json                 # Path aliases (@/ → src/)
├── eslint.config.mjs             # ESLint config
└── package.json                  # Dependencies & scripts
```

---

## All Pages & Routes

### Public Pages

| Route | Description |
|---|---|
| `/` | **Landing Page** — Hero, features, how-it-works, AI tools showcase, testimonials, pricing (Free/Pro/Agency), CTA, footer |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/data-deletion` | Facebook data deletion callback |
| `/guide/instagram-linking` | Instagram account linking tutorial |

### Authentication Pages

| Route | Description |
|---|---|
| `/auth/login` | Email/password login with Google & Facebook OAuth buttons |
| `/auth/signup` | Registration (name, email, password, confirm password) |
| `/auth/verify-otp` | OTP code verification after signup (6-digit code, resend) |
| `/auth/forgot-password` | Request password reset via email |
| `/auth/reset-password` | Set new password using reset token from email |
| `/auth/callback` | OAuth callback — receives token, fetches user, redirects to dashboard |

### Dashboard Pages

| Route | Description |
|---|---|
| `/dashboard` | **Home** — Stats cards (views, engagement, posts, scheduled), recent activity feed, quick actions (Upload, Analytics, Schedule), AI insights |
| `/dashboard/upload` | **Upload & Publish** — Drag-and-drop file upload to Cloudinary, caption/hashtag entry, AI caption generation, platform targeting (Facebook/Instagram/TikTok/YouTube), publish now / schedule / save as draft |
| `/dashboard/preview` | **Content Library** — Lists all posts with status badges (draft/scheduled/published/failed), search and filter, link to individual post detail |
| `/dashboard/preview/[contentId]` | **Post Detail** — View/edit caption, hashtags, media; platform tabs; schedule/publish/delete; engagement metrics (likes, comments, shares, views) |
| `/dashboard/schedule` | **Schedule Calendar** — Calendar view of all scheduled/published posts, connected account status per platform |
| `/dashboard/analytics` | **Analytics Dashboard** — Overview stats (views, engagement rate, likes, followers), charts (Recharts), platform-specific metrics, content performance table, refresh button |
| `/dashboard/platforms` | **Platform Overview** — Grid of all connected platforms with account counts and stats |
| `/dashboard/platforms/facebook` | Facebook page feed with post insights |
| `/dashboard/platforms/facebook/post/[id]` | Individual Facebook post detail & insights |
| `/dashboard/platforms/instagram` | Instagram feed with post insights |
| `/dashboard/platforms/instagram/post/[id]` | Individual Instagram post detail & insights |
| `/dashboard/platforms/tiktok` | TikTok video feed with insights |
| `/dashboard/platforms/tiktok/post/[id]` | Individual TikTok video detail & insights |
| `/dashboard/platforms/youtube` | YouTube video feed with insights |
| `/dashboard/platforms/youtube/post/[id]` | Individual YouTube video detail & insights |
| `/dashboard/connect-accounts` | **Connect Accounts** — OAuth connection management for all platforms, connect/disconnect buttons, account status |
| `/dashboard/connect-accounts/facebook` | Facebook page selection after OAuth |
| `/dashboard/connect-accounts/facebook/[pageId]` | Facebook page detail |
| `/dashboard/connect-accounts/instagram` | Instagram account management |
| `/dashboard/connect-accounts/instagram/[igUserId]` | Instagram account detail |
| `/dashboard/connect-accounts/instagram-oauth` | Instagram OAuth redirect handler |
| `/dashboard/connect-accounts/tiktok` | TikTok OAuth connection |
| `/dashboard/connect-accounts/youtube` | YouTube OAuth connection |
| `/dashboard/editor` | **Media Editor** — Image/video editing (ImageEditor, VideoEditor, ffmpegClient) |
| `/dashboard/settings` | **Settings** — Account settings management |

---

## Detailed Page Descriptions

### Landing Page (`/`)

The public landing page is a full-featured marketing site with seven distinct sections:

1. **Navigation Bar** — Fixed top bar with Viralix logo, nav links (Features, How It Works, AI Tools, Pricing), and Login/Get Started CTA buttons. Uses a semi-transparent backdrop blur effect.

2. **Hero Section** — Full-viewport gradient background (`#2F3E46` → `#354F52`). Includes animated badge ("✨ AI-Powered Platform"), large headline ("Manage Your Social Media with *AI Intelligence*"), subtitle paragraph, two CTA buttons ("Get Started Free" with arrow icon and "See How It Works" outline button), and a dashboard mockup image with a gradient-bordered frame and floating stat cards for "+847 followers this month" and "Engagement up 23%".

3. **Features Grid** — Six feature cards arranged in a 3×2 responsive grid. Each card has a gradient icon container, title, and description. Features covered: Smart Scheduling, AI Content Creation, Multi-Platform Support, Advanced Analytics, Media Editor, Auto-Reply Bot.

4. **How It Works** — Three-step visual guide with numbered circles (1→2→3), connecting lines between steps, and icons. Steps: "Connect Your Accounts" → "Create & Schedule" → "Grow & Analyze". Each step has a description paragraph.

5. **AI Showcase** — Dark-themed section (`#2F3E46` background) highlighting three AI tools: AI Captions (sparkle icon), Smart Hashtags (hash icon), and Content Analytics (chart icon). Each tool displays sample "output" text with a subtle glow effect.

6. **Testimonials** — Three testimonial cards with quoted text, user avatars (using initials), names, and titles. Cards have hover shadow and scale transitions.

7. **Pricing Section** — Three pricing tiers in a card grid:
   - **Free** ($0/mo) — 2 accounts, basic scheduler, limited AI hashtags
   - **Pro** ($19/mo, "Most Popular" badge) — Unlimited accounts, AI generator, full analytics, media editor. Highlighted with primary color border.
   - **Agency** ($49/mo) — All Pro + team collaboration, bulk scheduling, dedicated support

8. **CTA Section** — Final call-to-action with gradient background, large heading, and "Start Your Free Trial" button.

9. **Footer** — Dark footer (`#2F3E46`) with four columns: branding/description, Product links, Company links, Legal links. Includes social media icons (Twitter, Facebook, Instagram, YouTube) and copyright notice.

---

### Auth Pages

#### Login Page (`/auth/login`)

**Layout:** Split-screen design with two equal halves.

- **Left Panel** — Dark gradient background (`#2F3E46` → `#354F52`) with:
  - Viralix logo (clickable, links to `/`)
  - Large welcome headline
  - Descriptive paragraph about the platform
  - Three feature bullets with green check-circle icons: AI-Powered Scheduling, Multi-Platform Management, Advanced Analytics
  - Decorative gradient circle in background

- **Right Panel** — White panel containing the `LoginForm` component:
  - "Welcome back" heading + "Don't have an account? Sign up" link
  - Email input field with envelope icon
  - Password input field with lock icon and show/hide toggle (eye icon)
  - "Forgot password?" link aligned right
  - "Sign In" primary button (full width, gradient background)
  - Divider with "or continue with" text
  - Two social login buttons:
    - "Continue with Google" (Google icon SVG)
    - "Continue with Facebook" (Facebook icon SVG)
  - Loading states on all buttons during submission
  - Error display via `react-hot-toast` notifications

#### Signup Page (`/auth/signup`)

**Layout:** Same split-screen layout as login.

- **Left Panel** — Same branding panel as login with:
  - Viralix logo
  - "Join Viralix" heading
  - Descriptive paragraph
  - Three feature bullets with check-circle icons

- **Right Panel** — `SignupForm` component:
  - "Create your account" heading + "Already have an account? Sign in" link
  - Full Name input with user icon
  - Email input with envelope icon
  - Password input with lock icon and show/hide toggle
  - Confirm Password input with lock icon and show/hide toggle
  - "Create Account" primary button (full width)
  - Divider with "or continue with" text
  - Google and Facebook social signup buttons
  - Real-time validation feedback (react-hook-form + Zod)

#### OTP Verification Page (`/auth/verify-otp`)

**Layout:** Full-screen dark gradient background with centered card.

- **Background** — Dark gradient (`#1a1a2e` → `#2F3E46`) with decorative blurred gradient circles
- **Card** — Centered white card with:
  - Shield/lock icon in a green gradient circle
  - "Verify Your Email" heading
  - Display of the email being verified
  - Single 6-digit OTP input field (centered, large text)
  - "Verify Email" primary button with loading spinner during submission
  - "Didn't receive the code?" text with "Resend Code" button
  - Resend cooldown timer (60 seconds countdown)
  - Error and success messages displayed inline

#### Forgot Password Page (`/auth/forgot-password`)

**Layout:** Split-screen (same shell as login/signup).

- **Left Panel** — Branding panel with Viralix logo, "Reset Password" heading, descriptive text, and visual guide steps (1. Enter email → 2. Check inbox → 3. Create password)

- **Right Panel** — Two-state form:
  - **Default State:**
    - "Forgot your password?" heading
    - Email input field
    - "Send Reset Link" button
    - "Remember your password? Sign in" link
  - **Success State:**
    - Green checkmark icon
    - "Check your email" heading
    - Instructions paragraph with the submitted email
    - "Open email app" button
    - "Back to login" link

#### Reset Password Page (`/auth/reset-password`)

**Layout:** Split-screen layout.

- **Left Panel** — Same branding design

- **Right Panel** — Two-state form:
  - **Default State:**
    - "Set New Password" heading
    - New Password input with show/hide toggle
    - Confirm Password input with show/hide toggle
    - "Reset Password" primary button
    - Error display for token expiration or validation failures
  - **Success State:**
    - Green checkmark icon
    - "Password Reset Successful" heading
    - Success message
    - "Go to Login" button
    - Auto-redirect to login page after 3 seconds

#### OAuth Callback Page (`/auth/callback`)

**Layout:** Full-screen centered loading state.

- Animated green spinner (`#84A98C` border-top color)
- "Completing sign in..." text
- Processes `token` from URL query string
- Stores token in `localStorage`
- Fetches user data via `GET /auth/me`
- Updates `useAuthStore` with user data
- Redirects to `/dashboard` on success
- Redirects to `/auth/login` with error toast on failure

---

### Dashboard Home (`/dashboard`)

**Layout:** Standard dashboard shell with Sidebar + Topbar. Main content area with vertical sections.

1. **Header** — "Dashboard" title, "Welcome back, {userName}!" subtitle, and "Refresh" button with spinning icon animation during loading.

2. **Stats Cards Row** — Four `StatsCard` components in a responsive 4-column grid:
   - **Total Views** — Eye icon, blue gradient icon bg, formatted view count
   - **Engagement Rate** — TrendingUp icon, green gradient bg, percentage value
   - **Posts This Month** — FileText icon, purple gradient bg, post count
   - **Scheduled Posts** — Calendar icon, orange gradient bg, scheduled count
   - Each card shows the metric value prominently and a label below

3. **Recent Activity Feed** — Card listing recent posts:
   - Each post row shows: media thumbnail (image or video icon fallback), post title (truncated), content snippet (2-line clamp), status badge (draft/scheduled/published with color coding), platform icons, and creation date
   - "View All" link to `/dashboard/preview`
   - Empty state with illustration + "Create your first post" CTA if no posts exist

4. **Quick Actions Section** — Three action cards:
   - **Upload Content** — Upload icon, gradient bg, links to `/dashboard/upload`
   - **View Analytics** — BarChart icon, links to `/dashboard/analytics`
   - **Schedule Post** — Calendar icon, links to `/dashboard/schedule`

5. **Connect Accounts Modal** — Modal that appears if no social accounts are connected:
   - Warning icon
   - "Connect Your Social Accounts" heading
   - Descriptive text explaining the need to connect accounts
   - "Connect Accounts" primary button linking to `/dashboard/connect-accounts`
   - "Maybe Later" dismiss button

---

### Upload & Publish Page (`/dashboard/upload`)

**Layout:** Two-tab interface with "Upload" and "Media Library" tabs at the top.

#### Upload Tab

Multi-section form with vertical layout:

1. **Media Upload Section:**
   - Drag-and-drop zone with dashed border, cloud-upload icon, "Drag & drop your files here" instruction, "Browse Files" button
   - Accepts images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, AVI, MKV)
   - File size limit display
   - Upload progress bar per file during Cloudinary upload
   - **Media Preview Grid** — Thumbnails of uploaded files with:
     - Image preview or video icon placeholder
     - File name and size label
     - Remove (×) button per item
     - Play icon overlay for video thumbnails

2. **Content Details Section:**
   - **Title** input field with character count
   - **Description / Caption** textarea with character count
   - **AI Caption Generator** — Expandable section with:
     - Topic input
     - Tone selector dropdown (Professional, Casual, Humorous, Inspirational)
     - Platform selector (Facebook, Instagram, TikTok, YouTube)
     - "Generate Caption" button with sparkle icon
     - Generated caption display with "Use This" and "Regenerate" buttons
   - **Tags** input with add/remove chip functionality
   - **Category** dropdown selector

3. **Platform Selection Section:**
   - Grid of platform cards (Facebook, Instagram, TikTok, YouTube)
   - Each card shows: platform icon, platform name, connection status indicator (green dot = connected, gray = not connected)
   - Toggle-select interaction — clicking toggles platform selection
   - Disabled state for unconnected platforms with "Connect" link
   - **TikTok-Specific Settings** (visible when TikTok is selected):
     - Privacy Level dropdown (Public, Friends, Self Only)
     - Disable Duet toggle
     - Disable Stitch toggle
     - Brand Content toggle
     - Brand Organic toggle

4. **Scheduling Options:**
   - Three radio options: "Publish Now", "Schedule for Later", "Optimal Time"
   - **Schedule for Later** reveals: Date picker and Time picker inputs
   - **Optimal Time** displays: AI-suggested optimal posting time

5. **Action Buttons Row:**
   - "Save as Draft" — Outline button (left-aligned)
   - "Publish Now" / "Schedule" — Primary gradient button (right-aligned, label changes based on schedule selection)
   - Loading spinners on buttons during API calls

#### Media Library Tab

- Grid/gallery view of previously uploaded media files
- Each item shows: thumbnail, filename, upload date
- Click to select media for the current post
- Delete button per media item

---

### Content Preview — List Page (`/dashboard/preview`)

**Layout:** Two-column layout (2:1 ratio on desktop).

1. **Header** — "Content Preview" title, "Preview and manage your content across platforms" subtitle, and "Create Post" gradient button (links to `/dashboard/schedule`).

2. **Stats Cards Row** — Four summary cards in a responsive grid:
   - **Total Posts** — Eye icon, green gradient bg, total count
   - **Published** — BarChart icon, green gradient bg, published count
   - **Scheduled** — Calendar icon, yellow gradient bg, scheduled count
   - **Drafts** — FileText icon, gray gradient bg, draft count

3. **Main Content Area (Left Column):**

   - **Search & Filter Bar:**
     - Search input with magnifying glass icon and live text filtering
     - Status filter dropdown (All Status, Draft, Scheduled, Published, Failed)
     - Refresh button with rotating icon

   - **Posts List:**
     - Each post row contains:
       - **Thumbnail** (96×96px) — Image preview, video icon (🎬) for videos, or FileText icon placeholder
       - **Content Info:** Post title (bold, truncated), content snippet (2-line clamp), creation date with calendar icon, platform icons row (shows up to 4 platforms with "+N" overflow indicator)
       - **Status Badge** — Color-coded pill (gray=Draft, yellow=Scheduled, green=Published, red=Failed)
       - **Action Buttons:** "Preview" gradient button (links to `/dashboard/preview/[id]`), "Edit" outline button (for drafts, links to `/dashboard/editor?id=[id]`)
     - **Empty State:** Icon + "No content yet" / "No posts found" heading, descriptive text, "Create Your First Post" CTA button

4. **Sidebar (Right Column):**

   - **Quick Actions Card:**
     - "Upload New" — Upload icon, green tinted bg, links to `/dashboard/upload`
     - "Schedule Post" — Calendar icon, green tinted bg, links to `/dashboard/schedule`
     - "Analytics" — BarChart icon, purple tinted bg, links to `/dashboard/analytics`

   - **Connected Platforms Card:**
     - Four platform rows (Facebook, Instagram, TikTok, YouTube)
     - Each row: platform icon in a bordered container, platform name, green/gray status dot
     - "Manage Connections" button at bottom (links to `/dashboard/connect-accounts`)

---

### Content Preview — Detail Page (`/dashboard/preview/[contentId]`)

**Layout:** Five-column grid (3:2 ratio on XL screens). Rich editing + preview interface.

1. **Header Bar** — White card with:
   - Back button (arrow icon, links to `/dashboard/preview`)
   - Post title (bold, truncated) with "Content preview & editor" subtitle
   - **Stats Badge:** Platforms count / Published count display
   - **Status Badge:** Gradient-colored pill showing current status (Draft=gray, Scheduled=yellow, Published=green, Processing=purple with spinning icon)

2. **Main Preview Area (Left — 3 columns):**

   - **Platform Preview Card:**
     - Header: "Platform Preview" title + Eye icon
     - `PlatformTabs` component: Tabbed interface showing how the post appears on each targeted platform. Each tab renders the post in the native visual style of that platform.

   - **Platform Status Cards** (shown when platforms exist):
     - Header: "Platform Status" with chart icon
     - Grid of per-platform status cards, each showing:
       - Platform icon (image-based), platform name (capitalized), truncated account ID
       - Status badge: gradient-colored pill (Published=green, Scheduled=yellow, Failed=red, Processing=purple with spinner, Draft=gray)
       - Error message display (red alert box with AlertCircle icon) if publishing failed

3. **Sidebar (Right — 2 columns):**

   - **Post Details Card:**
     - Title input field (editable, disabled when all platforms are published)
     - Green border when title has content, neutral border when empty

   - **Platform Selector Card** (hidden when all published):
     - "Select Platforms" heading with globe icon
     - `PlatformSelector` component: Checkbox-style selection for remaining unpublished platforms
     - Changes are auto-saved via `updatePost` API call

   - **Caption & Hashtags Card** (hidden when all published):
     - "Caption & Hashtags" heading with hashtag icon
     - `CaptionEditor` component: Textarea for editing caption content
     - AI-powered caption and hashtag generation integrated
     - Auto-saves changes on edit

   - **Actions Card** (hidden when all published):
     - Informational banner (shown when partially published): "Some platforms are already published. Actions will apply to unpublished platforms only."
     - Four full-width action buttons:
       - **Schedule Post / Schedule Remaining** — Green gradient, Calendar icon, opens `ScheduleModal`
       - **Publish Now / Publish Remaining** — Green gradient, Send icon, immediate publish
       - **Save as Draft** — Outlined, Save icon
       - **Delete Post** — Red gradient, Trash icon, confirmation dialog before deletion
     - All buttons show loading spinners during API calls and are disabled when no platforms selected

   - **Insights Card** (shown only for published platforms):
     - "Insights" heading with BarChart icon
     - "Refresh" button with spinning RefreshCw icon during data fetch
     - Per-platform metrics cards showing:
       - Platform icon, name, and publish date
       - 2×2 metric grid:
         - **Views** — Blue card, Eye icon, formatted count
         - **Likes** — Red card, Heart icon, formatted count
         - **Comments** — Green card, MessageCircle icon, formatted count
         - **Shares** — Purple card, Share2 icon, formatted count
       - "Last updated" timestamp at bottom
     - Each metric card has hover scale animation

4. **Schedule Modal** — `ScheduleModal` component overlay:
   - Date picker input
   - Time picker input
   - "Confirm Schedule" button
   - "Cancel" button
   - Loading spinner during scheduling API call

5. **Auto-Refresh:** If any platform has `processing` status, the page auto-refreshes every 3 seconds to poll for status updates.

---

### Schedule Calendar Page (`/dashboard/schedule`)

**Layout:** Two-column layout with main calendar area and sidebar.

1. **Header** — "Content Calendar" title with subtitle.

2. **Main Area — Calendar View:**
   - `CalendarView` component powered by a calendar library
   - Displays posts as events on calendar dates
   - Color-coded entries by status (scheduled, published)
   - Clicking a date/event shows post details
   - Month/week navigation controls

3. **Sidebar:**

   - **Quick Stats Card:**
     - Scheduled posts count
     - Published posts count
     - Total posts count

   - **Connected Platforms Card:**
     - Platform rows for Facebook, Instagram, TikTok, YouTube
     - Each row: platform icon, platform name, connection status (green "Connected" badge or gray "Not connected")
     - Toggle display for showing/hiding posts from specific platforms on the calendar

---

### Analytics Dashboard (`/dashboard/analytics`)

**Layout:** Full-width vertical sections with responsive grid.

1. **Header** — "Analytics Dashboard" title, "Track your performance across all platforms" subtitle, and "Refresh Data" button with spinning icon animation.

2. **Overview Stats** — Four stats cards in a responsive grid:
   - **Total Views** — Eye icon, formatted number, gradient icon background
   - **Engagement Rate** — TrendingUp icon, percentage display
   - **Total Likes** — Heart icon, formatted number
   - **Followers** — Users icon, formatted follower count
   - Each card has hover shadow transition and value change indicator

3. **Analytics Charts** — `AnalyticsCharts` component:
   - Recharts-powered line/bar charts
   - Time series data for views, engagement, and growth
   - Platform comparison visualizations
   - Date range selector / time period toggle

4. **Platform Metrics** — `PlatformMetrics` component:
   - Per-platform breakdown cards for each connected platform
   - Platform icon, name, and key metrics (followers, posts, engagement rate)
   - Visual progress indicators or sparkline charts per platform

5. **Content Performance** — `ContentPerformance` component:
   - Table/list of top-performing posts
   - Columns: Post title, platform, views, likes, comments, shares, engagement rate
   - Sortable columns
   - Links to individual post detail pages

6. **Loading State** — Centered spinner with "Loading analytics..." text
7. **Error State** — Red alert box with error message and retry option

---

### Platform Management Page (`/dashboard/platforms`)

**Layout:** Max-width container with header, platform grid, and quick actions.

1. **Header** — "Platform Management" title, "View and manage your connected social media accounts" subtitle.

2. **Platform Grid** — 2-column responsive grid of platform cards. Each card is a clickable `Link` to `/dashboard/platforms/[platformId]`:

   - **Instagram Card** — Instagram icon (image-based, in pink-50 bg), "Instagram" name, "Photos, Stories, and Reels" description, gradient-to-pink connection status badge (green "Connected" with dot / gray "Not connected"), follower count (formatted with K/M suffix) or "Connect account →" link. Card has hover shadow + scale animation on icon.

   - **TikTok Card** — TikTok icon (in gray-100 bg), "TikTok" name, "Short-form videos" description, same status/stats pattern.

   - **YouTube Card** — YouTube icon (in red-50 bg), "YouTube" name, "Videos and Shorts" description, same pattern.

   - **Facebook Card** — Facebook icon (in blue-50 bg), "Facebook" name, "Posts, Photos, and Videos" description, same pattern.

3. **Loading State** — Centered spinner with branded border-top color (`#84A98C`), "Loading platforms..." text.

4. **Quick Actions Card** — White card at bottom with:
   - "Quick Actions" heading
   - Three buttons:
     - "Connect New Account" — Green gradient primary button (links to `/dashboard/connect-accounts`)
     - "View All Analytics" — Outline button (links to `/dashboard/analytics`)
     - "Create Post" — Outline button (links to `/dashboard/schedule`)

---

### Connect Accounts Page (`/dashboard/connect-accounts`)

**Layout:** Full-width content area with vertical sections.

1. **Header** — "Connect Your Accounts" title, subtitle text explaining platform connections.

2. **Instagram Guide Banner** — Info banner explaining that Instagram Business accounts must be linked to a Facebook Page. Includes a link to the `/guide/instagram-linking` tutorial page.

3. **Platform Connection Cards** — Vertical stack of platform-specific sections:

   #### Facebook Section
   - Facebook icon with blue gradient bg
   - "Facebook" heading + "Connect your Facebook Pages" description
   - **Connected State:** Page name, page ID, follower count, "Disconnect" red button, "Manage Pages" link
   - **Disconnected State:** "Connect Facebook" blue gradient button initiating OAuth flow
   - Connection diagnostics link for troubleshooting

   #### Instagram Section
   - Instagram icon with pink/purple gradient bg
   - "Instagram" heading + "Connect your Instagram Business account" description
   - **Connected State:** Account username, account ID, follower count, "Disconnect" red button
   - **Disconnected State:** "Connect Instagram" gradient button
   - Note about requiring Facebook Page linkage

   #### TikTok Section
   - TikTok icon with black bg
   - "TikTok" heading + "Connect your TikTok account" description
   - **Connected State:** Display name, follower count, "Disconnect" button
   - **Disconnected State:** "Connect TikTok" dark button initiating OAuth

   #### YouTube Section
   - YouTube icon with red gradient bg
   - "YouTube" heading + "Connect your YouTube channel" description
   - **Connected State:** Channel name, subscriber count, "Disconnect" button
   - **Disconnected State:** "Connect YouTube" red gradient button initiating OAuth

4. **Each Platform Card Features:**
   - Platform-branded icon and color scheme
   - Connection status indicator (green dot + "Connected" / gray + "Not connected")
   - Toggle between connected/disconnected UI states
   - Disconnect confirmation before removing connection
   - Loading state during OAuth and disconnect operations
   - Error handling with toast notifications

---

### Media Editor Page (`/dashboard/editor`)

**Layout:** Currently a placeholder/stub page.

- **Planned Components:**
  - `ImageEditor` — In-app image editing capabilities
  - `VideoEditor` — In-app video editing using ffmpeg client
  - `ffmpegClient` — Client-side video processing utility

- **Status:** The main `page.jsx` is minimal. Full editor functionality is implemented in the sub-components but the page integration is pending.

---

### Settings Page (`/dashboard/settings`)

**Layout:** Container page wrapping the `AccountSettings` component.

- **Page Title** — "Settings" heading
- **AccountSettings Component** — Form-based settings interface including:
  - **Profile Section:** Name, email, bio fields
  - **Notification Preferences:** Toggle switches for email notifications, push notifications, weekly reports
  - **Theme Selection:** Radio/select for Light, Dark, or System theme (integrates with `useThemeStore`)
  - **Timezone Selection:** Dropdown for user timezone
  - **Save Changes** button with loading state
  - Form validation via Zod `settingsSchema`

---

## Features

### 🔐 Authentication & Security
- Email/password registration and login
- **Google OAuth** login/signup
- **Facebook OAuth** login/signup
- OTP email verification on signup
- Forgot/reset password via email link
- JWT token-based authentication (stored in localStorage)
- Auth state persistence with Zustand + localStorage

### 📱 Multi-Platform Social Media Management
- **Facebook** — Page management, post/photo/video creation, page feed, page insights, post insights
- **Instagram** — Account management, feed view, media publishing by URL, account insights, media insights
- **TikTok** — OAuth connection, video listing, video publishing with privacy/duet/stitch/brand settings, video insights
- **YouTube** — OAuth connection, channel info, video listing, video publishing with title/description/tags/privacy, video insights
- Platform status monitoring and token refresh

### 📤 Content Upload & Publishing
- Drag-and-drop multi-file upload (images & videos)
- Upload to **Cloudinary** via server proxy
- Media library with gallery view
- Cross-platform targeting (select which platforms to publish to)
- **Publish Now** — Immediate publishing to selected platforms
- **Schedule** — Set future date/time for automated publishing
- **Save as Draft** — Save content for later editing

### 🗓️ Scheduling & Calendar
- Visual calendar view of scheduled and published content
- Per-platform connected account status display
- Schedule modal with date and time picker

### 📊 Analytics & Insights
- **Overview Dashboard** — Total views, engagement rate, likes, followers
- **Analytics Charts** — Visual charts powered by Recharts
- **Platform Metrics** — Per-platform breakdown (Facebook, Instagram, TikTok, YouTube)
- **Content Performance** — Post-level performance metrics
- **Refresh Analytics** — Manual data refresh from platforms
- **Post-level Insights** — Detailed engagement metrics per individual post

### 🤖 AI-Powered Tools
- **AI Caption Generator** — Generate captions by topic, tone, and platform
- **AI Hashtag Generator** — Generate relevant hashtags by topic, platform, and count
- **AI Content Rewriter** — Rewrite text with different tone and platform optimization
- AI insights on the dashboard (performance trends, engagement tips)

### 🎨 Media Editor
- **Image Editor** component
- **Video Editor** component with ffmpeg client
- In-app media editing before publishing

### 💬 Auto-Reply (Facebook & Instagram)
- **Facebook Auto-Reply** — Create comment auto-reply rules
- **Instagram Auto-Reply** — Create, update, delete, toggle auto-reply rules per post

### 🔗 Account Connection Management
- Centralized connect/disconnect page for all platforms
- OAuth flow for Facebook, Instagram, TikTok, YouTube
- Platform-specific account detail pages
- Default page selection (Facebook)
- Connection diagnostics (Facebook)

### ⚙️ Settings & Preferences
- Account settings management
- Theme support (Light / Dark / System) with automatic system theme detection

### 📝 Content Management (Preview)
- Content library with all posts
- Status-based filtering (draft, scheduled, published, failed)
- Individual post editing (caption, hashtags, media, platforms)
- Post deletion
- Engagement metrics display

---

## API Layer Architecture

The API layer (`src/lib/api.js`) uses **Axios** with a centralized instance. All API calls include JWT token authentication via request interceptors.

### API Modules

| Module | Prefix | Purpose |
|---|---|---|
| `authAPI` | `/auth` | Login, signup, OTP verify, forgot/reset password, session |
| `postsAPI` | `/posts` | CRUD for posts, publish now |
| `campaignsAPI` | `/campaigns` | CRUD for campaigns, scheduling |
| `analyticsAPI` | `/analytics` | Overview, platform metrics, content performance, refresh |
| `aiAPI` | `/ai` | Caption generation, hashtag generation, content rewriting |
| `platformsAPI` | `/platforms` | Connected platforms, connect/disconnect/sync |
| `facebookAPI` | `/facebook` | OAuth, pages, feed, insights, post/photo/video publishing |
| `facebookAutoReplyAPI` | `/facebook-auto-reply` | Auto-reply rules |
| `instagramAPI` | `/instagram` | Status, profile, feed, insights, publishing, auto-reply |
| `tiktokAPI` | `/tiktok-oauth` | OAuth, account, videos, publishing, insights |
| `youtubeAPI` | `/youtube-oauth` | OAuth, account, videos, publishing, insights |
| `uploadAPI` | `/upload` | Media upload (Cloudinary), media listing, deletion |
| `platformSyncAPI` | `/platform-sync` | Sync all platforms, sync specific, get synced content |

**Backend URL:** `https://viralix-b3ff86cb412f.herokuapp.com/api`

---

## State Management

### Zustand Stores

| Store | File | Purpose |
|---|---|---|
| `useAuthStore` | `src/store/authStore.js` | User object, login/signup/logout actions, init from `/auth/me`, localStorage persistence |
| `useThemeStore` | `src/store/themeStore.js` | Theme preference (light/dark/system), system theme detection, class toggling on `<html>` |
| `useStore` | `src/store/useStore.js` | UI state — sidebar toggle, online/offline status |

### React Query (TanStack Query)

- **Provider:** `src/items/QueryProvider.js`
- **Stale time:** 60 seconds
- **Retry:** 1 attempt
- **Refetch on window focus:** Disabled
- **Dev Tools:** Enabled in development

### Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| `useAccounts` | `src/hooks/useAccounts.js` | Fetches connected social accounts via React Query, provides disconnect mutation with automatic cache invalidation |

---

## Form Validation (Zod Schemas)

| Schema | Fields | Rules |
|---|---|---|
| `loginSchema` | email, password | Valid email, password ≥ 8 chars |
| `signupSchema` | name, email, password, confirmPassword | name ≥ 2 chars, passwords must match |
| `forgotPasswordSchema` | email | Valid email |
| `resetPasswordSchema` | password, confirmPassword | password ≥ 8 chars, must match |
| `campaignSchema` | title, description, caption, hashtags, platforms, publishAt | At least 1 platform, future date |
| `profileSchema` | name, email, bio | name ≥ 2, bio ≤ 500 chars |
| `settingsSchema` | emailNotifications, pushNotifications, weeklyReports, theme, timezone | Theme enum, boolean toggles |

---

## UI Component Library

### Layout Components (`src/components/layout/`)

| Component | Description |
|---|---|
| `Sidebar` | Collapsible sidebar with navigation links, expandable platform sub-menu, Viralix branding |
| `Topbar` | Top bar with hamburger toggle, search, user menu |
| `DashboardHeader` | Reusable page header with title and actions |
| `Breadcrumb` | Breadcrumb navigation based on current path |

### UI Primitives (`src/components/ui/`)

| Component | Description |
|---|---|
| `Button` | CVA-based button with size/variant props |
| `Card` | Card container with `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription` |
| `Badge` | Status badge with variant styling |
| `Modal` | Radix Dialog wrapper with `ModalContent`, `ModalHeader`, `ModalTitle`, `ModalDescription` |
| `Dropdown` | Radix Dropdown Menu wrapper |
| `Input` | Form input with forwardRef |
| `Loader` | Spinning loader component |

---

## Brand & Design

| Property | Value |
|---|---|
| **App Name** | Viralix |
| **Tagline** | "Manage. Create. Grow. With Viralix." |
| **Primary Color** | `#84A98C` (sage green) |
| **Dark Accent** | `#354F52` (dark teal) |
| **Secondary** | `#52796F` (medium teal) |
| **Light Background** | `#CAD2C5` (light sage) |
| **Page Background** | `#F7FAF8` (off-white green) |
| **Footer Background** | `#2F3E46` (dark charcoal) |
| **Fonts** | Geist Sans, Geist Mono (Inter/Poppins on landing) |
| **Logo** | `/public/logo.png`, `/public/viralix_logo.png` |

---

## Pricing Tiers (Landing Page)

| Plan | Price | Features |
|---|---|---|
| **Free** | $0 | 2 connected accounts, basic scheduler, limited AI hashtags |
| **Pro** | $19/month | Unlimited accounts, AI hashtag + content generator, full analytics, media editor |
| **Agency** | $49/month | All Pro features, team collaboration, bulk scheduling, dedicated support |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd client-autoreach-ai

# Install dependencies
npm install

# Run development server
npm run dev
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start Next.js dev server |
| `build` | `npm run build` | Build for production |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://viralix-b3ff86cb412f.herokuapp.com/api` | Backend API base URL |

---

## Key Architecture Decisions

1. **App Router (Next.js 15)** — Uses the `app/` directory with file-based routing, layouts, and client components
2. **Token-based auth** — JWT stored in `localStorage`, attached via Axios interceptor
3. **Zustand for local state** — Separate stores for auth, theme, and UI state with localStorage persistence
4. **React Query for server state** — Caching, staleness, automatic refetching for social account data
5. **CVA (Class Variance Authority)** — For component variant management (Button, Badge)
6. **Radix UI** — Accessible primitives for Modal, Dropdown, Select, Tabs
7. **Cloudinary** — Media storage via server-proxied upload (multipart/form-data)
8. **OAuth flows** — Facebook, Instagram, TikTok, YouTube with per-platform OAuth handlers and callback pages
