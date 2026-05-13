import crypto from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const EntityModel = mongoose.model('Entity');

router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, referral_code } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already exists' });

    user = new User({ email, password, full_name, roles: ['user'] });
    await user.save();

    // Generate unique referral code: FA + first3ofUsername + 4random
    const uname = (full_name?.split(' ')[0] || email.split('@')[0]).toUpperCase().slice(0, 4);
    const myRefCode = 'FA' + uname + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create profile
    const profile = new EntityModel({ 
      type: 'UserProfile', 
      data: {
         user_id: user._id.toString(),
         user_email: email, 
         username: full_name?.split(' ')[0] || email.split('@')[0],
         ff_uid: '',
         ff_uid_set_date: null,
         ign: '',
         rank: 'bronze',
         level: 1,
         xp: 0,
         referred_by: referral_code || '',
         referral_code: myRefCode,
         signup_ip: req.ip || '0.0.0.0',
         created_date: new Date().toISOString(),
      }
    });
    await profile.save();

    // Process referral: track referral on signup, bonus given on first deposit ≥₹100
    if (referral_code) {
      try {
        const referrerProfile = await EntityModel.findOne({ type: 'UserProfile', 'data.referral_code': referral_code.toUpperCase() });
        if (referrerProfile) {
          // Only update the referred count — wallet bonus is given in payment.routes.js on first deposit
          referrerProfile.data.total_referred = (referrerProfile.data.total_referred || 0) + 1;
          referrerProfile.markModified('data');
          await referrerProfile.save();
          // Notify referrer that someone joined (bonus pending first deposit)
          await new EntityModel({ type: 'Notification', data: {
            user_email: referrerProfile.data.user_email,
            title: '🎉 New Referral!',
            message: `${full_name?.split(' ')[0] || 'A friend'} joined using your code! ₹10 bonus will be added when they make their first deposit.`,
            type: 'reward', is_read: false, created_date: new Date().toISOString(),
          }}).save();
        }
      } catch (refErr) {
        console.error('Referral processing error:', refErr.message);
      }
    }

    // Create wallet
    const wallet = new EntityModel({
      type: 'Wallet',
      data: {
         user_id: user._id.toString(),
         user_email: email,
         balance: 0,
         bonus_balance: 0,
         winnings: 0
      }
    });
    await wallet.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    const rolesData = await mongoose.model('Role').find({ name: { $in: ['user'] } });
    const permissions = new Set();
    const panels = new Set();
    rolesData.forEach(r => {
      r.permissions.forEach(p => permissions.add(p));
      r.panelAccess.forEach(p => panels.add(p));
    });

    res.json({ token, user: { id: user._id, email, full_name, roles: ['user'], permissions: Array.from(permissions), panels: Array.from(panels) } });
  } catch (error) {
    res.status(500).json({ message: error.message.includes('timeout') || error.message.includes('connect') ? 'DB Connection Error: Ensure MongoDB Atlas Network Access is set to 0.0.0.0/0' : error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

    const user = await User.findOne({ email });
    if (!user) {
      // Track failed attempt for IP blocking
      const { trackFailedAttempt } = await import('../middlewares/rateLimiter.js');
      trackFailedAttempt(ip);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const { trackFailedAttempt } = await import('../middlewares/rateLimiter.js');
      trackFailedAttempt(ip);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Clear failure count on successful login
    const { clearFailedAttempts } = await import('../middlewares/rateLimiter.js');
    clearFailedAttempts(ip);

    if (!user.roles || user.roles.length === 0) {
      user.roles = ['user'];
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    const rolesData = await mongoose.model('Role').find({ name: { $in: user.roles || ['user'] } });
    const permissions = new Set();
    const panels = new Set();
    rolesData.forEach(r => {
      r.permissions.forEach(p => permissions.add(p));
      r.panelAccess.forEach(p => panels.add(p));
    });

    res.json({ token, user: { id: user._id, email: user.email, full_name: user.full_name, roles: user.roles, permissions: Array.from(permissions), panels: Array.from(panels) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let userRoles = user.roles && user.roles.length ? user.roles : ['user'];
    
    // Auto-promote Zenus_Carlos to owner
    const isOwner = user.email.includes('zenus_carlos') || user.email === 'lolg38141@gmail.com' || (user.user_metadata && user.user_metadata.username === 'Zenus_Carlos') || user.full_name === 'Zenus_Carlos';
    if (isOwner && !userRoles.includes('owner')) {
      userRoles = Array.from(new Set([...userRoles, 'owner']));
      user.roles = userRoles;
      await user.save();
    }
    
    // Check for expired VIP subscriptions
    const EntityModel = mongoose.model('Entity');
    const activeSubs = await EntityModel.find({ type: 'Subscription', 'data.user_email': user.email, 'data.status': 'active' });
    let rolesChanged = false;
    for (const sub of activeSubs) {
      if (new Date(sub.data.end_date) < new Date()) {
        sub.data.status = 'expired';
        await sub.save();
        if (userRoles.includes(sub.data.role)) {
          userRoles = userRoles.filter(r => r !== sub.data.role);
          rolesChanged = true;
        }
      }
    }
    if (rolesChanged) {
      user.roles = userRoles;
      await user.save();
    }
    
    // Fetch roles dynamically to determine permissions and panels
    const roles = await mongoose.model('Role').find({ name: { $in: userRoles } });
    const permissions = new Set();
    const panels = new Set();
    
    // Owner bypass check
    let hasOwnerBypass = false;
    
    roles.forEach(r => {
      if (r.name === 'owner') hasOwnerBypass = true;
      r.permissions.forEach(p => permissions.add(p));
      r.panelAccess.forEach(p => panels.add(p));
    });
    
    // If user is owner, ensure all panels are active
    if (hasOwnerBypass) {
        const ALL_PANELS = [
          'master_panel',
          'admin_panel',
          'payment_panel',
          'tournament_panel',
          'vip_tournament_panel',
          'forms_panel',
          'technical_panel',
          'team_panel',
          'achievement_panel',
          'vip_zone_panel',
          'community_panel',
          'moderation_panel'
        ];
        ALL_PANELS.forEach(p => panels.add(p));
    }

    res.json({ 
      id: user._id, 
      email: user.email, 
      full_name: user.full_name,
      user_metadata: user.user_metadata || {},
      roles: userRoles,
      permissions: Array.from(permissions),
      panels: Array.from(panels)
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL || (req.protocol + '://' + req.get('host'))}/api/auth/google/callback`;
  
  if (!clientId) {
    // Return a helpful error instead of crashing
    return res.status(503).json({
      error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to Render environment variables.',
      setup_url: 'https://console.cloud.google.com/apis/credentials'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, redirect_uri: redirectUri });
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, error: oauthError } = req.query;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fire-arena-max-organisation.vercel.app';

    if (oauthError) {
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(oauthError)}`);
    }

    res.send(`
      <html>
        <head><title>Authenticating...</title></head>
        <body style="background:#0f172a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;">
          <div style="font-size:32px;">🔥</div>
          <p>Authentication successful. Redirecting...</p>
          <script>
            var code = ${JSON.stringify(code || '')};
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: code }, '*');
              setTimeout(function() { window.close(); }, 500);
            } else {
              // No popup — redirect back to frontend with code in URL
              window.location.href = ${JSON.stringify(FRONTEND_URL)} + '/login?google_code=' + encodeURIComponent(code);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fire-arena-max-organisation.vercel.app';
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

router.post('/google', async (req, res) => {
  try {
     const { code, redirect_uri } = req.body;
     const EntityModel = mongoose.model('Entity');

     // Use the canonical backend redirect URI if none provided
     const effectiveRedirectUri = redirect_uri || 
       `${process.env.BACKEND_URL || 'https://fam-organisation.onrender.com'}/api/auth/google/callback`;
     
     if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        // Fallback for preview without keys
        const mockEmail = 'google_user_' + Math.random().toString(36).substring(7) + '@gmail.com';
        let user = await User.findOne({ email: mockEmail });
        if (!user) {
           user = new User({ email: mockEmail, password: 'oauth_password', full_name: 'Google User', roles: ['user'] });
           await user.save();
           
           await new EntityModel({ type: 'UserProfile', data: { user_id: user._id.toString(), user_email: mockEmail, username: 'GoogleUser', referral_code: 'GGL' + Math.random().toString(36).substring(2, 6).toUpperCase(), level: 1, xp: 0, rank: 'bronze' }}).save();
           await new EntityModel({ type: 'Wallet', data: { user_id: user._id.toString(), user_email: mockEmail, balance: 0, bonus_balance: 0, winnings: 0 }}).save();
        }
        
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        const rolesData = await mongoose.model('Role').find({ name: { $in: ['user'] } });
        const permissions = new Set();
        const panels = new Set();
        rolesData.forEach(r => { r.permissions.forEach(p => permissions.add(p)); r.panelAccess.forEach(p => panels.add(p)); });
        
        return res.json({ token, user: { id: user._id, email: user.email, full_name: user.full_name, roles: ['user'], permissions: Array.from(permissions), panels: Array.from(panels) } });
     }
     
     // REAL OAuth Exchange
     const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: new URLSearchParams({
         client_id: process.env.GOOGLE_CLIENT_ID,
         client_secret: process.env.GOOGLE_CLIENT_SECRET,
         code,
         grant_type: 'authorization_code',
         redirect_uri: effectiveRedirectUri
       })
     });
     
     const tokenData = await tokenRes.json();
     if (tokenData.error) throw new Error(tokenData.error_description || 'OAuth token exchange failed');
     
     const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
       headers: { Authorization: `Bearer ${tokenData.access_token}` }
     });
     const userData = await userRes.json();
     
     let user = await User.findOne({ email: userData.email });
     if (!user) {
       user = new User({ email: userData.email, password: 'oauth_password', full_name: userData.name || 'Google User', roles: ['user'] });
       await user.save();
       
       await new EntityModel({ type: 'UserProfile', data: { user_id: user._id.toString(), user_email: user.email, username: userData.name, referral_code: 'GGL' + Math.random().toString(36).substring(2, 6).toUpperCase(), level: 1, xp: 0, rank: 'bronze' }}).save();
       await new EntityModel({ type: 'Wallet', data: { user_id: user._id.toString(), user_email: user.email, balance: 0, bonus_balance: 0, winnings: 0 }}).save();
     }
     
     const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
     const rolesData = await mongoose.model('Role').find({ name: { $in: user.roles || ['user'] } });
     const permissions = new Set();
     const panels = new Set();
     rolesData.forEach(r => { r.permissions.forEach(p => permissions.add(p)); r.panelAccess.forEach(p => panels.add(p)); });
     
     res.json({ token, user: { id: user._id, email: user.email, full_name: user.full_name, roles: user.roles, permissions: Array.from(permissions), panels: Array.from(panels) } });
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
});

// ── DISCORD OAuth ─────────────────────────────────────────────────────────
// GET /api/auth/discord/url  → returns Discord OAuth URL
router.get('/discord/url', (req, res) => {
  try {
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
    if (!DISCORD_CLIENT_ID) return res.status(503).json({ error: 'Discord OAuth not configured. Set DISCORD_CLIENT_ID env var.' });
    const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/api/auth/discord/callback`;
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email',
      state: Math.random().toString(36).slice(2),
    });
    res.json({ url: `https://discord.com/api/oauth2/authorize?${params}`, redirect_uri: redirectUri });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/discord/callback
router.get('/discord/callback', async (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fire-arena-max-organisation.vercel.app';
  try {
    const { code, error } = req.query;
    if (error || !code) return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error || 'discord_cancelled')}`);
    const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/api/auth/discord/callback`;
    res.send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type:'DISCORD_AUTH_SUCCESS', code: ${JSON.stringify(code)} }, '*');
          setTimeout(() => window.close(), 300);
        } else {
          window.location.href = ${JSON.stringify(FRONTEND_URL)} + '/login?discord_code=' + encodeURIComponent(${JSON.stringify(code)});
        }
      </script><p>Connecting Discord...</p></body></html>
    `);
  } catch (e) { res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(e.message)}`); }
});

// POST /api/auth/discord  — exchange code → token
router.post('/discord', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) return res.status(503).json({ error: 'Discord OAuth not configured.' });
    if (!code) return res.status(400).json({ error: 'code required' });

    // Exchange code for token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect_uri || `${process.env.BACKEND_URL}/api/auth/discord/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(400).json({ error: 'Discord token exchange failed', detail: tokenData });

    // Get Discord user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json();
    if (!discordUser.email) return res.status(400).json({ error: 'Discord account must have a verified email.' });

    const email = discordUser.email.toLowerCase();
    let user = await User.findOne({ email });
    if (!user) {
      // New user via Discord
      const username = discordUser.username || discordUser.global_name || 'Discord_User';
      user = new User({
        email,
        password: 'discord_oauth_' + Math.random().toString(36).slice(2),
        full_name: username,
        roles: ['user'],
        discord_id: discordUser.id,
        discord_username: discordUser.username,
        avatar_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256` : null,
      });
      await user.save();
      const refCode = 'DSC' + Math.random().toString(36).substring(2, 6).toUpperCase();
      await new EntityModel({ type: 'UserProfile', data: {
        user_id: user._id.toString(), user_email: email,
        username, referral_code: refCode, level: 1, xp: 0, rank: 'bronze',
        avatar_url: user.avatar_url,
        discord_id: discordUser.id,
        discord_username: discordUser.username,
      }}).save();
      await new EntityModel({ type: 'Wallet', data: { user_id: user._id.toString(), user_email: email, balance: 0, bonus_balance: 0, winnings: 0 }}).save();
      // Welcome notification
      await new EntityModel({ type: 'Notification', data: { user_email: email, title: 'Welcome to Fire Arena Max!', message: 'Login via Discord confirmed. Start competing!', type: 'system', is_read: false }}).save();
    } else {
      // Update Discord info on existing account
      user.discord_id = discordUser.id;
      user.discord_username = discordUser.username;
      if (!user.avatar_url && discordUser.avatar) {
        user.avatar_url = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
      }
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const rolesData = await mongoose.model('Role').find({ name: { $in: user.roles || ['user'] } });
    const permissions = new Set(); const panels = new Set();
    rolesData.forEach(r => { r.permissions.forEach(p => permissions.add(p)); r.panelAccess.forEach(p => panels.add(p)); });

    res.json({ token, user: { id: user._id, email: user.email, full_name: user.full_name, discord_id: user.discord_id, discord_username: user.discord_username, roles: user.roles, permissions: Array.from(permissions), panels: Array.from(panels) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/discord/link  — link Discord to existing account
router.post('/discord/link', requireAuth, async (req, res) => {
  try {
    const { discord_id, discord_username, discord_avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.discord_id && user.discord_id !== discord_id) return res.status(400).json({ error: 'Another Discord account already linked.' });
    user.discord_id = discord_id;
    user.discord_username = discord_username;
    await user.save();
    // Update profile too
    const prof = await EntityModel.findOne({ type: 'UserProfile', 'data.user_email': req.user.email });
    if (prof) { prof.data.discord_id = discord_id; prof.data.discord_username = discord_username; if (discord_avatar) prof.data.avatar_url = discord_avatar; prof.markModified('data'); await prof.save(); }
    res.json({ success: true, message: 'Discord linked successfully!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/discord/unlink
router.post('/discord/unlink', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.discord_id = null; user.discord_username = null;
    await user.save();
    res.json({ success: true, message: 'Discord unlinked.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1hr
    await EntityModel.deleteMany({ type: 'PasswordReset', 'data.email': email });
    await new EntityModel({ type: 'PasswordReset', data: { email, token, expiry } }).save();
    const url = `${process.env.FRONTEND_URL || 'https://fire-arena-max-organisation.vercel.app'}/reset-password?token=${token}`;
    console.log(`[Password Reset] ${email} → ${url}`);
    // TODO: Send email via SendGrid/Resend
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) return res.status(400).json({ message: 'Token and password (min 6 chars) required' });
    const doc = await EntityModel.findOne({ type: 'PasswordReset', 'data.token': token });
    if (!doc) return res.status(400).json({ message: 'Invalid or expired link' });
    if (new Date(doc.data.expiry) < new Date()) { await doc.deleteOne(); return res.status(400).json({ message: 'Link expired. Request a new one.' }); }
    const user = await User.findOne({ email: doc.data.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
    await doc.deleteOne();
    res.json({ message: 'Password reset successfully' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});
