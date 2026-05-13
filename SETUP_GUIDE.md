# 🔧 FAM Organisation — OAuth & Services Setup Guide

## ━━━ DISCORD LOGIN SETUP ━━━━━━━━━━━━━━━━━━━━━━━

### Step 1: Create Discord Application
1. Go to: https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it: `Fire Arena Max`
4. Click **Create**

### Step 2: Set Up OAuth2
1. In your app → click **"OAuth2"** in left sidebar
2. Click **"Add Redirect"**
3. Add this URL:  
   `https://YOUR-BACKEND-URL.onrender.com/api/auth/discord/callback`
   
   *(Replace with your actual Render backend URL)*

4. Copy these values:
   - **Client ID** (shown at top of OAuth2 page)
   - **Client Secret** (click "Reset Secret" to get it)

### Step 3: Add to Render Environment Variables
Go to your Render backend service → **Environment**:

```
DISCORD_CLIENT_ID=paste_your_client_id_here
DISCORD_CLIENT_SECRET=paste_your_client_secret_here
BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 4: Test It
- Open your site → Login page → Click "Continue with Discord"
- It opens Discord OAuth popup
- User approves → Logged in automatically

---

## ━━━ GOOGLE SIGN-IN (Already Working) ━━━━━━━━━

Your Google Sign-In is already set up. If it's not working:

1. Go to: https://console.cloud.google.com
2. APIs & Services → Credentials
3. Your OAuth 2.0 Client → Add these to Authorized redirect URIs:
   ```
   https://YOUR-BACKEND.onrender.com/api/auth/google/callback
   http://localhost:5173/auth/google/callback
   ```

---

## ━━━ GOOGLE PLAY GAMES SERVICES ━━━━━━━━━━━━━━

> **Important:** Google Play Games Services is designed for Android **games**, not websites.
> For your web app, the FAM leaderboard system already works natively.
> 
> For the **Android app** (when you build it), here's the setup:

### For Android App (Termux/EAS build):
1. Go to: https://play.google.com/console
2. Create your app → **Play Games Services** → Setup
3. Create Game ID
4. Add your app's SHA-1 fingerprint
5. Download `google-services.json` → place in Android project root
6. Enable Leaderboards, Achievements in the console

### For Web — What We Use Instead:
- FAM has its **own leaderboard** (XP, Wins, Earnings, Kills)
- **Achievements system** with badges
- These are stored in your MongoDB database
- No Google dependency needed for web

---

## ━━━ RENDER ENVIRONMENT VARIABLES CHECKLIST ━━━

Make sure ALL these are set in Render:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your_long_random_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Discord OAuth (NEW - add these now)
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# URLs
BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-app.vercel.app

# Payment (optional)
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
```

---

## ━━━ QUICK DEPLOY CHECKLIST ━━━━━━━━━━━━━━━━━━

After uploading v12 to GitHub:

1. ✅ Render auto-deploys backend
2. ✅ Vercel auto-deploys frontend  
3. Add Discord env vars to Render
4. Test Discord login
5. Test maintenance mode (your email: raj998302@gmail.com always bypasses)

**Your owner email `raj998302@gmail.com` is hardcoded to ALWAYS bypass maintenance mode.**
