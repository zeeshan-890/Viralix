# Instagram OAuth Integration Guide

## Overview
This implementation uses **Instagram Basic Display API** with direct OAuth authentication. No Facebook page linking required.

## Instagram App Configuration

### 1. App Details
- **App Name**: viralix-IG
- **App ID**: 1494528788268258
- **App Secret**: (Keep this secure in .env)

### 2. Required Instagram Account Type
Users must have one of the following account types:
- Creator Account
- Business Account  
- Professional Account

Personal accounts will NOT work with this API.

### 3. OAuth Settings

#### Valid OAuth Redirect URIs
Add these to your Instagram App settings:

**Development:**
```
http://localhost:5000/api/instagram-oauth/callback
```

**Production:**
```
https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/callback
https://api.viralix.dev/api/instagram-oauth/callback
```

#### Deauthorize Callback URL (Optional)
```
https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/deauthorize
```

#### Data Deletion Request URL (Optional)
```
https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/data-deletion
```

### 4. Permissions (Scopes)
The following scopes are requested:
- `user_profile` - Access to username, account type, media count
- `user_media` - Access to user's media (photos, videos, stories)

## Environment Variables

Add these to your `.env` file:

```properties
# Instagram Basic Display API + Graph API
INSTAGRAM_APP_ID=1494528788268258
INSTAGRAM_APP_SECRET=your-app-secret-here
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/instagram-oauth/callback
```

For production, update the redirect URI:
```properties
INSTAGRAM_REDIRECT_URI=https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/callback
```

## API Endpoints

### Backend Routes (`/api/instagram-oauth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/connect` | ✅ Yes | Initiate OAuth flow |
| GET | `/callback` | ❌ No | OAuth callback handler |
| GET | `/status` | ✅ Yes | Get connected accounts |
| GET | `/profile/:accountId` | ✅ Yes | Get account profile |
| GET | `/media/:accountId` | ✅ Yes | Get account media |
| DELETE | `/disconnect/:accountId` | ✅ Yes | Disconnect account |

### Authentication Flow

1. **User clicks "Connect Instagram"**
   - Frontend calls `GET /api/instagram-oauth/connect`
   - Returns `authUrl` with signed state token

2. **User authorizes on Instagram**
   - Redirects to Instagram OAuth page
   - User grants permissions

3. **Instagram redirects back**
   - Calls `GET /api/instagram-oauth/callback?code=xxx&state=xxx`
   - Exchanges code for access token
   - Exchanges short-lived token for long-lived token (60 days)
   - Saves token to user's `socialAccounts` array

4. **Token stored in database**
   ```javascript
   {
     platform: 'instagram',
     accountId: '17841405793187218',
     username: 'your_username',
     accountType: 'BUSINESS',
     accessToken: 'IGQVJXxxx...',
     tokenExpiry: Date(60 days from now),
     connected: true,
     connectedAt: Date()
   }
   ```

## Token Management

### Long-Lived Tokens
- **Validity**: 60 days
- **Auto-refresh**: When token has < 7 days remaining
- **Refresh endpoint**: `GET https://graph.instagram.com/refresh_access_token`

### Token Refresh Logic
```javascript
if (daysUntilExpiry < 7) {
    const refreshResponse = await axios.get(
        'https://graph.instagram.com/refresh_access_token',
        {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: currentToken
            }
        }
    );
    // Update token in database
}
```

## Security Features

### State Token
- **Format**: `userId.timestamp.nonce.signature`
- **Signature**: HMAC-SHA256 using `INSTAGRAM_APP_SECRET`
- **Expiry**: 10 minutes
- **Prevents**: CSRF attacks, token replay

### Example State Validation
```javascript
function verifyState(state) {
    const [userId, timestamp, nonce, signature] = state.split('.');
    
    // Verify HMAC signature
    const expectedSig = crypto
        .createHmac('sha256', INSTAGRAM_APP_SECRET)
        .update(`${userId}.${timestamp}.${nonce}`)
        .digest('hex');
    
    if (signature !== expectedSig) throw new Error('Invalid signature');
    
    // Check expiry (10 minutes)
    if (Date.now() - parseInt(timestamp) > 600000) {
        throw new Error('State expired');
    }
    
    return userId;
}
```

## Frontend Integration

### Connect Button Component
```jsx
import { Instagram } from 'lucide-react';
import axios from 'axios';

const handleConnect = async () => {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(
        `${API_URL}/api/instagram-oauth/connect`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Redirect to Instagram OAuth
    window.location.href = data.authUrl;
};

<button onClick={handleConnect}>
    <Instagram /> Connect Instagram
</button>
```

### Check Connection Status
```jsx
const { data } = await axios.get(
    `${API_URL}/api/instagram-oauth/status`,
    { headers: { Authorization: `Bearer ${token}` } }
);

console.log(data.connected); // true/false
console.log(data.accounts);  // Array of connected accounts
```

## User Model Schema

Add to your `User` model:

```javascript
socialAccounts: [{
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'twitter', 'linkedin'],
    },
    accountId: String,
    username: String,
    accountType: String,  // BUSINESS, CREATOR, PERSONAL
    accessToken: String,
    tokenExpiry: Date,
    connected: Boolean,
    connectedAt: Date,
}]
```

## Posting to Instagram

### Currently Supported
- View profile data
- View media feed
- Get media insights

### Publishing Media (Future)
To publish media, you'll need **Instagram Content Publishing API** which requires:
1. Facebook Business Manager
2. Instagram Business/Creator account linked to Facebook page
3. Additional app review

## Testing

### Test with Instagram Test Users
1. Go to Instagram App Dashboard
2. Navigate to "Roles" → "Instagram Testers"
3. Add test users
4. Have test users accept the invitation

### Test Flow
```bash
# 1. Start backend
cd server-autoreach-ai
npm start

# 2. Connect Instagram account
# Navigate to: http://localhost:3000/dashboard/connect-accounts/instagram-oauth

# 3. Click "Connect Instagram"

# 4. Authorize on Instagram

# 5. Check connection status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/instagram-oauth/status
```

## Troubleshooting

### Error: "redirect_uri doesn't match"
- Ensure `INSTAGRAM_REDIRECT_URI` in .env matches exactly what's configured in Instagram App
- Check for trailing slashes
- Verify protocol (http vs https)

### Error: "Invalid state"
- State token expired (>10 minutes)
- HMAC signature mismatch
- Check `INSTAGRAM_APP_SECRET` is correct

### Error: "Account type not supported"
- User must have Business/Creator account
- Guide user to convert: https://help.instagram.com/502981923235522

### Token Expired
- Tokens expire after 60 days
- Auto-refresh triggers when < 7 days remaining
- User may need to reconnect if token refresh fails

## Production Checklist

- [ ] Set `INSTAGRAM_APP_SECRET` in production environment
- [ ] Update `INSTAGRAM_REDIRECT_URI` to production URL
- [ ] Add production redirect URI in Instagram App settings
- [ ] Set app mode to "Live" in Instagram dashboard
- [ ] Test OAuth flow end-to-end
- [ ] Set up monitoring for token refresh failures
- [ ] Implement webhook for deauthorization (optional)
- [ ] Add data deletion endpoint for compliance (optional)

## Resources

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [OAuth Flow Guide](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions)
- [Long-Lived Tokens](https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens)
- [Convert to Business Account](https://help.instagram.com/502981923235522)

## Support

For issues or questions:
- Check Instagram App Dashboard for error logs
- Review server logs for OAuth callback errors
- Verify all environment variables are set correctly
- Test with Instagram test users first

---

**Note**: This implementation is for **viewing** Instagram data. To **publish** content, you'll need the Instagram Content Publishing API which requires Facebook page integration.
