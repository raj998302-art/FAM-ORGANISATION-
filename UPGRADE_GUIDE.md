# FAM_UPGRADED — Production Upgrade Guide

## What Was Upgraded

### 1. Cloudinary Image Upload System
**Files changed:** `backend/routes/upload.routes.js`, `src/pages/Profile.jsx`, `src/api/apiClient.js`

#### How It Works Now:
- User selects avatar → FormData sent to `POST /api/upload/avatar`
- Backend streams image directly to Cloudinary (no disk storage ever)
- Cloudinary returns `secure_url` → stored in MongoDB `UserProfile.data.avatar_url`
- Frontend displays via `<img src={user.avatar_url} />`

#### Required Env Vars (Render.com):
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Get Cloudinary Credentials:
1. Sign up at cloudinary.com (free tier: 25GB storage, 25GB bandwidth/month)
2. Dashboard → Copy Cloud name, API Key, API Secret

---

### 2. Real-Time Socket.IO
**Files changed:** `server.js`, `backend/config/socket.js`, `backend/routes/db.routes.js`, `src/lib/SocketContext.jsx`, `src/App.jsx`

#### How It Works:
- When admin saves AppSettings, `db.routes.js` calls `emitSettingsUpdated()`
- Socket.IO broadcasts `settingsUpdated` event to ALL connected clients
- `SocketContext.jsx` in React listens and updates `settings` state globally
- No page refresh needed — all users see updated limits/settings instantly

#### Future Real-Time Events Available:
- `tournamentUpdated` — live tournament status changes
- `notification` — push notifications to specific users
- Emit from backend: `import { emitTournamentUpdate } from '../config/socket.js'`

---

### 3. Security Hardening
**Files changed:** `server.js`, `backend/config/sentry.js`, `backend/config/logger.js`, `backend/middlewares/rateLimiter.js`, `backend/middlewares/errorHandler.js`, `backend/middlewares/requestLogger.js`

#### Content Security Policy (CSP):
Helmet is now configured with strict CSP that:
- Allows Razorpay scripts/frames
- Allows Cloudinary images
- Allows WebSocket connections for Socket.IO
- Blocks all other external script sources

#### Rate Limiting Tiers:
| Route | Limit | Window |
|-------|-------|--------|
| All `/api/` routes | 100 req | 15 min |
| `/api/auth/` routes | 5 req | 1 min |
| `/api/upload/` routes | 10 req | 1 min |
| Admin routes | 30 req | 1 min |

#### IP Auto-Block:
- After 20 consecutive auth failures from same IP → IP blocked for 30 minutes
- Logged to Winston + visible in `logs/admin-actions.log`

#### Winston Logging Files:
| File | Content |
|------|---------|
| `logs/combined.log` | All requests, info, warnings |
| `logs/error.log` | Errors only |
| `logs/admin-actions.log` | Admin changes, bans, deposits |
| `logs/payments.log` | Payment events |

#### Sentry Setup:
1. Sign up at sentry.io
2. Create Node.js project → copy DSN
3. Add `SENTRY_DSN=https://...` to Render env vars
4. All 5xx errors automatically captured with user context

---

### 4. TechnicalPanel — Website URL + Live Indicator
**File changed:** `src/pages/TechnicalPanel.jsx`

- New **Website URL** field in Settings tab (stored in `AppSettings.website_url`)
- Real-time **LIVE / OFFLINE** badge showing Socket.IO connection status
- When admin saves settings — all users receive update via WebSocket instantly

---

### 5. HowItWorks — Custom SVG Icons
**File changed:** `src/pages/HowItWorks.jsx`

- All emoji icons replaced with custom SVG components
- Icons match the app's cyan/blue/purple gaming theme
- Built-in (no external icon library needed)
- Each step icon: Signup, Deposit, Tournament, Controller, Prize
- Each earn way icon: Trophy, Spin Wheel, Calendar, Missions, Referral, Season Pass, Predict, Gift

---

## Full Dependency List (New Additions)

```bash
npm install cloudinary socket.io socket.io-client @sentry/node winston
```

Or just run `npm install` — all are already in `package.json`.

---

## Environment Variables Summary

```env
# Cloudinary (REQUIRED for avatar uploads)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Sentry (optional but recommended)
SENTRY_DSN=https://xxx@oxx.ingest.sentry.io/xxx

# Logging level
LOG_LEVEL=info

# Existing vars (unchanged)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
FRONTEND_URL=https://your-vercel-app.vercel.app
BACKEND_URL=https://your-render-app.onrender.com
```

---

## Deployment Steps (Render.com Backend)

1. Push code to GitHub
2. Render auto-deploys on push
3. Add env vars in Render dashboard → Environment tab
4. **Required:** Add all 3 Cloudinary vars
5. **Optional:** Add SENTRY_DSN
6. Check logs in Render → Logs tab (Winston also writes to disk)

---

## Testing the Upgrades

### Test Avatar Upload:
```
1. Login → Profile page
2. Click camera icon or avatar area
3. Select JPG/PNG/WEBP under 2MB
4. Should see "Avatar updated!" toast
5. Avatar should display immediately from Cloudinary URL
```

### Test Real-Time Settings:
```
1. Open app in two browser tabs
2. In Tab 1: Go to TechnicalPanel (admin)
3. Change "Max Deposit" value → Save
4. In Tab 2: The settings should update without refresh
   (check browser console for "[Socket] Settings updated received")
```

### Test Rate Limiting:
```
# Hit auth endpoint 6+ times in 1 minute
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"x","password":"y"}'
# 6th request should return 429
```
