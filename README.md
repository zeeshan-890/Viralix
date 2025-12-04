# Viralix - AI-Powered Social Media Management Platform

<p align="center">
  <img src="public/logo.png" alt="Viralix Logo" width="120" />
</p>

<p align="center">
  <strong>Manage. Create. Grow.</strong><br/>
  The all-in-one AI-powered platform to manage, schedule, and analyze your social media effortlessly.
</p>

---

## 🚀 Overview

Viralix is a modern social media management platform built with **Next.js 15** and **React 19**. It enables content creators, marketers, and businesses to streamline their social media workflow with AI-powered content generation, multi-platform publishing, and comprehensive analytics.

## ✨ Features

### 🤖 AI-Powered Content Creation
- **Smart Caption Generator** — Generate engaging, platform-optimized captions using Google Gemini AI
- **Hashtag Suggestions** — Get relevant hashtags to maximize reach and discoverability
- **Content Rewriter** — Transform existing text with different tones (professional, witty, concise)

### 📱 Multi-Platform Integration
- **Instagram Publishing** — Direct OAuth & Facebook-linked Instagram Business/Creator accounts
- **Facebook Pages** — Full support for page management and content publishing
- **Unified Dashboard** — Manage all connected accounts from a single interface

### 📤 Content Management
- **Media Upload** — Support for images and videos via Cloudinary CDN
- **Post Composer** — Rich editor with real-time preview
- **Draft System** — Save work-in-progress content for later
- **Media Library** — Organized storage for all uploaded assets

### 📅 Scheduling & Publishing
- **Instant Publishing** — Publish content immediately to connected platforms
- **Scheduled Posts** — Plan content for optimal posting times
- **Calendar View** — Visual overview of scheduled and published content
- **Multi-Account Targeting** — Select specific pages/accounts per post

### 📊 Analytics Dashboard
- **Performance Metrics** — Track views, likes, engagement rate, and followers
- **Platform Insights** — Detailed analytics per connected account
- **Content Performance** — Analyze which posts perform best
- **Interactive Charts** — Visual data representation with Recharts

### 🔐 Authentication & Security
- **JWT Authentication** — Secure token-based auth system
- **OAuth 2.0** — Secure social platform connections
- **OTP Verification** — Email-based two-step verification
- **Password Recovery** — Secure forgot password flow

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) (Dialog, Dropdown, Select, Tabs) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) |

## 📁 Project Structure

```
client-autoreach-ai/
├── app/                          # Next.js App Router
│   ├── page.jsx                  # Landing page
│   ├── layout.jsx                # Root layout with metadata
│   ├── globals.css               # Global styles
│   │
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login with form validation
│   │   ├── signup/               # Registration with OTP flow
│   │   ├── verify-otp/           # Email verification
│   │   ├── forgot-password/      # Password recovery
│   │   └── callback/             # OAuth callback handler
│   │
│   ├── dashboard/                # Main application
│   │   ├── page.jsx              # Dashboard overview
│   │   ├── layout.jsx            # Dashboard layout with sidebar
│   │   ├── upload/               # Content upload & composer
│   │   ├── schedule/             # Calendar & scheduling
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── connect-accounts/     # Social platform connections
│   │   ├── settings/             # User settings
│   │   ├── preview/              # Post preview
│   │   └── editor/               # Content editor
│   │
│   ├── admin/                    # Admin panel
│   ├── engagement/               # Engagement tools
│   ├── privacy/                  # Privacy policy
│   ├── terms/                    # Terms of service
│   └── data-deletion/            # Data deletion requests
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Loader.jsx
│   │   └── layout/               # Layout components
│   │
│   ├── lib/
│   │   ├── api.js                # API client & endpoints
│   │   ├── auth.js               # Auth utilities
│   │   ├── utils.js              # Helper functions
│   │   └── validators.js         # Form validation schemas
│   │
│   ├── store/
│   │   ├── authStore.js          # Authentication state (Zustand)
│   │   ├── themeStore.js         # Theme state
│   │   ├── AuthInit.jsx          # Auth initialization component
│   │   └── ThemeInit.jsx         # Theme initialization component
│   │
│   └── types/                    # Type definitions
│       ├── user.js
│       ├── campaign.js
│       ├── analytics.js
│       └── billing.js
│
└── public/                       # Static assets
    ├── logo.png
    ├── viralix_logo.png
    └── hero-dashboard.png
```

## 🔧 API Integration

The client communicates with a Node.js/Express backend through organized API modules:

```javascript
// Available API modules
import { 
  authAPI,        // Authentication (login, signup, logout, OTP)
  postsAPI,       // Post management (CRUD, publish, schedule)
  analyticsAPI,   // Analytics data retrieval
  aiAPI,          // AI content generation (captions, hashtags)
  facebookAPI,    // Facebook OAuth & page management
  instagramAPI,   // Instagram OAuth & publishing
  uploadAPI,      // Media upload to Cloudinary
  platformsAPI    // Platform connection management
} from '@/lib/api';
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend server running (see server-autoreach-ai)

### Installation

```bash
# Clone the repository
git clone https://github.com/zeeshan-890/client-autoreach-ai.git

# Navigate to the project
cd client-autoreach-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file (optional - API URL defaults to production):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🎨 UI Components

Custom UI component library built on Radix UI primitives:

- **Button** — Multiple variants (primary, secondary, ghost, outline)
- **Card** — Container with header, content, and footer slots
- **Input** — Form input with label and error states
- **Modal** — Accessible dialog component
- **Dropdown** — Menu and select components
- **Badge** — Status indicators
- **Loader** — Loading spinner

## 📱 Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/auth/login` | User login |
| `/auth/signup` | User registration |
| `/auth/verify-otp` | Email verification |
| `/dashboard` | Main dashboard with stats overview |
| `/dashboard/upload` | Create and publish content |
| `/dashboard/schedule` | Calendar view of scheduled posts |
| `/dashboard/analytics` | Performance analytics |
| `/dashboard/connect-accounts` | Connect Instagram/Facebook |
| `/dashboard/settings` | User preferences |

## 🔗 Related

- **Backend Repository**: [server-autoreach-ai](../server-autoreach-ai) — Express.js API server

## 📄 License

MIT © Zeeshan

---

<p align="center">
  Built with love using Next.js, React, and Tailwind CSS
</p>
