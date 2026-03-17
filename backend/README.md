<p align="center">
  <h1 align="center">🚀 AutoReach AI — Server</h1>
  <p align="center">
    <strong>Multi-Platform Social Media Management & Automation Backend</strong>
  </p>
  <p align="center">
    Built with Node.js · Express · MongoDB · Redis · Bull Queue · Google Gemini AI
  </p>
</p>

---

AutoReach AI (Viralix) is a production-grade backend server for managing, scheduling, publishing, and analyzing social media content across **Facebook**, **Instagram**, **TikTok**, and **YouTube** — all from a single unified API. It features AI-powered content generation, automated comment replies via webhooks, background job processing, and comprehensive analytics.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Reference](#-api-reference)
  - [Authentication](#authentication-api-auth)
  - [User Management](#user-management-api-users)
  - [Posts](#posts-api-posts)
  - [Media Upload](#media-upload-api-upload)
  - [AI Content Generation](#ai-content-generation-api-ai)
  - [Platform Connections](#platform-connections)
  - [Instagram](#instagram-api-instagram)
  - [Facebook](#facebook-api-facebook)
  - [TikTok](#tiktok-api-tiktok-oauth)
  - [YouTube](#youtube-api-youtube-oauth)
  - [Analytics](#analytics-api-analytics)
  - [Platform Sync](#platform-sync-api-platform-sync)
  - [Auto-Reply Automation](#auto-reply-automation)
  - [Insights](#insights)
- [Data Models](#-data-models)
- [Services & Business Logic](#-services--business-logic)
- [Background Job Processing](#-background-job-processing)
- [Security](#-security)
- [Error Handling](#-error-handling)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 📝 1. Content Management

Full lifecycle management for social media posts — from creation to publishing across multiple platforms.

- **Post CRUD Operations** — Create, read, update, and delete posts through a RESTful API. Each post supports a title, body content, hashtags, mentions, and multiple media attachments (images and videos). Posts are scoped per user with ownership-based authorization checks on every operation.
- **Rich Media Attachments** — Posts can include multiple media files (images and videos) uploaded via Cloudinary. Each media item stores its type, URL, public ID, original filename, file size, dimensions, and duration (for videos). Media is automatically cleaned up from Cloudinary when a post is deleted.
- **Post Scheduling** — Posts can be scheduled for future publishing by setting `isScheduled: true` and providing a `scheduledDate`. A background cron job (`node-cron`) runs every minute to check for posts that are due, automatically creating `PublishJob` records and enqueueing them to the Bull queue for execution.
- **Draft & Publish Workflow** — Posts follow a clear lifecycle: `draft` → `scheduled` → `processing` → `published` (or `failed` / `partially_failed`). Each platform target within a post tracks its own independent status, allowing a single post to be published on Facebook but failed on TikTok, for example.
- **Per-Platform Status Tracking** — Every post maintains an array of platform targets, each tracking: platform name, account ID, publishing status, platform-specific post ID (after publishing), published timestamp, error messages, and engagement metrics (likes, comments, shares, views).
- **Hashtag & Mention Support** — Posts can store arrays of hashtags and mentions, enabling organized content tagging and audience targeting across platforms.
- **AI Generation Flags** — Posts track whether their content was AI-generated (via the `aiGenerated` boolean and `aiPrompt` fields), enabling filtering and analytics on AI-assisted content.
- **TikTok-Specific Settings** — Posts can store TikTok-specific publishing options including privacy level, comment/duet/stitch toggles, commercial content disclosure flags, and branded content settings.
- **Paginated Listing** — Posts support paginated retrieval with configurable page size, month-based filtering, and status filtering. Queries are optimized with MongoDB indexes and return pagination metadata.

---

### 📘 2. Multi-Platform Publishing

Publish content simultaneously to **Facebook**, **Instagram**, **TikTok**, and **YouTube** through a unified publishing pipeline built on the Factory + Strategy design pattern.

#### Facebook Publishing
- Publishes to **Facebook Pages** (not personal profiles) via the Graph API v19.0
- Supports three content types: **text posts**, **photo posts** (with image URL), and **video posts** (with video URL)
- Automatically resolves the correct **Page Access Token** from the user's connected Facebook account
- Supports selecting a default page for quick publishing
- Page management includes listing, refreshing, and auto-subscribing pages to webhooks

#### Instagram Publishing
- Supports **two authentication methods**: Direct Instagram OAuth and Facebook-linked Instagram accounts
- Publishes **images** via media container creation → publish flow
- Publishes **videos as Reels** using the Instagram Reels API with media container status polling (waits up to 60 seconds for processing)
- Automatically handles **token refresh** for expired Direct OAuth tokens before publishing
- Falls back between Direct and Facebook-linked methods based on the account type

#### TikTok Publishing
- Supports **three upload methods**:
  - **Direct Publish** — Videos published immediately with customizable privacy levels (`public_to_everyone`, `mutual_follow_friends`, `follower_of_creator`, `self_only`)
  - **Inbox/Draft Publish** — Videos uploaded to the creator's inbox for manual review before posting
  - **Chunked File Upload** — Large video files split into chunks for reliable upload over poor connections
- Configurable publishing options: disable comments, disable duets, disable stitches
- **Commercial content disclosure** support: branded content and organic brand promotion flags (with validation that branded content cannot be private)
- Queries **creator info** to check posting capabilities and daily limits before publishing

#### YouTube Publishing
- Uploads videos using Google's **resumable upload protocol** — downloads the video from a URL and streams it to YouTube in chunks
- Videos are created with full metadata: title, description, tags, category ID, privacy status (`public`, `unlisted`, `private`), and `madeForKids` flag
- Automatically handles **token refresh** before upload if the current token is expired

#### Publishing Pipeline
- All platforms use a **BasePublisher** abstract class that enforces a consistent interface: `resolveAuth()` → `validateContent()` → `publish()` → `formatResponse()`
- The **PublisherFactory** instantiates the correct publisher based on the platform name
- Each publisher handles its own token resolution, refresh logic, and platform-specific API calls
- Publishing is executed in **parallel** across platforms using `Promise.allSettled`, so a failure on one platform doesn't block others

---

### 🤖 3. AI-Powered Content Generation

Integrates with **Google Generative AI (Gemini 2.5 Flash)** to provide intelligent content creation assistance.

- **Caption Generation** — Generate natural, engaging captions by providing a topic, desired tone (e.g., professional, casual, humorous), and target platform. The AI is prompted to produce platform-appropriate captions without hashtags or emojis, keeping output concise and natural.
- **Hashtag Suggestions** — Generate relevant, trending hashtags for any topic. Accepts an optional platform parameter to tailor hashtags to platform conventions and a count parameter to control how many hashtags are returned. Returns a parsed JSON array of hashtag strings.
- **Text Rewriting** — Rewrite existing text with a different tone while preserving the original meaning. Useful for adapting a single piece of content across different platforms (e.g., professional for LinkedIn, casual for Instagram).
- **Rate Limited** — AI endpoints are rate-limited to 20 requests per minute per IP to prevent API abuse and control costs.
- **Error Handling** — All AI calls are wrapped in try/catch blocks with meaningful error messages returned to the client, preventing AI service outages from crashing the application.

---

### 📊 4. Analytics & Insights

Comprehensive analytics system that aggregates engagement data across all connected platforms and provides detailed per-post insights.

#### Dashboard Overview
- Calculates aggregate metrics across a configurable date range (default: last 30 days):
  - **Post counts**: total, published, scheduled, draft
  - **Engagement metrics**: total views, likes, comments, shares, reach, and overall engagement
  - **Engagement rate**: calculated as `(likes + comments + shares) / views × 100`
  - **Total followers**: fetched live from each platform's API (YouTube subscriber count, TikTok follower count, Facebook page fans, Instagram followers)
- **Platform breakdown**: engagement metrics segmented by each platform for comparative analysis

#### Live Metrics Refresh
- Pulls fresh engagement data from platform APIs for the most recent 50 published posts
- For each published post, fetches:
  - **Facebook**: post reactions, comments, shares via Graph API
  - **Instagram**: like count, comments count, impressions via Graph API
  - **TikTok**: view count, like count, comment count, share count via TikTok API
  - **YouTube**: view count, like count, comment count via YouTube Data API
- Updates post engagement data in the database after each successful fetch
- Handles API errors gracefully — partial failures don't prevent other platforms from being updated

#### Per-Post Insights
- **Facebook Post Insights**: detailed breakdown including reactions (by type), comments (with author info and replies), shares, impressions, unique reach, engaged users, clicks, and video views. Fetches comments with author details and supports both regular posts and Reels.
- **Instagram Media Insights**: supports both image and video/Reel metrics. For videos: views (or plays as fallback), reach, saves, shares, and total interactions. For images: reach, saves, and total interactions. Includes comment listing with threaded replies.

---

### 💬 5. Auto-Reply Automation

Webhook-driven automated reply system for Instagram and Facebook that responds to comments on posts in real-time.

#### Instagram Auto-Reply
- **Rule-Based Triggers** — Create auto-reply rules for specific posts with configurable trigger conditions:
  - `keyword` trigger: replies only when a comment contains one or more specified keywords (case-insensitive matching)
  - `any_comment` trigger: replies to every new comment on the post
- **Target Audience Filtering** — Rules can target `anyone`, `followers_only`, or `non_followers`
- **Reply Content** — Configure the reply message with optional link attachments. Replies are sent as **private Direct Messages** using Instagram's Private Reply API (responding to the comment that triggered the rule).
- **Duplicate Prevention** — Tracks `respondedUsers` array to ensure each user only receives one auto-reply per rule, preventing spam.
- **Statistics Tracking** — Each rule tracks: total triggers, successful sends, and failed attempts.
- **Toggle Support** — Rules can be enabled/disabled without deletion via a PATCH toggle endpoint.
- **Webhook Integration** — Receives Instagram comment webhooks via Meta's Webhooks platform. The webhook handler identifies the correct account, finds matching rules, and processes replies asynchronously.
- **Account Resolution** — Supports multiple lookup strategies to find the correct access token: exact platform ID match, business account ID from metadata, and live API verification fallback.

#### Facebook Auto-Reply
- Similar rule-based system for Facebook Page posts
- Processes Facebook feed webhooks for new comments (`change.field === 'feed'` with `verb === 'add'`)
- Resolves Page Access Tokens by searching user settings for the matching page ID
- Sends replies as **public comment replies** on the original comment
- Supports keyword matching and tracks responded users to prevent duplicates
- Webhook handling uses fire-and-forget pattern for background processing

---

### ☁️ 6. Media Management

Full media lifecycle management powered by **Cloudinary CDN** for reliable, scalable file storage.

- **Multi-File Upload** — Upload up to **10 files** simultaneously in a single request. Each file can be up to **50MB** in size. Supports both images and videos with MIME type validation.
- **Cloudinary Integration** — Files are uploaded directly to Cloudinary using memory-based multer storage (no disk writes). Each file gets a unique public ID namespaced under the user's ID (`autoreach/{userId}/{uuid}`). Uploads include automatic quality and format optimization.
- **Media Metadata** — Every uploaded file returns: file type (image/video), secure URL, Cloudinary public ID, original filename, file size, MIME type, dimensions (width/height), and duration (for videos).
- **Media Gallery** — List all uploaded media for the authenticated user with pagination support. Queries Cloudinary's search API by folder and user-specific prefix.
- **Media Deletion** — Delete individual media files from Cloudinary by public ID. Automatically cleans up Cloudinary media when a post is deleted (iterates through all media URLs, extracts public IDs, and destroys each resource).
- **Avatar Upload** — Dedicated endpoint for user profile pictures. Avatars are limited to image files only and are automatically transformed: **200×200 pixels**, **face-detection crop** (Cloudinary's `gravity: 'face'`), auto quality, and auto format optimization. Avatars overwrite the previous one using the same public ID to prevent storage bloat.

---

### 🔗 7. OAuth & Platform Connection Management

Secure OAuth 2.0 integration for all four platforms with CSRF-safe stateless state management.

#### Common OAuth Security Pattern
All platform OAuth flows share a consistent security architecture:
- **Stateless Signed State Tokens** — Instead of storing OAuth state in memory (which fails in multi-dyno/server environments), the server generates HMAC-SHA256 signed state tokens containing: `userId.timestamp.nonce.signature`. This allows the callback handler to verify the state without any server-side storage.
- **10-Minute Expiry** — OAuth state tokens expire after 10 minutes to prevent replay attacks.
- **Popup-Based Flow** — OAuth callbacks render an HTML page with `window.opener.postMessage()` to communicate the result back to the frontend popup window, then auto-close.

#### Platform-Specific Details

| Platform | Token Type | Token Lifetime | Auto-Refresh | Revocation |
|----------|-----------|----------------|--------------|------------|
| **Facebook** | Long-lived user token + Page tokens | ~60 days | Via page token refresh | ❌ |
| **Instagram** | Long-lived token (ig_exchange_token) | ~60 days | ✅ Auto-refresh via `ig_refresh_token` | ❌ |
| **TikTok** | Access + Refresh token pair | Access: 24h, Refresh: 365 days | ✅ Auto-refresh before publish | ✅ Token revocation on disconnect |
| **YouTube** | Access + Refresh token pair | Access: 1h, Refresh: indefinite | ✅ Auto-refresh before publish | ✅ Token revocation on disconnect |

#### Account Management
- **Connect** — Complete OAuth flow stores encrypted tokens in the `SocialAccount` collection
- **Disconnect** — Revokes platform tokens (where supported) and removes the account record
- **Status Check** — Each platform has a `/status` endpoint returning all connected accounts with metadata
- **Token Refresh** — Manual refresh endpoints available for each platform; automatic refresh happens before publishing
- **Legacy Migration** — Built-in migration utility moves social accounts from the legacy embedded `User.socialAccounts` array to the normalized `SocialAccount` collection

---

### 🔐 8. Security & Authentication

Multi-layered security architecture protecting the API and user data at every level.

- **JWT Authentication** — Stateless token-based authentication using `jsonwebtoken`. Tokens are signed with a configurable secret (`JWT_SECRET`) and carry the user ID as payload. Tokens are accepted via `Authorization: Bearer <token>` header or `x-auth-token` header. No server-side sessions are maintained.
- **Email OTP Verification** — New user signups require email verification via a 4-digit OTP code sent through SMTP (Nodemailer). Codes expire after a configurable time window. Password reset also uses OTP codes sent to the registered email.
- **Password Security** — User passwords are hashed with `bcryptjs` (salt rounds: 10) before storage. Password change requires verification of the current password. Minimum password length enforced at 6–8 characters via `express-validator`.
- **AES-256-CBC Token Encryption** — All social media access tokens and refresh tokens are encrypted using AES-256-CBC before being stored in MongoDB. The encryption key is configurable via the `ENCRYPTION_KEY` environment variable with key length validation on startup. Tokens are only decrypted in-memory when needed for API calls via `getAccountsWithTokens()`.
- **Rate Limiting** — Three tiers of rate limiting powered by `express-rate-limit`:
  - **General API**: 100 requests per 15 minutes per IP
  - **Authentication routes**: 20 requests per 15 minutes per IP (stricter to prevent brute-force)
  - **AI routes**: 20 requests per minute per IP (to control API costs)
- **Helmet HTTP Security** — `helmet` middleware hardens HTTP response headers (XSS protection, HSTS, frame options, etc.). Content Security Policy (CSP) is disabled to allow OAuth popup communication.
- **CORS Configuration** — Strict origin whitelist allowing only specified production and development URLs. Supports preflight OPTIONS requests with credential passing enabled. Dynamic origin validation with explicit allow/deny.
- **Input Validation** — All user-facing endpoints validate request bodies using `express-validator` with descriptive error messages. Validation covers email format, password length, required fields, enum values, and array constraints.
- **Resource Authorization** — Every data-modifying operation verifies that the authenticated user owns the resource (post, account, rule) before allowing the operation. Prevents horizontal privilege escalation.

---

### 🔄 9. Background Job Processing

Asynchronous, fault-tolerant publishing pipeline using **Bull** (Redis-backed job queue) with parallel execution and automatic retries.

- **Bull Queue** — The `social-publish` queue is backed by Redis via `ioredis`. Jobs are configured with 3 retry attempts using exponential backoff (5s → 10s → 20s). The last 100 completed and 200 failed jobs are retained for inspection.
- **Cron Scheduler** — A `node-cron` job runs every minute, querying for posts where `isScheduled: true` and `scheduledDate <= now`. Found posts are wrapped into `PublishJob` documents and enqueued to Bull. The scheduler also handles cleanup of stale processing jobs.
- **Parallel Platform Publishing** — The worker processes all target platforms for a job simultaneously using `Promise.allSettled`. This means a slow YouTube upload won't block a fast Facebook text post. Each platform's result is independent.
- **Atomic MongoDB Updates** — To avoid race conditions from parallel platform processing, the worker uses `PublishJob.updateOne()` with positional array updates (`$set: { 'platforms.N.status': ... }`) instead of loading the full document and calling `.save()`. This prevents one platform's save from overwriting another's status.
- **Real-Time Status Sync** — As each platform publishes (or fails), both the `PublishJob` and the `Post` document are updated atomically, keeping the UI in sync with the latest status.
- **Job Progress Tracking** — The worker reports progress percentage to Bull (`job.progress()`) based on completed/total platforms, enabling frontend progress bars.
- **Comprehensive Logging** — Every job logs timestamped entries (with log levels: info, warn, error) for debugging. Logs are stored in the `PublishJob.logs` array.
- **Final Status Resolution** — Jobs are marked as `completed` (all platforms succeeded), `failed` (all platforms failed), or `partially_failed` (mixed results).

---

### 👤 10. User Management

Complete user account lifecycle from registration to deletion.

- **User Registration** — Email/password signup with automatic OTP verification email. Users cannot access protected routes until email is verified.
- **Profile Management** — Update name, email, avatar URL, and timezone. Profile picture upload is handled by the dedicated avatar upload endpoint with Cloudinary.
- **Subscription System** — Users have a subscription model with plan tiers (`free`, `basic`, `pro`, `enterprise`), status tracking (`active`, `inactive`, `cancelled`), and date management (start/end dates). Subscription updates are handled via a dedicated endpoint.
- **User Settings** — Configurable per-user settings stored as a flexible JSON object, including:
  - Timezone and language preferences
  - Notification preferences (email, push, in-app toggles)
  - Auto-posting configuration
  - Connected Facebook Pages cache and default page selection
- **Account Deletion** — Full account deletion that cascades across all related data: deletes `SocialAccount` records, `Post` records, `PublishJob` records, `AutoReplyRule` records, `PlatformContent` records, and finally the `User` document itself. Uses `Promise.allSettled` for parallel deletion with error logging for any failed cleanup operations.
- **Role-Based Access** — Users have a `role` field supporting `user` and `admin` roles (admin routes are defined but currently commented out for future activation).

---

### 🔄 11. Platform Content Sync & Caching

Sync and cache content from all connected social media platforms into the local database for unified viewing and analytics.

- **Sync All Platforms** — A single endpoint (`POST /sync-all`) triggers simultaneous content sync across all connected accounts (Instagram, TikTok, YouTube, Facebook). Each platform sync runs independently, so failures on one platform don't affect others.
- **Per-Platform Sync** — Sync individual platforms on demand (`POST /sync/:platform`). Useful for refreshing data from a specific platform after connecting a new account.
- **Content Caching** — Synced content is stored in the `PlatformContent` collection with a unique compound index on `(userId, platform, contentId)`. Uses `updateOne` with `upsert: true` to insert new content and update existing content without duplicates.
- **Platform-Specific Sync Logic**:
  - **Instagram**: Fetches recent media (images, videos, reels) with engagement metrics via the Instagram Graph API
  - **TikTok**: Fetches video list with view counts, likes, comments, and shares via the TikTok API
  - **YouTube**: Fetches uploaded videos with full statistics (views, likes, comments) via the YouTube Data API
  - **Facebook**: Fetches page feed posts with reactions, comments, and shares via the Facebook Graph API
- **Aggregate Metrics** — The synced content endpoint (`GET /content/:platform`) returns both individual content items and aggregate totals (total views, likes, comments, shares, and content count) using MongoDB's aggregation pipeline.
- **Cached Content Details** — Each cached item stores: platform, content type, title, description, media URL, thumbnail URL, permalink, engagement metrics, original publish date, and last sync timestamp.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client Applications                            │
│                     (React / Mobile / Any HTTP)                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS
┌────────────────────────────────▼────────────────────────────────────────┐
│                        Express.js Server                                │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │  Helmet   │  │ Rate Limiter│  │  CORS Config  │  │  Morgan Logger │  │
│  └──────────┘  └─────────────┘  └───────────────┘  └────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Route Handlers (20 files)                   │   │
│  │  auth · users · posts · upload · ai · analytics · platforms      │   │
│  │  facebook · instagram · tiktok-oauth · youtube-oauth             │   │
│  │  platform-sync · facebook-insights · instagram-insights          │   │
│  │  instagram-auto-reply · facebook-auto-reply                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
│  ┌──────────────────────────────▼──────────────────────────────────┐   │
│  │                     Services Layer                               │   │
│  │  facebook · instagram · tiktok · youtube · ai · mailer · jwt     │   │
│  │  scheduler · account.service                                     │   │
│  │  ┌──────────────────────────────────────────────┐               │   │
│  │  │  Publisher Pattern (Factory + Strategy)       │               │   │
│  │  │  BasePublisher → Facebook/Instagram/          │               │   │
│  │  │                   TikTok/YouTube Publisher     │               │   │
│  │  └──────────────────────────────────────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────┬───────────────────┬────────────────────────────┘
                         │                   │
           ┌─────────────▼───────┐   ┌──────▼────────────────────┐
           │    MongoDB Atlas    │   │    Redis (Bull Queue)      │
           │  ┌───────────────┐  │   │  ┌──────────────────────┐ │
           │  │ User          │  │   │  │ social-publish queue │ │
           │  │ SocialAccount │  │   │  │ 3 retries / exp back │ │
           │  │ Post          │  │   │  └──────────────────────┘ │
           │  │ PublishJob    │  │   └────────────────────────────┘
           │  │ AutoReplyRule │  │
           │  │ PlatformContent│ │   ┌────────────────────────────┐
           │  └───────────────┘  │   │      External APIs         │
           └─────────────────────┘   │  Facebook Graph API v19.0  │
                                      │  Instagram Graph API       │
           ┌─────────────────────┐   │  TikTok Content API        │
           │  Cloudinary CDN     │   │  YouTube Data API v3       │
           │  Media storage      │   │  Google Gemini AI           │
           └─────────────────────┘   │  SMTP (Email)              │
                                      └────────────────────────────┘
```

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Cache/Queue** | Redis + ioredis |
| **Job Queue** | Bull |
| **Authentication** | JWT (jsonwebtoken) |
| **Encryption** | AES-256-CBC (Node.js crypto) |
| **File Upload** | Multer (memory storage) → Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **AI** | Google Generative AI (Gemini 2.5 Flash) |
| **HTTP Client** | Axios |
| **Security** | Helmet, express-rate-limit, bcryptjs, CORS |
| **Scheduling** | node-cron |
| **Validation** | express-validator |
| **Logging** | Morgan |

---

## 📁 Project Structure

```
server-autoreach-ai/
├── server.js                     # Application entry point
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment variable template
├── .gitignore
│
├── config/
│   ├── database.js               # MongoDB connection (Mongoose)
│   └── redis.js                  # Redis client setup (ioredis)
│
├── middleware/
│   ├── auth.js                   # JWT authentication middleware
│   └── rateLimiter.js            # Rate limiting (general + auth)
│
├── models/
│   ├── User.js                   # User schema (auth, roles, settings, subscriptions)
│   ├── SocialAccount.js          # Connected social accounts (encrypted tokens)
│   ├── Post.js                   # Posts (content, media, scheduling, per-platform status)
│   ├── PublishJob.js             # Background publish job tracking
│   ├── AutoReplyRule.js          # Auto-reply automation rules
│   └── PlatformContent.js        # Cached content from synced platforms
│
├── routes/
│   ├── auth.js                   # Signup, login, OTP, password reset
│   ├── users.js                  # Profile, social accounts, subscription, account deletion
│   ├── posts.js                  # Post CRUD, scheduling, publishing
│   ├── upload.js                 # Cloudinary media & avatar upload
│   ├── ai.js                     # AI caption, hashtag, rewrite endpoints
│   ├── analytics.js              # Dashboard overview, metrics refresh
│   ├── platforms.js              # Get all connected platform accounts
│   ├── platform-sync.js          # Sync content from all platforms
│   ├── facebook.js               # Facebook OAuth, pages, disconnect, refresh
│   ├── instagram.js              # Instagram status, profile, feed, insights, publish
│   ├── instagram-oauth.js        # Instagram Direct OAuth flow
│   ├── tiktok-oauth.js           # TikTok OAuth, account, videos, publish
│   ├── youtube-oauth.js          # YouTube OAuth, channel, videos, publish
│   ├── facebook-insights.js      # Facebook post-level insights
│   ├── instagram-insights.js     # Instagram media-level insights
│   ├── instagram-auto-reply.js   # Instagram auto-reply rules + webhook
│   ├── facebook-auto-reply.js    # Facebook auto-reply rules + webhook
│   ├── social.js                 # (Legacy — commented out)
│   ├── engagement.js             # (Legacy — commented out)
│   └── admin.js                  # (Legacy — commented out)
│
├── services/
│   ├── jwt.js                    # JWT sign/verify utility
│   ├── mailer.js                 # Email sending (OTP templates)
│   ├── ai.js                     # Google Gemini AI integration
│   ├── scheduler.js              # Cron-based scheduled post processing
│   ├── account.service.js        # Social account management (CRUD, migration)
│   ├── facebook.js               # Facebook Graph API service
│   ├── instagram.js              # Instagram Graph API service
│   ├── tiktok.js                 # TikTok API service
│   ├── youtube.js                # YouTube Data API service
│   │
│   ├── publishers/
│   │   ├── base.publisher.js     # Abstract publisher interface
│   │   ├── publisher.factory.js  # Factory to instantiate platform publishers
│   │   ├── facebook.publisher.js # Facebook page publishing logic
│   │   ├── instagram.publisher.js# Instagram publishing (Direct + FB-linked)
│   │   ├── tiktok.publisher.js   # TikTok video publishing
│   │   └── youtube.publisher.js  # YouTube video uploading
│   │
│   └── queue/
│       ├── publish.queue.js      # Bull queue setup (Redis-backed)
│       └── publish.worker.js     # Worker: parallel platform publishing
│
├── utils/
│   └── encryption.js             # AES-256-CBC encrypt/decrypt
│
└── scripts/
    ├── migrate-accounts.js       # Migrate legacy social accounts
    ├── list-accounts.js          # List all social accounts (debug)
    └── clear-accounts.js         # Clear social account data (debug)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** (local or Atlas)
- **Redis** (local or cloud — required for Bull queues)
- Platform developer accounts for OAuth setup (Facebook, Instagram, TikTok, YouTube)
- Cloudinary account for media hosting
- Google AI Studio API key for Gemini

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd server-autoreach-ai

# Install dependencies
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure all required values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: `5000`) |
| `CLIENT_URL` | Frontend URL for CORS and OAuth redirects |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiration (e.g., `7d`) |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 token encryption |
| `REDIS_URL` | Redis connection URL |
| **Cloudinary** | |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| **Facebook** | |
| `FACEBOOK_APP_ID` | Facebook App ID |
| `FACEBOOK_APP_SECRET` | Facebook App Secret |
| `FACEBOOK_REDIRECT_URI` | OAuth callback URL |
| `FB_VERIFY_TOKEN` | Webhook verification token |
| **Instagram** | |
| `INSTAGRAM_APP_ID` | Instagram App ID |
| `INSTAGRAM_APP_SECRET` | Instagram App Secret |
| `INSTAGRAM_REDIRECT_URI` | OAuth callback URL |
| `IG_VERIFY_TOKEN` | Webhook verification token |
| **TikTok** | |
| `TIKTOK_CLIENT_KEY` | TikTok client key |
| `TIKTOK_CLIENT_SECRET` | TikTok client secret |
| `TIKTOK_REDIRECT_URI` | OAuth callback URL |
| **YouTube** | |
| `YOUTUBE_CLIENT_ID` | Google OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | Google OAuth client secret |
| `YOUTUBE_REDIRECT_URI` | OAuth callback URL |
| **Email** | |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| **AI** | |
| `GEMINI_API_KEY` | Google Gemini API key |

### Running the Server

```bash
# Development (with hot reload via nodemon)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000` (or your configured `PORT`).

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require a JWT token via:
- `Authorization: Bearer <token>` header, or
- `x-auth-token: <token>` header

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | ❌ | Register a new user (name, email, password) |
| `POST` | `/login` | ❌ | Login and receive JWT token |
| `POST` | `/logout` | ❌ | Client-side token discard (no server state) |
| `POST` | `/verify-otp` | ❌ | Verify email with OTP code |
| `POST` | `/resend-otp` | ❌ | Resend OTP verification email |
| `POST` | `/forgot-password` | ❌ | Send password reset OTP |
| `POST` | `/reset-password` | ❌ | Reset password with OTP code |
| `POST` | `/change-password` | ✅ | Change password (requires current password) |
| `GET` | `/me` | ✅ | Get authenticated user profile |
| `PUT` | `/profile` | ✅ | Update user profile (name, picture, timezone) |

### User Management (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/profile` | ✅ | Get user profile |
| `PUT` | `/profile` | ✅ | Update profile (name, email, avatar) |
| `POST` | `/social-accounts` | ✅ | Add social media account (legacy) |
| `DELETE` | `/social-accounts/:accountId` | ✅ | Remove social account (legacy) |
| `PUT` | `/subscription` | ✅ | Update subscription plan |
| `DELETE` | `/account` | ✅ | **Delete account** and all related data |

### Posts (`/api/posts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✅ | List posts (paginated, filterable by month/status) |
| `GET` | `/:id` | ✅ | Get single post |
| `POST` | `/` | ✅ | Create post (title, content, platforms, media, schedule) |
| `PUT` | `/:id` | ✅ | Update post |
| `DELETE` | `/:id` | ✅ | Delete post (+ Cloudinary media + related PublishJobs) |
| `POST` | `/:id/publish` | ✅ | Publish post to selected platforms (enqueues job) |

### Media Upload (`/api/upload`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/media` | ✅ | Upload up to 10 files (images/videos, 50MB each) to Cloudinary |
| `GET` | `/media` | ✅ | List user's uploaded media (paginated) |
| `DELETE` | `/media/:publicId` | ✅ | Delete media from Cloudinary |
| `POST` | `/avatar` | ✅ | Upload user avatar (200×200, face-crop) |

### AI Content Generation (`/api/ai`)

Rate limited to **20 requests/minute**.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/caption` | ✅ | Generate caption from topic, tone, platform |
| `POST` | `/hashtags` | ✅ | Generate hashtags from topic and platform |
| `POST` | `/rewrite` | ✅ | Rewrite text with specified tone |

### Platform Connections (`/api/platforms`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/connected` | ✅ | Get all connected accounts (grouped by platform) |

### Instagram (`/api/instagram` + `/api/instagram-oauth`)

**OAuth Flow (Direct Instagram Login):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/instagram-oauth/connect` | ✅ | Get Instagram OAuth authorization URL |
| `GET` | `/instagram-oauth/callback` | ❌ | OAuth callback (exchanges code → long-lived token) |
| `GET` | `/instagram-oauth/status` | ✅ | Get connected Instagram accounts |
| `DELETE` | `/instagram-oauth/disconnect/:accountId` | ✅ | Disconnect Instagram account |

**Content & Insights:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/instagram/status` | ✅ | List all IG accounts (Direct + Facebook-linked) |
| `GET` | `/instagram/accounts/:igUserId/profile` | ✅ | Get IG account profile |
| `GET` | `/instagram/accounts/:igUserId/feed` | ✅ | Get IG account feed |
| `GET` | `/instagram/accounts/:igUserId/insights` | ✅ | Get IG account insights |
| `POST` | `/instagram/accounts/:igUserId/publish` | ✅ | Publish to Instagram (image/video/reel) |

### Facebook (`/api/facebook`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/oauth/start-url` | ✅ | Get Facebook OAuth URL |
| `GET` | `/oauth/start` | ✅ | Redirect to Facebook OAuth |
| `GET` | `/oauth/callback` | ❌ | OAuth callback (exchanges code → long-lived token) |
| `GET` | `/status` | ✅ | Get connection status and pages |
| `DELETE` | `/disconnect` | ✅ | Disconnect Facebook account |
| `POST` | `/refresh` | ✅ | Refresh connected pages list |
| `POST` | `/default-page` | ✅ | Set default page for posting |
| `GET` | `/diagnose` | ✅ | Debug endpoint for permissions/pages |
| `POST` | `/post` | ✅ | Publish to a Facebook Page |

### TikTok (`/api/tiktok-oauth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/connect` | ✅ | Get TikTok OAuth authorization URL |
| `GET` | `/callback` | ❌ | OAuth callback |
| `GET` | `/status` | ✅ | Get connected TikTok accounts |
| `GET` | `/account/:accountId` | ✅ | Get TikTok account details + user info |
| `GET` | `/creator-info/:accountId` | ✅ | Get creator posting capabilities & limits |
| `POST` | `/refresh/:accountId` | ✅ | Refresh TikTok access token |
| `DELETE` | `/disconnect/:accountId` | ✅ | Disconnect & revoke TikTok token |
| `GET` | `/videos/:accountId` | ✅ | List TikTok videos (paginated) |
| `POST` | `/publish/:accountId` | ✅ | Publish video (direct/inbox, with privacy & disclosure settings) |

### YouTube (`/api/youtube-oauth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/connect` | ✅ | Get YouTube OAuth authorization URL |
| `GET` | `/callback` | ❌ | OAuth callback |
| `GET` | `/status` | ✅ | Get connected YouTube accounts |
| `GET` | `/account/:accountId` | ✅ | Get YouTube channel info |
| `POST` | `/refresh/:accountId` | ✅ | Refresh YouTube access token |
| `DELETE` | `/disconnect/:accountId` | ✅ | Disconnect & revoke YouTube token |
| `GET` | `/videos/:accountId` | ✅ | List YouTube videos |
| `POST` | `/publish/:accountId` | ✅ | Upload video to YouTube (resumable) |
| `GET` | `/video/insights/:videoId` | ✅ | Get video statistics |

### Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/overview` | ✅ | Dashboard stats (posts, engagement, followers, platform breakdown) |
| `POST` | `/refresh` | ✅ | Refresh engagement metrics from live platform APIs |

### Platform Sync (`/api/platform-sync`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/sync-all` | ✅ | Sync content from all connected platforms |
| `POST` | `/sync/:platform` | ✅ | Sync content from a specific platform |
| `GET` | `/content/:platform` | ✅ | Get synced content for a platform (with aggregate metrics) |

### Auto-Reply Automation

**Instagram Auto-Reply (`/api/instagram-auto-reply`):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/rules` | ✅ | List all auto-reply rules |
| `GET` | `/rules/post/:postId` | ✅ | Get rule for a specific post |
| `POST` | `/rules` | ✅ | Create/update auto-reply rule |
| `PUT` | `/rules/:ruleId` | ✅ | Update a rule |
| `DELETE` | `/rules/:ruleId` | ✅ | Delete a rule |
| `PATCH` | `/rules/:ruleId/toggle` | ✅ | Toggle rule on/off |
| `GET` | `/webhook` | ❌ | Meta webhook verification |
| `POST` | `/webhook` | ❌ | Instagram comment webhook handler |

**Facebook Auto-Reply (`/api/facebook-auto-reply`):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/rules` | ✅ | List Facebook auto-reply rules |
| `POST` | `/rules` | ✅ | Create auto-reply rule |
| `GET` | `/webhook` | ❌ | Meta webhook verification |
| `POST` | `/webhook` | ❌ | Facebook comment webhook handler |

### Insights

**Facebook Insights (`/api/facebook-insights`):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/post/:postId/insights` | ✅ | Detailed post insights (reactions, comments, reach, video views) |

**Instagram Insights (`/api/instagram-insights`):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/media/:mediaId/insights` | ✅ | Detailed media insights (views, plays, reach, saves, shares) |

---

## 📦 Data Models

### User

```
User {
  name, email, password (hashed),
  avatar, role (user|admin),
  socialAccounts[] (legacy embedded),
  subscription { plan, status, startDate, endDate },
  settings {
    timezone, language, notifications {},
    autoPost {}, facebookPages[], facebookDefaultPageId
  },
  isVerified, verificationCode, verificationExpires,
  resetPasswordCode, resetPasswordExpires,
  lastLogin
}
```

### SocialAccount

```
SocialAccount {
  userId (ref → User),
  platform (facebook|instagram|tiktok|youtube),
  platformAccountId,
  accountName,
  accessToken (encrypted), refreshToken (encrypted),
  tokenExpires, isActive, connectedAt,
  metadata {} (platform-specific data)
}
Compound Index: { userId, platform, platformAccountId } (unique)
```

### Post

```
Post {
  user (ref → User),
  title, content, hashtags[], mentions[],
  media[] { type, url, publicId, filename, size },
  platforms[] {
    name, accountId, accountName, status,
    postId, publishedAt, errorMessage,
    engagement { likes, comments, shares, views, lastUpdated }
  },
  isScheduled, scheduledDate, isDraft, isPublished,
  tiktokSettings { privacyLevel, disableComment, ... },
  aiGenerated, aiPrompt,
  analytics { totalReach, totalEngagement }
}
```

### PublishJob

```
PublishJob {
  jobId (UUID, unique), userId, postId (ref → Post),
  status (pending|processing|completed|failed|partially_failed),
  platforms[] { name, accountId, status, platformPostId, error },
  content { title, body, media[] },
  error, retryCount, maxRetries,
  logs[] { level, message, timestamp },
  createdAt, completedAt
}
```

### AutoReplyRule

```
AutoReplyRule {
  userId, platform (instagram|facebook),
  postId, accountId,
  triggerType (keyword|any_comment),
  keywords[], targetAudience (anyone|followers_only|non_followers),
  replyContent { message, attachmentType, linkUrl, mediaUrl },
  enabled, stats { triggered, sent, failed },
  respondedUsers[] { igUserId, respondedAt }
}
```

### PlatformContent

```
PlatformContent {
  userId, platform, accountId,
  contentId (platform-unique), contentType,
  title, description, mediaUrl, thumbnailUrl, permalink,
  engagement { views, likes, comments, shares },
  publishedAt, syncedAt
}
Compound Index: { userId, platform, contentId } (unique)
```

---

## ⚙ Services & Business Logic

### Platform Services

Each platform has a dedicated service module implementing:

| Service | Capabilities |
|---------|-------------|
| **`facebook.js`** | OAuth (short → long-lived token), page listing, page enrichment with Instagram, permissions check, posting (text/photo/video), feed fetching, insights, webhook subscription |
| **`instagram.js`** | Dual auth (Direct OAuth + Facebook-linked), long-lived token exchange, token refresh, media container creation, publish (image/reel), feed and insights fetch |
| **`tiktok.js`** | OAuth, token refresh/revocation, user info, creator info, direct + inbox video publish, chunked file upload, video list query |
| **`youtube.js`** | OAuth, token refresh/revocation, channel info, resumable video upload (from URL), video details and list |

### Publisher Pattern

Uses a **Factory + Strategy** pattern for platform-agnostic publishing:

```
BasePublisher (abstract)
├── resolveAuth()      — Fetch/refresh platform tokens
├── validateContent()  — Validate media and content
├── publish()          — Execute platform-specific publish
└── formatResponse()   — Normalize response

PublisherFactory.getPublisher(user, platform)
→ Returns: FacebookPublisher | InstagramPublisher |
           TikTokPublisher | YouTubePublisher
```

### Account Service

Centralized social account management with:
- **Encrypted token storage** — Tokens are AES-256 encrypted before saving
- **Transparent decryption** — `getAccountsWithTokens()` returns decrypted tokens for internal use
- **Legacy migration** — `migrateLegacyAccounts()` moves embedded User.socialAccounts → SocialAccount collection

### AI Service

Integrates Google Gemini 2.5 Flash for:
- `suggestCaption({ topic, tone, platform })` — Natural, engaging captions
- `suggestHashtags({ topic, platform, count })` — Trending hashtag arrays
- `rewriteText({ text, tone, platform })` — Text tone transformation

---

## 🔄 Background Job Processing

### Queue Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Scheduler   │────▶│  Bull Queue       │────▶│  Publish Worker  │
│  (node-cron) │     │  (social-publish) │     │  (process jobs)  │
│  Every minute│     │  Redis-backed     │     │  Parallel per    │
│  finds due   │     │                    │     │  platform        │
│  posts       │     │  3 retries         │     │                  │
└─────────────┘     │  Exponential back  │     │  Atomic MongoDB  │
                     │  5s → 10s → 20s    │     │  updates         │
  ┌─────────┐       └──────────────────┘     └─────────────────┘
  │ POST    │
  │ /:id/   │        Also enqueue on
  │ publish │───────▶ manual publish
  └─────────┘
```

### Job Processing Flow

1. **Enqueue** — Scheduler or manual publish creates a `PublishJob` document and enqueues a Bull job
2. **Process** — Worker picks up the job, fetches user and job from DB
3. **Parallel Publish** — All target platforms are published to simultaneously using `Promise.allSettled`
4. **Atomic Updates** — Each platform's status is updated atomically via `PublishJob.updateOne` to avoid race conditions
5. **Sync Post Status** — The `Post` document's per-platform status is synced in real-time
6. **Finalize** — Job marked as `completed`, `failed`, or `partially_failed`

### Queue Configuration

| Setting | Value |
|---------|-------|
| Max Retries | 3 |
| Backoff | Exponential (5s, 10s, 20s) |
| Completed Jobs Kept | 100 |
| Failed Jobs Kept | 200 |

---

## 🔐 Security

### Authentication
- **JWT tokens** with configurable expiration
- Tokens accepted via `Authorization: Bearer <token>` or `x-auth-token` headers
- Client-side token storage (no server sessions)

### Encryption
- All social platform tokens (**access tokens** and **refresh tokens**) are encrypted using **AES-256-CBC** before database storage
- Encryption key configurable via `ENCRYPTION_KEY` env variable
- Key length validation on startup

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Auth routes**: 20 requests per 15 minutes per IP
- **AI routes**: 20 requests per minute per IP

### OAuth Security
- **Stateless signed state tokens** — HMAC-SHA256 signed with timestamp + nonce to prevent CSRF
- **10-minute state expiry** — OAuth state tokens expire after 10 minutes
- No in-memory state storage (multi-dyno safe)

### HTTP Security
- **Helmet** middleware for HTTP header hardening (CSP disabled for OAuth compatibility)
- **CORS** with explicit origin whitelist (production + development URLs)
- Input validation via `express-validator`

---

## ⚠ Error Handling

### Global Error Handler

The server implements a centralized error handling strategy:

```javascript
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### Error Patterns Used

| Pattern | Where |
|---------|-------|
| **Validation errors** (400) | `express-validator` in auth, posts, users routes |
| **Not found** (404) | Resource lookups (posts, accounts, rules) |
| **Unauthorized** (401) | JWT auth middleware, resource ownership checks |
| **Rate limited** (429) | Rate limiter middleware, TikTok creator info |
| **Server error** (500) | Generic catch blocks with console.error logging |
| **Platform API errors** | Forwarded with original status codes and messages |
| **Graceful degradation** | Insights/metrics swallow errors and return partial data |
| **Retry with backoff** | Bull queue retries failed publish jobs 3 times |

---

## 📜 Scripts

Utility scripts for database management (located in `scripts/`):

```bash
# Migrate legacy social accounts from User model to SocialAccount collection
node scripts/migrate-accounts.js

# List all social accounts in the database (debug)
node scripts/list-accounts.js

# Clear social account data (debug/reset)
node scripts/clear-accounts.js
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary. All rights reserved.
