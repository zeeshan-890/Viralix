# AutoReach AI Backend

A powerful Node.js Express backend for the AutoReach AI social media management platform. This API provides comprehensive functionality for social media automation, content management, user authentication, analytics, and engagement tracking.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Social Media Integration** - Connect and manage multiple social media accounts
- **Content Management** - Create, schedule, and publish posts across platforms
- **File Upload & Management** - Cloudinary integration for media handling
- **Analytics & Reporting** - Comprehensive analytics dashboard and insights
- **Engagement Management** - Comment tracking, mentions monitoring, response templates
- **Admin Dashboard** - Platform-wide administration and monitoring
- **Rate Limiting & Security** - Built-in security and API protection

### Supported Platforms
- Facebook
- Instagram  
- Twitter
- LinkedIn
- TikTok
- YouTube

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Environment**: dotenv

## 📁 Project Structure

```
server-autoreach-ai/
├── config/
│   └── database.js          # MongoDB connection config
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User data model
│   └── Post.js              # Post data model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── posts.js             # Post management routes
│   ├── social.js            # Social media integration routes
│   ├── analytics.js         # Analytics and reporting routes
│   ├── engagement.js        # Engagement management routes
│   ├── admin.js             # Admin dashboard routes
│   └── upload.js            # File upload routes
├── .env.example             # Environment variables template
├── .github/
│   └── copilot-instructions.md
├── package.json
├── server.js                # Main application entry point
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for file uploads)

### Quick Start

1. **Clone and Navigate**
   ```bash
   cd server-autoreach-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/autoreach-ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Social Media API Keys
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/facebook/oauth/callback
# ... (add other platform credentials)
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/settings` - Update user settings
- `POST /api/users/social-accounts` - Connect social account
- `DELETE /api/users/social-accounts/:id` - Disconnect account

### Post Management
- `GET /api/posts` - Get user posts (with pagination)
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post immediately

### Social Media Integration
- `GET /api/social/platforms` - Get available platforms
- `POST /api/social/connect/:platform` - Connect platform account
- `POST /api/social/publish` - Publish to platforms
- `GET /api/social/analytics/:platform/:accountId` - Get platform analytics

### Analytics & Reporting
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/posts/:id` - Post-specific analytics
- `GET /api/analytics/performance` - Performance over time
- `GET /api/analytics/top-posts` - Top performing posts

### Engagement Management
- `GET /api/engagement/comments` - Get comments across platforms
- `PUT /api/engagement/comments/:id` - Update comment status
- `GET /api/engagement/mentions` - Get brand mentions
- `GET /api/engagement/stats` - Engagement statistics
- `POST /api/engagement/templates` - Create response template

### File Upload
- `POST /api/upload/media` - Upload media files
- `DELETE /api/upload/media/:publicId` - Delete media
- `GET /api/upload/media` - Get user's media library
- `POST /api/upload/avatar` - Upload user avatar

### Admin (Admin Role Required)
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/posts` - Get all posts
- `DELETE /api/admin/posts/:id` - Delete post
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/system-health` - System health metrics

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - User and admin roles
- **Rate Limiting** - API call rate limiting (100 requests per 15 minutes)
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - Security headers middleware
- **Input Validation** - Request validation with express-validator
- **Password Hashing** - bcryptjs for secure password storage

## 🗄️ Database Schema

### User Model
- Personal information (name, email, password)
- Social media accounts with tokens
- Subscription details and limits
- User preferences and settings

### Post Model
- Content and metadata
- Multi-platform publishing status
- Media attachments
- Scheduling information
- Analytics data

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure JWT_SECRET
- [ ] Set up MongoDB Atlas or production database
- [ ] Configure Cloudinary for production
- [ ] Add social media API credentials
- [ ] Set up proper CORS origins
- [ ] Configure email service for notifications
- [ ] Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📈 Monitoring & Health Checks

- Health check endpoint: `GET /api/health`
- System metrics: `GET /api/admin/system-health` (admin only)
- Built-in error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints above

---

**AutoReach AI Backend** - Powering the future of social media management 🚀
