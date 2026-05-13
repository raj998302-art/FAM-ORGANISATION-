# 🔥 FAM Organisation — Deployment Guide (v5)

## Architecture
- **Frontend** → Vercel (fam-organisation.vercel.app)
- **Backend**  → Render (fam-organisation.onrender.com)
- **Database** → MongoDB Atlas

---

## ✅ Step 1 — Vercel (Frontend)

The `vercel.json` is already configured correctly. Just set ONE environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://fam-organisation.onrender.com/api` |

> Go to: Vercel Dashboard → Your Project → Settings → Environment Variables → Add `VITE_API_URL`

After adding the env var, **redeploy** (Deployments → Redeploy).

---

## ✅ Step 2 — Render (Backend)

Set these environment variables in Render Dashboard → Your Service → Environment:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (64+ chars) |
| `BACKEND_URL` | `https://fam-organisation.onrender.com` |
| `FRONTEND_URL` | `https://fam-organisation.vercel.app` |
| `NODE_ENV` | `production` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `RAZORPAY_KEY_ID` | From Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay Dashboard |

---

## ✅ Step 3 — MongoDB Atlas

1. Go to **Network Access** → Add IP Address → **0.0.0.0/0** (Allow from anywhere)
   - Render uses dynamic IPs so you MUST allow all IPs
2. Make sure the database user has read/write access

---

## ✅ Step 4 — Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → Your OAuth Client
3. Under **Authorized redirect URIs**, add:
   ```
   https://fam-organisation.onrender.com/api/auth/google/callback
   ```
4. Under **Authorized JavaScript origins**, add:
   ```
   https://fam-organisation.vercel.app
   ```

---

## 🐛 Common Issues

**403 Forbidden on Vercel** → Fixed! The new `vercel.json` only builds the static frontend.

**"Failed to get auth URL"** → Make sure `VITE_API_URL` is set in Vercel env vars AND the Render backend is running.

**"API error" on login** → The Render free tier spins down after inactivity. First request after sleep takes ~30 seconds. Try logging in again.

**Google sign-in not working** → Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on Render. Add the callback URL to Google Cloud Console.

**Timeout errors** → MongoDB Atlas must have `0.0.0.0/0` in Network Access (IP Whitelist).
