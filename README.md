# Viralix Backend API

<p align="center">
  <strong>RESTful API for AI-Powered Social Media Management</strong><br/>
  Node.js • Express • MongoDB • Google Gemini AI
</p>

---

## 🚀 Overview

The Viralix Backend API is a robust Node.js/Express server that powers the Viralix social media management platform. It handles authentication, content management, AI-powered content generation, multi-platform publishing to Instagram and Facebook, and comprehensive analytics aggregation.

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT-Based Authentication** — Secure token-based auth with bcrypt password hashing
- **OTP Email Verification** — 6-digit code verification for new accounts
- **Password Recovery** — Secure reset token flow via email
- **Rate Limiting** — IP-based request throttling to prevent abuse
- **Helmet Security** — HTTP headers hardening (HSTS, XSS protection, etc.)
- **CORS Configuration** — Flexible multi-origin support for cross-site requests

### 🤖 AI Content Generation (Google Gemini)
- **Caption Generation** — Platform-optimized captions with configurable tone
- **Hashtag Suggestions** — Relevant hashtags for maximum reach
- **Content Rewriting** — Transform text for different tones and platforms

### 📱 Social Media Integration

#### Instagram
- **Direct OAuth Flow** — Instagram Business Login for API access
- **Facebook-Linked Accounts** — Legacy support via Facebook Pages
- **Media Publishing** — Image posts and Video Reels
- **Profile & Insights** — Followers, reach, impressions data
- **Token Management** — Automatic refresh for long-lived tokens

#### Facebook
- **OAuth 2.0 Integration** — Page access via Facebook Login
- **Multi-Page Support** — Manage multiple Facebook Pages
- **Content Publishing** — Text posts, photos, and videos
- **Page Insights** — Fans, reach, engagement metrics

### 📅 Content Scheduling
- **Cron-Based Scheduler** — Automated publishing of scheduled posts (runs every minute)
- **Multi-Platform Targeting** — Schedule to multiple accounts simultaneously
- **Draft System** — Save and edit content before publishing
- **Status Tracking** — Draft → Scheduled → Published → Failed states

### 📊 Analytics Engine
- **Aggregated Metrics** — Views, likes, comments, shares, followers
- **Per-Post Performance** — Individual post analytics with platform breakdown
- **Historical Data** — Date-range filtering for trend analysis
- **Real-Time Refresh** — Pull latest metrics from connected platforms

### ☁️ Media Management
- **Cloudinary Integration** — Cloud-based image and video storage
- **Multi-File Upload** — Batch upload support
- **Media Library** — Organized asset management per user

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | [Node.js](https://nodejs.org/) (v16+) |
| **Framework** | [Express.js](https://expressjs.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM |
| **AI Engine** | [Google Generative AI SDK](https://ai.google.dev/) (Gemini 2.5 Flash) |
| **Authentication** | JWT ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **File Upload** | [Multer](https://github.com/expressjs/multer) + [Cloudinary](https://cloudinary.com/) |
| **Task Scheduling** | [node-cron](https://github.com/node-cron/node-cron) |
| **Email Service** | [Nodemailer](https://nodemailer.com/) |
| **Validation** | [express-validator](https://express-validator.github.io/) |
| **Security** | [Helmet](https://helmetjs.github.io/), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Logging** | [Morgan](https://github.com/expressjs/morgan) |

## 📁 Project Structure

```
server-autoreach-ai/
├── server.js                 # Application entry point
├── package.json              # Dependencies & scripts
│
├── config/
│   └── database.js           # MongoDB connection setup
│
├── middleware/
│   └── auth.js               # JWT verification middleware
│
├── models/
│   ├── User.js               # User schema (auth, social accounts, settings)
│   └── Post.js               # Post schema (content, platforms, analytics)
│
├── routes/
│   ├── auth.js               # Authentication (login, signup, OTP, password reset)
│   ├── users.js              # User profile management
│   ├── posts.js              # Post CRUD & publishing
│   ├── analytics.js          # Analytics aggregation endpoints
│   ├── ai.js                 # AI content generation endpoints
│   ├── facebook.js           # Facebook OAuth & page management
│   ├── instagram.js          # Instagram account & publishing
│   ├── instagram-oauth.js    # Instagram Business Login OAuth flow
│   ├── upload.js             # Media upload to Cloudinary
│   ├── admin.js              # Admin panel endpoints
│   ├── engagement.js         # Engagement tools
│   └── social.js             # Social platform utilities
│
└── services/
    ├── ai.js                 # Google Gemini AI integration
    ├── facebook.js           # Facebook Graph API helpers
    ├── instagram.js          # Instagram Graph API helpers
    ├── publisher.js          # Multi-platform publishing logic + scheduler
    ├── jwt.js                # JWT sign/verify utilities
    └── mailer.js             # Email sending (Nodemailer)
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register new user (sends OTP) |
| `POST` | `/api/auth/login` | Authenticate user |
| `POST` | `/api/auth/logout` | Log out (stateless) |
| `POST` | `/api/auth/verify-otp` | Verify email OTP |
| `POST` | `/api/auth/resend-otp` | Resend verification code |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with token |
| `GET` | `/api/auth/me` | Get current user profile |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List user's posts (with filters) |
| `GET` | `/api/posts/:id` | Get single post |
| `POST` | `/api/posts` | Create new post |
| `PUT` | `/api/posts/:id` | Update post |
| `DELETE` | `/api/posts/:id` | Delete post |
| `POST` | `/api/posts/:id/publish` | Publish post immediately |

### AI Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/caption` | Generate caption (topic, tone, platform) |
| `POST` | `/api/ai/hashtags` | Suggest hashtags (topic, count) |
| `POST` | `/api/ai/rewrite` | Rewrite text (text, tone, platform) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview` | Dashboard stats summary |
| `GET` | `/api/analytics/platform/:platform` | Platform-specific metrics |
| `GET` | `/api/analytics/content-performance` | Per-post performance |
| `POST` | `/api/analytics/refresh` | Refresh metrics from platforms |

### Facebook
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/facebook/status` | Connection status & pages |
| `GET` | `/api/facebook/oauth/start-url` | Get OAuth URL |
| `GET` | `/api/facebook/oauth/callback` | OAuth callback handler |
| `DELETE` | `/api/facebook/disconnect` | Disconnect Facebook |
| `POST` | `/api/facebook/pages/:pageId/post` | Create text post |
| `POST` | `/api/facebook/pages/:pageId/photo` | Create photo post |
| `POST` | `/api/facebook/pages/:pageId/video` | Create video post |
| `GET` | `/api/facebook/pages/:pageId/insights` | Get page insights |

### Instagram
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/instagram/status` | List connected IG accounts |
| `GET` | `/api/instagram/accounts/:id/profile` | Get account profile |
| `GET` | `/api/instagram/accounts/:id/feed` | Get recent posts |
| `GET` | `/api/instagram/accounts/:id/insights` | Get account insights |
| `POST` | `/api/instagram/accounts/:id/publish-by-url` | Publish media by URL |

### Instagram OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/instagram-oauth/status` | Direct OAuth account status |
| `GET` | `/api/instagram-oauth/auth-url` | Get Instagram OAuth URL |
| `GET` | `/api/instagram-oauth/callback` | OAuth callback handler |
| `POST` | `/api/instagram-oauth/disconnect/:accountId` | Disconnect account |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/upload/media` | List uploaded media |
| `POST` | `/api/upload/media` | Upload files to Cloudinary |
| `DELETE` | `/api/upload/media/:publicId` | Delete media file |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status check |

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB instance (local or Atlas)
- Cloudinary account
- Google AI API key (Gemini)
- Facebook/Instagram App credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/zeeshan-890/server-autoreach-ai.git

# Navigate to the project
cd server-autoreach-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/viralix

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=Viralix <no-reply@viralix.ai>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Facebook OAuth
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/facebook/oauth/callback

# Instagram OAuth
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/instagram-oauth/callback
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run Jest tests |

## 🔒 Security Features

- **Helmet** — Sets secure HTTP headers
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **CORS** — Configurable allowed origins
- **Password Hashing** — bcrypt with salt rounds
- **JWT Tokens** — Stateless authentication with expiry
- **Input Validation** — express-validator on all routes
- **OTP Lockout** — Max attempts before OTP invalidation

## ⏱️ Scheduler

The server includes a built-in cron job that runs every minute to publish scheduled posts:

```javascript
cron.schedule('* * * * *', async () => {
    const count = await publishDueScheduledPosts(new Date());
    if (count > 0) console.log(`Published ${count} post(s)`);
});
```

## 🗄️ Database Models

### User
- Profile info (name, email, password hash)
- Social account connections (tokens, account IDs)
- Settings (Facebook pages, preferences)
- OTP verification fields

### Post
- Content (title, body, hashtags, mentions)
- Multi-platform targeting with per-platform status
- Media attachments (Cloudinary URLs)
- Analytics (reach, engagement, per-platform metrics)
- Scheduling (date, isScheduled, isPublished)

## 🔗 Related

- **Frontend Repository**: [client-autoreach-ai](../client-autoreach-ai) — Next.js React application

## 📄 License

MIT © Zeeshan

---

<p align="center">
  Built with ❤️ using Node.js, Express, and MongoDB
</p>
