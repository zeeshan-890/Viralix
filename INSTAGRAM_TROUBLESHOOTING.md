# Instagram OAuth Troubleshooting Guide

## Error: "Invalid platform app" or "Invalid request: Request parameters are invalid: Invalid platform app"

This error occurs when Instagram's OAuth system cannot recognize your app configuration. Here are the solutions:

---

## ✅ Solution 1: Verify Instagram App Type

Instagram has **deprecated the Basic Display API** as of December 2024. You need to use **Instagram Graph API** which requires:

### Check Your App Type:
1. Go to https://developers.facebook.com/apps/
2. Select your app (ID: 1494528788268258)
3. Check which products are added:
   - ✅ **Instagram Graph API** (Correct - for business accounts)
   - ❌ **Instagram Basic Display** (Deprecated)

### If You Have Basic Display API:
The Basic Display API was deprecated and you need to switch to Instagram Graph API, which requires Facebook page integration.

---

## ✅ Solution 2: Configure Instagram App in Meta Dashboard

### Step 1: Go to App Dashboard
https://developers.facebook.com/apps/1494528788268258/

### Step 2: Add Instagram Product
1. Click "Add Product" in left sidebar
2. Select **"Instagram"** (Instagram Graph API)
3. Click "Set Up"

### Step 3: Configure Valid OAuth Redirect URIs

Navigate to: **Instagram** → **Basic Display** (or **Graph API Settings**)

Add these **exact** redirect URIs:

**Development:**
```
http://localhost:5000/api/instagram-oauth/callback
```

**Production:**
```
https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/callback
https://api.viralix.dev/api/instagram-oauth/callback
```

⚠️ **Important:** 
- No trailing slashes
- Exact match (including http/https)
- No extra spaces
- Case-sensitive

### Step 4: Verify App Mode
- Switch app mode to **"Live"** (not Development)
- Development mode only works with test users

---

## ✅ Solution 3: Use Instagram Login (Alternative Method)

If Instagram Graph API doesn't work for direct OAuth, use **Instagram via Facebook Login**:

### This method requires:
1. User connects Facebook account first
2. Facebook page must be linked to Instagram Business account
3. Use existing `/api/facebook/oauth` flow
4. Access Instagram through Facebook pages

### Implementation:
This is already implemented in your codebase:
- Route: `/api/instagram/*` (existing)
- Requires Facebook page with linked Instagram account
- Works with current Facebook App (ID: 1494709371876394)

---

## ✅ Solution 4: Check Redirect URI Whitelist

### Current .env Configuration:
```properties
INSTAGRAM_APP_ID=1494528788268258
INSTAGRAM_APP_SECRET=4f647e16310dd9c6d67f809a6cab83d5
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/instagram-oauth/callback
```

### Verify in Instagram Dashboard:
1. Go to https://developers.facebook.com/apps/1494528788268258/instagram-basic-display/basic-display/
2. Scroll to **"Valid OAuth Redirect URIs"**
3. Ensure it contains: `http://localhost:5000/api/instagram-oauth/callback`
4. Click **"Save Changes"**

---

## ✅ Solution 5: Instagram Business Login (Recommended)

Since Instagram Basic Display is deprecated, the **recommended approach** is:

### Use Instagram via Facebook:
1. Users connect their Facebook account
2. Select a Facebook Page
3. Instagram Business account linked to that page is accessible
4. No direct Instagram OAuth needed

### Benefits:
- ✅ Stable API (not deprecated)
- ✅ Publishing capabilities
- ✅ Full analytics
- ✅ Stories support
- ✅ Comments & engagement

### Implementation:
Already available in your app at:
- Frontend: `/dashboard/connect-accounts/instagram`
- Backend: `/api/instagram/*` routes

---

## 🔍 Debugging Steps

### 1. Check OAuth URL Being Generated
Add logging to see the exact URL:

```javascript
// In routes/instagram-oauth.js - /connect endpoint
console.log('Instagram OAuth URL:', authUrl);
console.log('Redirect URI:', IG_REDIRECT_URI);
console.log('App ID:', IG_APP_ID);
```

### 2. Test OAuth URL Manually
Copy the generated URL and paste in browser to see exact error from Instagram.

### 3. Verify App Secret
Ensure `INSTAGRAM_APP_SECRET` in .env matches the secret in Meta dashboard:
1. Go to https://developers.facebook.com/apps/1494528788268258/settings/basic/
2. Click "Show" next to App Secret
3. Compare with .env value

### 4. Check App Status
- App must be in **Live** mode for production users
- App must have **Instagram** product added
- App must pass **App Review** for `instagram_basic` or `instagram_graph_user_profile` permissions

---

## 📋 Quick Checklist

- [ ] Instagram product added to Meta app
- [ ] Redirect URI matches exactly (no spaces, correct protocol)
- [ ] Redirect URI added to whitelist in Meta dashboard
- [ ] App is in "Live" mode (not Development)
- [ ] App Secret is correct in .env
- [ ] Instagram account is Business/Creator (not Personal)
- [ ] App has passed review for required permissions (if using Basic Display)

---

## 🎯 Recommended Solution

Given that **Instagram Basic Display API is deprecated**, we recommend:

### Option A: Use Facebook Login → Instagram (Current Working Method)
- Already implemented in your app
- Users connect Facebook first
- Access Instagram through Facebook pages
- Full publishing and analytics capabilities

### Option B: Wait for Instagram API Update
- Instagram is transitioning away from Basic Display
- New direct OAuth methods may be announced
- Current implementation may need updates

### Option C: Use Instagram Graph API with Facebook
- Requires Facebook Business Manager
- Instagram Business account linked to Facebook page
- Most stable and feature-complete option

---

## 🚀 Next Steps

1. **Immediate Solution:** Guide users to use **"Instagram via Facebook"** option
2. **Update UI:** Show Instagram Direct OAuth as "Coming Soon" or remove temporarily
3. **Monitor:** Watch for Instagram API updates from Meta
4. **Alternative:** Implement Instagram Graph API with Facebook page requirement

---

## 📞 Support Resources

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Meta Platform Status](https://developers.facebook.com/status/)
- [Instagram Basic Display Deprecation Notice](https://developers.facebook.com/blog/post/2024/09/04/instagram-basic-display-api-deprecation/)

---

## 🔧 Temporary Fix

Until Instagram OAuth is resolved, update the Connect Accounts page to:

1. **Hide or disable** Instagram Direct OAuth button
2. **Promote** Instagram via Facebook connection
3. **Show message:** "Connect Instagram through your Facebook page for full functionality"

This ensures users can still connect Instagram accounts via the working Facebook integration method.
