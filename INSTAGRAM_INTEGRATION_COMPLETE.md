# Instagram Direct OAuth - Full App Integration Complete ✅

## Overview
Direct Instagram OAuth accounts (connected via `/api/instagram-oauth`) are now fully integrated across all app features. Users can use Instagram accounts without requiring Facebook page connections.

## Integration Status

### ✅ Core Instagram Routes (`routes/instagram.js`)
All endpoints now support BOTH authentication methods:

1. **GET /api/instagram/status**
   - Returns both direct OAuth and Facebook-linked accounts
   - Each account tagged with `method: 'direct_oauth'` or `'facebook_linked'`

2. **GET /api/instagram/accounts/:igUserId/profile**
   - Checks for direct OAuth account first
   - Falls back to Facebook-linked method
   - Returns: username, name, account_type, followers, following, media count, profile picture

3. **GET /api/instagram/accounts/:igUserId/feed**
   - Fetches media posts using direct token or Facebook token
   - Returns: posts with likes, comments, media URLs, captions, timestamps

4. **GET /api/instagram/accounts/:igUserId/insights**
   - Fetches analytics: follower_count, impressions, reach, profile_views
   - Works with both authentication methods

5. **POST /api/instagram/accounts/:igUserId/publish-by-url**
   - Full publishing flow for direct OAuth accounts:
     - Creates media container via `POST /{userId}/media`
     - Polls status every 2.5s until FINISHED
     - Publishes via `POST /{userId}/media_publish`
   - Maintains backward compatibility with Facebook method

### ✅ Analytics Routes (`routes/analytics.js`)
All analytics endpoints updated to include direct OAuth accounts:

1. **GET /api/analytics/overview**
   - Follower count aggregation now includes direct Instagram accounts
   - Fetches `followers_count` from Graph API for each direct account
   - Combines with Facebook-linked account followers

2. **POST /api/analytics/refresh**
   - Post engagement refresh now checks for direct OAuth accounts first
   - Fetches likes, comments, views from Instagram Graph API
   - Falls back to Facebook method if account not direct OAuth
   - Updates Post model with latest engagement metrics

3. **GET /api/analytics/platform/instagram**
   - Platform-specific insights now fetch from direct OAuth accounts
   - Uses `GET /{userId}/insights?metric=follower_count,impressions,reach,profile_views`
   - Falls back to Facebook-linked accounts if no direct account found

### ✅ Authentication Flow (`routes/instagram-oauth.js`)
Complete OAuth implementation:

- **GET /api/instagram-oauth/connect** - Generates OAuth URL with HMAC-signed state
- **GET /api/instagram-oauth/callback** - Exchanges code for long-lived token (60 days)
- **GET /api/instagram-oauth/status** - Lists connected accounts
- **DELETE /api/instagram-oauth/disconnect/:accountId** - Removes account
- **GET /api/instagram-oauth/profile/:accountId** - Fetches profile with auto token refresh
- **POST /api/instagram-oauth/exchange-code** - Recovery endpoint for blocked callbacks

## API Methods Used

### Direct OAuth Accounts Use:
- **Base URL**: `https://graph.instagram.com`
- **Authentication**: Direct access token from `user.socialAccounts[].accessToken`
- **Endpoints**:
  - `GET /{userId}?fields=...` - Profile data
  - `GET /{userId}/media?fields=...` - Media feed
  - `GET /{userId}/insights?metric=...` - Account insights
  - `GET /{mediaId}/insights?metric=...` - Post insights
  - `POST /{userId}/media` - Create media container
  - `GET /{containerId}?fields=status_code` - Check container status
  - `POST /{userId}/media_publish` - Publish container

### Facebook-Linked Accounts Use:
- **Service Functions**: `getIgUser()`, `getIgFeed()`, `getIgUserInsights()` from `services/instagram.js`
- **Authentication**: Facebook page access token
- **Fallback Method**: Used when no direct OAuth account found

## Database Schema

### User Model - socialAccounts Array
```javascript
{
  platform: 'instagram',
  accountId: String,        // Instagram Business Account ID
  accountName: String,      // Instagram username
  accessToken: String,      // Long-lived token (60 days)
  tokenExpires: Date,       // Token expiration date
  isActive: Boolean,        // Account status
  connectedAt: Date         // Connection timestamp
}
```

## How It Works

### Account Detection Logic
For each Instagram operation, the system:

1. **Checks `user.socialAccounts`** array for matching Instagram account
   - Filters: `platform === 'instagram'`, `accountId === requestedId`, `isActive === true`
   - If found: Uses direct OAuth method

2. **Falls back to `user.settings.facebookPages`** if no direct account
   - Searches for page with matching `instagramId`
   - If found: Uses Facebook-linked method

3. **Returns unified response** regardless of method used
   - Frontend doesn't need to know which authentication method was used
   - Seamless experience for users with mixed account types

### Publishing Flow (Direct OAuth)
```javascript
// Step 1: Create container
POST /{userId}/media
Body: { image_url: 'cloudinaryUrl', caption: 'text' }
Response: { id: 'containerId' }

// Step 2: Poll status (every 2.5s, max 2 minutes)
GET /{containerId}?fields=status_code
Response: { status_code: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' }

// Step 3: Publish
POST /{userId}/media_publish
Body: { creation_id: 'containerId' }
Response: { id: 'publishedMediaId' }
```

## Features Now Available for Direct OAuth Accounts

✅ View Instagram feed in dashboard  
✅ See follower count, impressions, reach analytics  
✅ Publish posts from upload page  
✅ Schedule Instagram posts  
✅ Track post engagement (likes, comments, views)  
✅ Refresh analytics to get latest metrics  
✅ View platform-specific insights  
✅ Automatic token refresh (within 7 days of expiry)  

## Backward Compatibility

All existing Facebook-linked Instagram accounts continue working exactly as before:
- No code changes required on frontend
- Same API endpoints
- Same response formats
- Users can have both types of accounts simultaneously

## Testing Checklist

### OAuth Connection
- [ ] Connect Instagram account via `/dashboard/connect-accounts/instagram-oauth`
- [ ] Verify account appears in status endpoint
- [ ] Check token expiry date is ~60 days from now

### Analytics
- [ ] Open `/dashboard/analytics`
- [ ] Verify follower count includes direct OAuth account
- [ ] Check platform breakdown shows Instagram data

### Profile & Feed
- [ ] Call `/api/instagram/accounts/{igUserId}/profile`
- [ ] Verify profile data returned (username, followers, etc.)
- [ ] Call `/api/instagram/accounts/{igUserId}/feed`
- [ ] Verify media posts returned with engagement metrics

### Publishing
- [ ] Upload image to Cloudinary via `/api/upload/media`
- [ ] Use returned URL to publish via `/api/instagram/accounts/{igUserId}/publish-by-url`
- [ ] Verify container creation → polling → publish flow completes
- [ ] Check post appears on Instagram account

### Analytics Refresh
- [ ] Publish several posts to Instagram
- [ ] Call `/api/analytics/refresh`
- [ ] Verify engagement metrics updated in database
- [ ] Check `/dashboard/analytics` reflects new data

## Environment Variables Required

```env
INSTAGRAM_APP_ID=1494528788268258
INSTAGRAM_APP_SECRET=4f647e16310dd9c6d67f809a6cab83d5
INSTAGRAM_REDIRECT_URI=https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/callback
CORS_ALLOWED_ORIGINS=https://www.viralix.dev,https://viralix-b3ff86cb412f.herokuapp.com,http://localhost:3000
CLIENT_URL=https://www.viralix.dev
```

## Next Steps

1. **Deploy to Production**
   ```bash
   git add .
   git commit -m "feat: Complete Instagram direct OAuth integration across all features"
   git push heroku main
   heroku logs --tail
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set CLIENT_URL=https://www.viralix.dev
   heroku config:set CORS_ALLOWED_ORIGINS=https://www.viralix.dev,https://viralix-b3ff86cb412f.herokuapp.com,http://localhost:3000
   ```

3. **Test End-to-End**
   - Connect Instagram account in production
   - Verify analytics display correctly
   - Test publishing flow with real post
   - Check scheduled posts work with direct OAuth accounts

4. **Update Frontend (Optional)**
   - Add badge showing "Direct OAuth" vs "Facebook-linked" on account cards
   - Display different icons for each connection method
   - Show token expiry warnings for direct OAuth accounts

5. **Monitor & Optimize**
   - Check Heroku logs for any API errors
   - Monitor token refresh success rate
   - Track publishing success vs failure rate
   - Optimize API call frequency if needed

## Technical Details

### Token Lifecycle
- **Short-lived token**: 1 hour (from OAuth exchange)
- **Long-lived token**: 60 days (from token exchange)
- **Refresh window**: Can refresh within 7 days of expiry
- **Auto-refresh**: Implemented in `/profile/:accountId` endpoint

### API Rate Limits
Instagram Graph API rate limits (per app):
- 200 calls per hour per user
- Consider implementing request caching for frequently accessed data

### Error Handling
All endpoints implement try-catch blocks with fallbacks:
- Direct OAuth errors → fall back to Facebook method
- Facebook method errors → return empty/error response
- Logging at each step for debugging

## Support & Troubleshooting

### Common Issues

**Account Not Showing After Connection**
- Check `user.socialAccounts` array has entry with `platform: 'instagram'`
- Verify `isActive: true` and `accessToken` present
- Check token hasn't expired

**Publishing Fails**
- Verify media URL is publicly accessible (Cloudinary URL)
- Check container status polling (may need more time for videos)
- Ensure account has `instagram_business_content_publish` scope

**Analytics Not Updating**
- Call `/api/analytics/refresh` to force refresh
- Check Heroku logs for API errors
- Verify token is still valid (not expired)

**CORS Errors**
- Verify production domain in `CORS_ALLOWED_ORIGINS`
- Check `CLIENT_URL` environment variable is set correctly
- Visit `/api/cors/debug` to see current configuration

### Debug Endpoints
- `GET /api/instagram-oauth/connect/debug` - View OAuth configuration
- `GET /api/cors/debug` - Check CORS allowed origins
- `GET /api/instagram-oauth/status` - List connected Instagram accounts

## Documentation References

- [Instagram Graph API - Business Login](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Publishing API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Instagram Insights API](https://developers.facebook.com/docs/instagram-api/guides/insights)
- [OAuth Setup Guide](./INSTAGRAM_OAUTH_SETUP.md)
- [Troubleshooting Guide](./INSTAGRAM_TROUBLESHOOTING.md)

---

**Status**: ✅ Complete - All Instagram features now support direct OAuth accounts  
**Date**: January 2025  
**Version**: 2.0 - Dual Authentication Method Support
