# Instagram OAuth - Deployment Checklist

## Files Changed (Push to Git & Deploy)

### Backend Files Modified
- ✅ `routes/instagram-oauth.js` - Fixed schema field names (accountName, tokenExpires, isActive)
- ✅ `server.js` - Enhanced security headers, added CORS debug endpoint

### Documentation Created
- ✅ `INSTAGRAM_OAUTH_COMPLETE.md` - Complete implementation guide
- ✅ `INSTAGRAM_OAUTH_SETUP.md` - Original setup guide
- ✅ `INSTAGRAM_TROUBLESHOOTING.md` - Troubleshooting guide
- ✅ `INSTAGRAM_API_OPTIONS.md` - API options comparison

---

## Deployment Steps

### 1. Git Commit & Push (Backend)
```bash
cd server-autoreach-ai
git add .
git commit -m "Fix Instagram OAuth schema mismatch - accounts now appear correctly"
git push origin main
```

### 2. Heroku Deploy (if not auto-deploy)
```bash
git push heroku main
```

### 3. Verify Environment Variables (Heroku Dashboard or CLI)
```bash
heroku config:set CORS_ALLOWED_ORIGINS="https://www.viralix.dev,https://viralix-b3ff86cb412f.herokuapp.com,http://localhost:3000" --app viralix-b3ff86cb412f
heroku config:set CLIENT_URL="https://www.viralix.dev" --app viralix-b3ff86cb412f
```

### 4. Restart Heroku Dyno
```bash
heroku restart --app viralix-b3ff86cb412f
```

---

## Testing Procedure

### Step 1: Clear Browser Cache
Hard refresh the frontend:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### Step 2: Test OAuth Flow
1. Go to: https://www.viralix.dev/dashboard/connect-accounts
2. Click "Connect Instagram" (or "Manage" if already connected)
3. Use **Firefox** or **Edge** (avoid Chrome warning for now)
4. Complete Instagram authorization
5. Should redirect back with success message

### Step 3: Verify Account Appears
1. After redirect, account should show in:
   - Connect Accounts page (Instagram card)
   - Instagram OAuth page (full details)
2. If not showing, check:
   - Browser console for errors
   - Network tab for `/api/instagram-oauth/status` response
   - Response should have `accounts` array with at least 1 item

### Step 4: Check Heroku Logs
```bash
heroku logs --tail --app viralix-b3ff86cb412f
```

Look for:
- `[IG Business Login] Account saved successfully`
- `[IG Status] Found 1 Instagram accounts for user: user@email.com`
- No error messages about validation or schema

---

## If Account Still Not Showing

### Option A: Use Recovery Endpoint
If you have the authorization code from the blocked URL, use the recovery endpoint.

Open browser console on https://www.viralix.dev and run:
```javascript
fetch('https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/exchange-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  },
  body: JSON.stringify({
    code: 'YOUR_CODE_FROM_BLOCKED_URL'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Result:', data);
  if (data.success) {
    alert('Instagram connected! Refresh the page.');
    location.reload();
  }
})
.catch(err => console.error('❌ Failed:', err));
```

### Option B: Reconnect
1. Go to Instagram OAuth page
2. If account shows there, click Disconnect
3. Wait 5 seconds
4. Click Connect Instagram again
5. Complete flow in Firefox/Edge

---

## Verification Commands

### Check Status Endpoint Directly
```bash
# Replace TOKEN with your auth_token from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/status
```

Expected response:
```json
{
  "connected": true,
  "accounts": [
    {
      "accountId": "123456789",
      "username": "your_username",
      "accountType": "BUSINESS",
      "connectedAt": "2025-10-07T...",
      "tokenExpiry": "2025-12-06T..."
    }
  ]
}
```

### Check CORS Configuration
```bash
curl https://viralix-b3ff86cb412f.herokuapp.com/api/cors/debug
```

Should show your production domain in `allowed_origins`.

---

## Success Criteria

✅ OAuth flow completes without errors  
✅ Success message appears after redirect  
✅ Account shows in Connect Accounts page  
✅ Account details visible in Instagram OAuth page  
✅ Status endpoint returns accounts array  
✅ No CORS errors in browser console  
✅ Heroku logs show successful account save  

---

## Rollback Plan (If Issues Persist)

If the new code causes issues:

```bash
# Revert to previous commit
git log  # Find previous commit hash
git revert <commit-hash>
git push heroku main

# Or rollback on Heroku directly
heroku releases --app viralix-b3ff86cb412f
heroku rollback v123 --app viralix-b3ff86cb412f  # Replace v123 with previous version
```

---

## Post-Deployment Monitoring

Watch logs for 5-10 minutes after deployment:
```bash
heroku logs --tail --app viralix-b3ff86cb412f | grep -i instagram
```

Look for:
- No error messages
- Successful OAuth completions
- Accounts being found in status checks

---

## Contact Points

- **Heroku Dashboard:** https://dashboard.heroku.com/apps/viralix-b3ff86cb412f
- **Meta App Dashboard:** https://developers.facebook.com/apps/1494528788268258
- **Production Frontend:** https://www.viralix.dev
- **API Base:** https://viralix-b3ff86cb412f.herokuapp.com

---

**Deployment Date:** ________________  
**Deployed By:** ________________  
**Status:** ⬜ Pending ⬜ Success ⬜ Issues Found
