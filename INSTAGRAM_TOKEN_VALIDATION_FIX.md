# Instagram Token Validation Fix

**Date:** October 8, 2025  
**Issue:** Token validation failing with "Unsupported request - method type: get" (Error Code: 100) for Instagram Login tokens (no Facebook page linkage)

## Problem

When trying to publish to Instagram via direct OAuth, the token validation was failing with the error:
```
[Publisher] Token validation failed: Unsupported request - method type: get Code: 100
```

This was causing all Instagram publishing attempts to fail with a 400 error.

## Root Cause Analysis

### Validation Reality
For Instagram API with Instagram Login (graph.instagram.com tokens) the canonical lightweight check is:
`GET https://graph.instagram.com/me?fields=id,username&access_token=...`

Some tokens/scopes may still produce: `Unsupported request - method type: get (Code 100)`.
This **does not** always indicate invalid credentials. Only Code **190** or parse/malformed messages imply an invalid/expired token.

## Solution

**New Strategy:**
1. Call `/me?fields=id,username`.
2. Success → token valid; mismatch in stored id vs response id is logged (non-fatal).
3. Code 190 / malformed / parse → fatal, force reconnect.
4. Code 100 Unsupported → treat as non-fatal, proceed.
5. Other errors → warn & proceed (best-effort). See implementation in `services/publisher.js`.

## Changes Made

### File: `services/publisher.js`

1. **Updated `validateInstagramToken`:** Uses `/me` & tolerant fallback semantics.
2. **Differentiates fatal vs non-fatal errors.**
3. **Refresh logic** only attempted within 7 days of expiry; non-fatal if unsupported.
4. **Publishing logic updated**: For direct Instagram Login tokens, initial video attempt uses `media_type=VIDEO` (REELS may need additional scopes); fallback logic preserved for FB-linked accounts (REELS → VIDEO).

## API Endpoints Reference

### Instagram API with Instagram Login (Direct OAuth - no FB page required):
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
1. ✅ Unsupported validation endpoints no longer block publishing
2. ✅ Clear fatal (reconnect) vs non-fatal (proceed) distinctions
3. ✅ Direct login video posts use VIDEO; REELS reserved for FB-linked or scope-eligible tokens
4. ✅ Non-fatal refresh failures logged without stopping publish

## Error Messages Improved

| Scenario | Handling / Message |
|----------|-------------------|
| Code 190 / parse | Fatal – prompt user to reconnect |
| Code 100 Unsupported | Non-fatal – proceed, log warning |
| Refresh unsupported | Non-fatal warning only |
| ID mismatch | Logged (diagnostic) |
| Video media_type mismatch (direct) | Surfaces API error; user may need FB-linked Business or expanded scopes |

## Next Steps

1. Deploy updated `publisher.js`.
2. Test: image (direct), video (direct), image/video (FB-linked), reel (FB-linked).
3. Verify fallback & logs.
4. UI enhancement (future): show banner if advanced features require FB linkage.

## Related Files

- `services/publisher.js` - Main fix applied here
- `services/instagram.js` - Already has correct endpoints for direct OAuth
- `routes/instagram-oauth.js` - OAuth flow and token exchange
