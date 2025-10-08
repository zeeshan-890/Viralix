# Instagram Token Validation Fix

**Date:** October 8, 2025  
**Issue:** Token validation failing with "Unsupported request - method type: get"

## Problem

When trying to publish to Instagram via direct OAuth, the token validation was failing with the error:
```
[Publisher] Token validation failed: Unsupported request - method type: get
```

This was causing all Instagram publishing attempts to fail with a 400 error.

## Root Cause

The `validateInstagramToken` function in `services/publisher.js` was using the wrong API endpoint:

**WRONG (was using):**
```javascript
await axios.get(`${INSTAGRAM_GRAPH_URL}/${accountId}`, {
    params: {
        fields: 'id,username',
        access_token: token
    }
});
```

**Issue:** The `/{accountId}` endpoint is for the Facebook Graph API when accessing Instagram Business Accounts through Facebook Pages. It doesn't work with Instagram Basic Display API user access tokens (direct OAuth).

## Solution

Changed to use the `/me` endpoint which is the correct endpoint for Instagram Basic Display API:

**CORRECT (now using):**
```javascript
const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/me`, {
    params: {
        fields: 'id,username',
        access_token: token
    }
});
```

## Changes Made

### File: `services/publisher.js`

1. **Updated `validateInstagramToken` function:**
   - Changed endpoint from `/${accountId}` to `/me`
   - Added username logging for better debugging
   - Added error code checking (error code 190 = Invalid OAuth token)
   - Improved error messages

## API Endpoints Reference

### Instagram Basic Display API (Direct OAuth):
- **Validate Token:** `GET https://graph.instagram.com/me`
- **Refresh Token:** `GET https://graph.instagram.com/refresh_access_token`
- **Create Media:** `POST https://graph.instagram.com/me/media`
- **Publish Media:** `POST https://graph.instagram.com/me/media_publish`

### Instagram Graph API (via Facebook):
- **Get Account:** `GET https://graph.facebook.com/v19.0/{ig-user-id}`
- **Create Media:** `POST https://graph.facebook.com/v19.0/{ig-user-id}/media`
- **Publish Media:** `POST https://graph.facebook.com/v19.0/{ig-user-id}/media_publish`

## Testing

After this fix:
1. ✅ Token validation should succeed with valid tokens
2. ✅ Clear error messages for expired/invalid tokens
3. ✅ Publishing to Instagram should work correctly
4. ✅ Token refresh should work (when token expires within 7 days)

## Error Messages Improved

- **Corrupted Token:** "Instagram token is corrupted. Please disconnect and reconnect your Instagram account to get a fresh token."
- **Validation Failed:** "Instagram token validation failed: {specific error message}"
- **OAuth Error Code 190:** Automatically detected and provides reconnect instructions

## Next Steps

1. Deploy the updated `publisher.js` to Heroku
2. Test with actual Instagram OAuth account
3. Monitor logs for successful token validation
4. Verify publishing works end-to-end

## Related Files

- `services/publisher.js` - Main fix applied here
- `services/instagram.js` - Already has correct endpoints for direct OAuth
- `routes/instagram-oauth.js` - OAuth flow and token exchange
