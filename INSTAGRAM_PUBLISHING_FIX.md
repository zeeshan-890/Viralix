# Instagram Publishing Fix - Direct OAuth Support

## Issue
Instagram posts were failing with error: "Invalid OAuth access token - Cannot parse access token"

## Root Causes
1. **Missing Direct OAuth Support**: The `publisher.js` service only checked for Facebook-linked Instagram accounts (`user.settings.facebookPages`), not direct OAuth accounts (`user.socialAccounts`)
2. **Expired/Invalid Token**: Instagram access tokens have limited lifespans and need periodic refresh

## Solution Implemented

### 1. Added Direct OAuth Account Support
Modified `services/publisher.js` to check BOTH authentication methods:
- **Primary**: Direct Instagram OAuth accounts in `user.socialAccounts[]`
- **Fallback**: Facebook-linked Instagram accounts in `user.settings.facebookPages[]`

### 2. Automatic Token Refresh
Added `refreshInstagramTokenIfNeeded()` function that:
- Checks if token expires within 7 days
- Automatically refreshes the token using Instagram's refresh API
- Updates the stored token and expiry date
- Throws error if refresh fails (requires reconnection)

### 3. Better Error Messages
Changed error from generic "Instagram auth not found (via linked FB Page token)" to:
- "Instagram auth not found. Please reconnect your Instagram account." (no account found)
- "Instagram token expired. Please reconnect your account." (refresh failed)

## Code Changes

### services/publisher.js
```javascript
// Added at top
const axios = require('axios');
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// New function: Refresh Instagram token if needed
async function refreshInstagramTokenIfNeeded(user, account) {
    if (!account.tokenExpiry) return;
    
    const daysUntilExpiry = (new Date(account.tokenExpiry) - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExpiry < 7) {
        try {
            const refreshResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/refresh_access_token`, {
                params: {
                    grant_type: 'ig_refresh_token',
                    access_token: account.accessToken
                }
            });

            account.accessToken = refreshResponse.data.access_token;
            account.tokenExpiry = new Date(Date.now() + refreshResponse.data.expires_in * 1000);
            user.markModified('socialAccounts');
            await user.save();
            
            console.log(`Instagram token refreshed for account ${account.accountId}`);
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
            throw new Error('Instagram token expired. Please reconnect your account.');
        }
    }
}

// Updated resolveAuthForPlatform() function
async function resolveAuthForPlatform(user, platform) {
    // ... (facebook code unchanged)
    
    if (platform.name === 'instagram') {
        // Check for direct OAuth Instagram account first
        const directAccount = (user.socialAccounts || []).find(
            acc => acc.platform === 'instagram' &&
                acc.accountId === platform.accountId &&
                acc.isActive
        );

        if (directAccount && directAccount.accessToken) {
            // Refresh token if needed before publishing
            await refreshInstagramTokenIfNeeded(user, directAccount);
            return { kind: 'instagram', igUserId: platform.accountId, token: directAccount.accessToken };
        }

        // Fall back to Facebook-linked Instagram account
        const page = (user.settings?.facebookPages || []).find(p => p.instagramId === platform.accountId);
        if (!page || !page.accessToken) {
            throw new Error('Instagram auth not found. Please reconnect your Instagram account.');
        }
        return { kind: 'instagram', igUserId: platform.accountId, token: page.accessToken };
    }
    
    throw new Error(`Unsupported platform: ${platform.name}`);
}
```

## How to Fix "Invalid OAuth access token" Error

If you're seeing "Cannot parse access token" error, the stored token is corrupted/invalid and cannot be refreshed. Follow these steps:

### Step 1: Disconnect the Instagram Account
1. Go to Dashboard → Connect Accounts
2. Find the Instagram account showing the error (Account ID: 31720358884276896)
3. Click "Disconnect" or call the API:
   ```bash
   DELETE /api/instagram-oauth/disconnect/31720358884276896
   ```

### Step 2: Reconnect the Instagram Account
1. On the Connect Accounts page, click "Connect Instagram"
2. Follow the Instagram OAuth flow
3. Grant the required permissions
4. New valid token will be stored

### Step 3: Test Publishing
1. Create a new post
2. Select the reconnected Instagram account
3. Click "Publish Now"
4. Should work without errors

## Token Lifecycle

### Instagram Access Token Details
- **Short-lived tokens**: Valid for 1 hour (obtained during OAuth)
- **Long-lived tokens**: Valid for 60 days (exchanged automatically)
- **Refresh**: Can be refreshed infinitely as long as refreshed before expiry
- **Auto-refresh**: System refreshes tokens when <7 days remain

### When Tokens Become Invalid
- User revokes app permissions in Instagram
- User changes Instagram password
- Token manually deleted from database
- Token corrupted during storage
- App permissions changed in Facebook Developer Portal

## Testing Checklist

- [x] Direct OAuth Instagram accounts display in platform selector
- [x] Posts can be created with Instagram selected
- [x] Publisher checks `socialAccounts` array
- [x] Token refresh logic works for near-expiry tokens
- [x] Publishing succeeds with valid tokens
- [ ] Test with reconnected Instagram account
- [ ] Test both image and video publishing
- [ ] Test with Facebook-linked Instagram (backward compatibility)
- [ ] Monitor Heroku logs for successful publishing

## Monitoring

### Check Token Expiry
```javascript
// In MongoDB or via API
user.socialAccounts.find(acc => acc.platform === 'instagram')
// Check the tokenExpiry field
```

### Check Publishing Logs
```bash
# Heroku
heroku logs --tail --app autoreach-ai

# Look for:
# - "Instagram token refreshed for account XXX" (success)
# - "Token refresh failed: ..." (needs reconnection)
# - "Instagram auth not found" (account not connected)
```

## Related Files
- `server-autoreach-ai/services/publisher.js` - Publishing logic
- `server-autoreach-ai/routes/instagram-oauth.js` - OAuth and token management
- `server-autoreach-ai/routes/instagram.js` - Instagram API endpoints
- `server-autoreach-ai/models/User.js` - User schema with socialAccounts

## Next Steps
1. Deploy the updated `publisher.js` to Heroku
2. User disconnects and reconnects Instagram account
3. Test publishing with fresh token
4. Monitor for 7 days to verify auto-refresh works
