# Instagram API Documentation - Viralix

## Overview

Meta offers **two authentication methods** for Instagram Professional accounts:

1. **Instagram API with Instagram Login** - Direct IG login, NO Facebook Page required
2. **Instagram API with Facebook Login** - Requires FB Page linked to IG account

Your app (Viralix) currently uses **Instagram Login** (the new method without FB Page requirement).

---

## API Comparison

### ✅ Instagram API with Instagram Login (NO FB Page Required)

| Feature | Permission | Available |
|---------|------------|-----------|
| Read profile info (username, bio, etc.) | `instagram_business_basic` | ✅ Yes |
| Read media/posts | `instagram_business_basic` | ✅ Yes |
| Publish photos | `instagram_business_content_publish` | ✅ Yes |
| Publish reels/videos | `instagram_business_content_publish` | ✅ Yes |
| Read comments | `instagram_business_manage_comments` | ✅ Yes |
| Reply to comments | `instagram_business_manage_comments` | ✅ Yes |
| Delete comments | `instagram_business_manage_comments` | ✅ Yes |
| Send/receive DMs | `instagram_business_manage_messages` | ✅ Yes |
| Post insights (views, reach) | `instagram_business_manage_insights` | ✅ Yes |
| Account insights (followers, impressions) | `instagram_business_manage_insights` | ✅ Yes |

### ⚠️ Requires Facebook Page Linkage

| Feature | Why FB Page Required |
|---------|---------------------|
| Hashtag search | Uses FB Graph API |
| Mentions/tagging | Needs page context |
| Story insights | Some metrics need FB |
| Webhook subscriptions | FB App Dashboard |
| Branded content | FB business relationship |

---

## Viralix Features - FB Page Requirement Status

| Feature | FB Page Required? | Notes |
|---------|------------------|-------|
| **Connect Instagram Account** | ❌ No | Uses Instagram Login |
| **View Profile & Feed** | ❌ No | `instagram_business_basic` |
| **Publish Posts/Reels** | ❌ No | `instagram_business_content_publish` |
| **View Post Insights (views, reach, saves)** | ❌ No | `instagram_business_manage_insights` |
| **Read Comments** | ❌ No | `instagram_business_manage_comments` |
| **Auto-Reply DMs** | ❌ No | `instagram_business_manage_messages` |
| **Comment Webhooks** | ✅ Yes* | FB App webhook setup |
| **Facebook Page Publishing** | ✅ Yes | Separate Facebook OAuth |

*Note: Webhooks are configured in Facebook App Dashboard but work with IG accounts.

---

## Current OAuth Scope (instagram-oauth.js)

```javascript
scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_manage_insights'
```

All these permissions work **WITHOUT Facebook Page linkage** because they use the `instagram_business_*` prefix (new API).

---

## Account Types Supported

| Account Type | Supported | Notes |
|--------------|-----------|-------|
| Instagram Business Account | ✅ Yes | Full features |
| Instagram Creator Account | ✅ Yes | Full features |
| Instagram Personal Account | ❌ No | Must convert to Business/Creator |

---

## Key Points for App Review

1. **Viralix uses Instagram API with Instagram Login** - users login directly with Instagram
2. **No Facebook Page required** for core features (publishing, insights, DMs, comments)
3. **Facebook OAuth is separate** - only needed for Facebook Page management features
4. Users only need a **Business or Creator** Instagram account (free to convert)

---

## Migration Note

Meta deprecated the old "Instagram Basic Display API" on December 4, 2024. The new "Instagram API with Instagram Login" is the replacement that provides more features without requiring Facebook Page linkage.

---

## Permissions Summary for Viralix

### Required (All work without FB Page):
- `instagram_business_basic` - Profile & feed access
- `instagram_business_content_publish` - Post publishing
- `instagram_business_manage_insights` - Analytics/insights
- `instagram_business_manage_messages` - Auto-reply DMs
- `instagram_business_manage_comments` - Comment management

### Not Used (Would require FB Page):
- `instagram_manage_insights` (old, use `instagram_business_manage_insights`)
- `instagram_content_publish` (old, use `instagram_business_content_publish`)
- Hashtag search endpoints
- Branded content features
