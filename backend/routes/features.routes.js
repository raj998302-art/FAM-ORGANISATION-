/**
 * features.routes.js
 * ─────────────────────────────────────────────────────────────
 * PROFIT MODEL:
 *   • Users BUY coins with real ₹ (1 coin = ₹1)
 *   • Free activities (spin, daily, missions) give XP ONLY → no monetary loss
 *   • XP levels up profile (cosmetic) — zero real value
 *   • Coins are spent on: VIP plans, Season Pass, Store badges, tournament entry
 *   • Season Pass: 199 coins/season (₹199 profit per pass)
 *   • Store badges: 49–499 coins each (pure profit)
 * ─────────────────────────────────────────────────────────────
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const E = () => mongoose.model('Entity');

// ── IST 1 AM Reset Logic ─────────────────────────────────────
// ALL daily activities reset at 1:00 AM IST every night
// IST = UTC+5:30 | Reset at 1 AM IST = 19:30 UTC previous day
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const RESET_HOUR_IST = 1; // 1 AM IST

function getISTDayKey(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  if (ist.getUTCHours() < RESET_HOUR_IST) {
    ist.setUTCDate(ist.getUTCDate() - 1);
  }
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysDiffIST(key1, key2) {
  const d1 = new Date(key1 + 'T07:30:00Z');
  const d2 = new Date(key2 + 'T07:30:00Z');
  return Math.round((d1.getTime() - d2.getTime()) / 86400000);
}

function getISTWeekKey(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  if (ist.getUTCHours() < RESET_HOUR_IST) ist.setUTCDate(ist.getUTCDate() - 1);
  const day = ist.getUTCDay();
  const monday = new Date(ist);
  monday.setUTCDate(ist.getUTCDate() - ((day + 6) % 7));
  return `${monday.getUTCFullYear()}-W${String(monday.getUTCMonth()+1).padStart(2,'0')}-${String(monday.getUTCDate()).padStart(2,'0')}`;
}

// ── Rank thresholds (XP-based) ────────────────────────────────
const RANK_THRESHOLDS = [
  { rank: 'bronze',      minXP: 0     },
  { rank: 'silver',      minXP: 500   },
  { rank: 'platinum',    minXP: 1500  },
  { rank: 'diamond',     minXP: 3000  },
  { rank: 'heroic',      minXP: 6000  },
  { rank: 'master',      minXP: 10000 },
  { rank: 'grandmaster', minXP: 20000 },
];

function calculateRank(xp) {
  let rank = 'bronze';
  for (const t of RANK_THRESHOLDS) {
    if (xp >= t.minXP) rank = t.rank;
    else break;
  }
  return rank;
}

// ── XP helper ────────────────────────────────────────────────
async function grantXP(userEmail, xpAmount, reason) {
  try {
    let prof = await E().findOne({ type: 'UserProfile', 'data.user_email': userEmail });
    if (!prof) return;

    const oldXP    = prof.data.xp   || 0;
    const oldLevel = prof.data.level || 1;
    const oldRank  = prof.data.rank  || 'bronze';

    const newXP    = oldXP + xpAmount;
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newXP / 50)));
    const newRank  = calculateRank(newXP);

    prof.data.xp    = newXP;
    prof.data.level = newLevel;
    prof.data.rank  = newRank;
    prof.markModified('data'); // CRITICAL: Mongoose needs this for nested object changes

    await prof.save();

    // Level-up notification
    if (newLevel > oldLevel) {
      await new (E())({ type: 'Notification', data: {
        user_email: userEmail,
        title: `Level Up! You're now Level ${newLevel}!`,
        message: `You reached Level ${newLevel}! Keep playing to unlock more profile perks.`,
        type: 'level_up', created_date: new Date().toISOString()
      }}).save();
    }

    // Rank-up notification
    if (newRank !== oldRank) {
      const rankEmojis = { silver:'🥈', platinum:'💠', diamond:'💎', heroic:'🔥', master:'⚔️', grandmaster:'👑' };
      await new (E())({ type: 'Notification', data: {
        user_email: userEmail,
        title: `Rank Up! You reached ${newRank.charAt(0).toUpperCase()+newRank.slice(1)}!`,
        message: `Incredible! You've ranked up to ${newRank.charAt(0).toUpperCase()+newRank.slice(1)} with ${newXP} XP!`,
        type: 'rank_up', created_date: new Date().toISOString()
      }}).save();
    }

    return { xp: newXP, level: newLevel, leveledUp: newLevel > oldLevel, rank: newRank, rankedUp: newRank !== oldRank };
  } catch(e) { console.error('grantXP error:', e.message); }
}

// ══════════════════════════════════════════════════════════════
// DAILY REWARD — gives XP only (no coins, no monetary loss)
// ══════════════════════════════════════════════════════════════
const DAILY_XP = [
  { day:1, xp:20,  icon:'⭐', label:'Day 1' },
  { day:2, xp:30,  icon:'⭐', label:'Day 2' },
  { day:3, xp:50,  icon:'💫', label:'Day 3' },
  { day:4, xp:60,  icon:'💫', label:'Day 4', bonus:'badge_streak' },
  { day:5, xp:80,  icon:'🔥', label:'Day 5' },
  { day:6, xp:100, icon:'🔥', label:'Day 6' },
  { day:7, xp:200, icon:'👑', label:'Day 7 MEGA', bonus:'badge_loyal' },
];

router.get('/daily-reward/status', requireAuth, async (req, res) => {
  try {
    const claim = await E().findOne({ type:'DailyReward', 'data.user_email':req.user.email });
    const todayKey = getISTDayKey();
    if (!claim) return res.json({ streak:0, canClaim:true, nextReward:DAILY_XP[0], rewards:DAILY_XP, totalXP:0, todayKey });
    const lastKey = claim.data.last_day_key || getISTDayKey(new Date(claim.data.last_claim));
    const diff = daysDiffIST(todayKey, lastKey);
    let streak = claim.data.streak || 0;
    if (diff === 0) return res.json({ streak, canClaim:false, claimedToday:true, nextReward:DAILY_XP[streak%7], rewards:DAILY_XP, totalXP:claim.data.total_xp||0, todayKey });
    if (diff > 1) streak = 0;
    res.json({ streak, canClaim:true, nextReward:DAILY_XP[streak%7], rewards:DAILY_XP, totalXP:claim.data.total_xp||0, todayKey });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

router.post('/daily-reward/claim', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const todayKey = getISTDayKey(now);
    let claim = await E().findOne({ type:'DailyReward', 'data.user_email':req.user.email });
    let streak = 0;
    if (claim) {
      const lastKey = claim.data.last_day_key || getISTDayKey(new Date(claim.data.last_claim));
      const diff = daysDiffIST(todayKey, lastKey);
      if (diff === 0) return res.status(400).json({ error:'Already claimed today! Come back after 1 AM IST.' });
      streak = diff > 1 ? 0 : claim.data.streak;
    }
    const reward = DAILY_XP[streak % 7];
    streak++;
    const xpResult = await grantXP(req.user.email, reward.xp, `daily_login_day${streak}`);

    // Unlock badge on day 4 & 7
    let badgeUnlocked = null;
    if (reward.bonus) {
      const already = await E().findOne({ type:'UserBadge', 'data.user_email':req.user.email, 'data.badge_id':reward.bonus });
      if (!already) {
        await new (E())({ type:'UserBadge', data:{ user_email:req.user.email, badge_id:reward.bonus, unlocked_at:now.toISOString(), source:'daily_streak' } }).save();
        badgeUnlocked = reward.bonus;
      }
    }

    // Grant spin ticket on day 7
    if (streak % 7 === 0) {
      const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });
      if (prof) { prof.data.spin_tickets = (prof.data.spin_tickets || 0) + 1; prof.markModified('data'); await prof.save(); }
    }

    if (claim) {
      claim.data.streak = streak;
      claim.data.last_claim = now.toISOString();
      claim.data.last_day_key = todayKey;
      claim.data.total_xp = (claim.data.total_xp || 0) + reward.xp;
      claim.markModified('data');
      await claim.save();
    } else {
      await new (E())({ type:'DailyReward', data:{ user_email:req.user.email, streak, last_claim:now.toISOString(), last_day_key:todayKey, total_xp:reward.xp } }).save();
    }

    res.json({ success:true, xp:reward.xp, streak, leveledUp:xpResult?.leveledUp, newLevel:xpResult?.level, badgeUnlocked, spinTicketGranted: streak % 7 === 0 });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// SPIN WHEEL — XP only, never coins
// ══════════════════════════════════════════════════════════════
const SPIN_REWARDS = [
  { id:0, type:'xp', xp:10,  label:'+10 XP',    color:'cyan',   icon:'⭐', weight:25 },
  { id:1, type:'xp', xp:25,  label:'+25 XP',    color:'blue',   icon:'💫', weight:20 },
  { id:2, type:'xp', xp:50,  label:'+50 XP',    color:'purple', icon:'🔥', weight:15 },
  { id:3, type:'xp', xp:100, label:'+100 XP',   color:'gold',   icon:'👑', weight:10 },
  { id:4, type:'xp', xp:5,   label:'+5 XP',     color:'slate',  icon:'⭐', weight:20 },
  { id:5, type:'badge', badge:'badge_lucky', xp:30, label:'Badge!', color:'gold', icon:'🏅', weight:3 },
  { id:6, type:'xp', xp:75,  label:'+75 XP',    color:'green',  icon:'💎', weight:5 },
  { id:7, type:'xp', xp:15,  label:'+15 XP',    color:'cyan',   icon:'⭐', weight:12 },
];

router.get('/spin/status', requireAuth, async (req, res) => {
  try {
    const todayKey = getISTDayKey();
    const todaySpin = await E().findOne({ type:'SpinRecord', 'data.user_email':req.user.email, 'data.day_key':todayKey });
    const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });
    const extraTickets = prof?.data?.spin_tickets || 0;
    res.json({ canSpin:!todaySpin, extraTickets, rewards:SPIN_REWARDS, resetTime:'1 AM IST' });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

router.post('/spin/spin', requireAuth, async (req, res) => {
  try {
    const { useTicket } = req.body;
    const todayKey = getISTDayKey();
    const todaySpin = await E().findOne({ type:'SpinRecord', 'data.user_email':req.user.email, 'data.day_key':todayKey });

    if (todaySpin && !useTicket) return res.status(400).json({ error:'Daily spin already used! Resets at 1 AM IST. Use a ticket for extra spins.' });

    if (useTicket) {
      const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });
      if (!prof?.data?.spin_tickets || prof.data.spin_tickets < 1) return res.status(400).json({ error:'No spin tickets! Earn them from 7-day streaks.' });
      prof.data.spin_tickets -= 1;
      prof.markModified('data');
      await prof.save();
    }

    // Weighted random selection
    const total = SPIN_REWARDS.reduce((s,r) => s+r.weight, 0);
    let rand = Math.random() * total, chosen = SPIN_REWARDS[0];
    for (const r of SPIN_REWARDS) { rand -= r.weight; if (rand <= 0) { chosen = r; break; } }

    const xpResult = await grantXP(req.user.email, chosen.xp || 0, 'spin_wheel');

    let badgeUnlocked = null;
    if (chosen.type === 'badge' && chosen.badge) {
      const already = await E().findOne({ type:'UserBadge', 'data.user_email':req.user.email, 'data.badge_id':chosen.badge });
      if (!already) {
        await new (E())({ type:'UserBadge', data:{ user_email:req.user.email, badge_id:chosen.badge, unlocked_at:new Date().toISOString(), source:'spin_wheel' } }).save();
        badgeUnlocked = chosen.badge;
      }
    }

    if (!todaySpin && !useTicket) {
      await new (E())({ type:'SpinRecord', data:{ user_email:req.user.email, day_key:todayKey, reward:chosen, ts:new Date().toISOString() } }).save();
    }

    res.json({ success:true, rewardIndex:chosen.id, reward:chosen, xpGained:chosen.xp||0, leveledUp:xpResult?.leveledUp, newLevel:xpResult?.level, badgeUnlocked });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// MISSIONS — XP rewards (no coins)
// ══════════════════════════════════════════════════════════════
const MISSIONS_DEF = [
  { id:'login',   title:'Daily Login',       xp:20,  type:'daily',  icon:'📅', desc:'Login today' },
  { id:'play1',   title:'Play a Tournament', xp:50,  type:'daily',  icon:'🏆', desc:'Join any tournament' },
  { id:'chat5',   title:'Chat 5 Times',      xp:30,  type:'daily',  icon:'💬', desc:'Send 5 chat messages' },
  { id:'spin1',   title:'Spin the Wheel',    xp:25,  type:'daily',  icon:'🎡', desc:'Use the spin wheel' },
  { id:'view_vip',title:'View VIP Plans',    xp:10,  type:'daily',  icon:'👑', desc:'Check out VIP plans' },
  { id:'win1',    title:'Win a Match',       xp:150, type:'weekly', icon:'🥇', desc:'Win a tournament match' },
  { id:'ref1',    title:'Invite a Friend',   xp:100, type:'weekly', icon:'👥', desc:'Refer someone who signs up' },
  { id:'top10',   title:'Top 10 Finish',     xp:75,  type:'weekly', icon:'🎯', desc:'Finish in top 10 in any match' },
  { id:'dep1',    title:'First Deposit',     xp:200, type:'weekly', icon:'💳', desc:'Make any deposit' },
  { id:'buy_store',title:'Buy a Store Item', xp:80,  type:'weekly', icon:'🛍️', desc:'Purchase anything from the store' },
];

router.get('/missions', requireAuth, async (req, res) => {
  try {
    const todayKey = getISTDayKey();
    const weekKey  = getISTWeekKey();
    const dailyProgress  = await E().findOne({ type:'MissionProgress', 'data.user_email':req.user.email, 'data.day_key':todayKey });
    const weeklyProgress = await E().findOne({ type:'MissionProgress', 'data.user_email':req.user.email, 'data.week_key':weekKey });
    const completedDaily  = dailyProgress?.data?.completed  || [];
    const completedWeekly = weeklyProgress?.data?.completed || [];
    res.json(MISSIONS_DEF.map(m => ({
      ...m,
      completed: m.type==='daily' ? completedDaily.includes(m.id) : completedWeekly.includes(m.id),
      progress: 0
    })));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

router.post('/missions/complete', requireAuth, async (req, res) => {
  try {
    const { missionId } = req.body;
    const mission = MISSIONS_DEF.find(m => m.id === missionId);
    if (!mission) return res.status(404).json({ error:'Mission not found' });

    const todayKey = getISTDayKey();
    const weekKey  = getISTWeekKey();
    const isDaily  = mission.type === 'daily';
    const queryKey = isDaily ? { 'data.day_key': todayKey } : { 'data.week_key': weekKey };
    const saveKey  = isDaily ? { day_key: todayKey } : { week_key: weekKey };

    let progress = await E().findOne({ type:'MissionProgress', 'data.user_email':req.user.email, ...queryKey });
    if (!progress) {
      progress = new (E())({ type:'MissionProgress', data:{ user_email:req.user.email, ...saveKey, completed:[] } });
    }
    if (progress.data.completed?.includes(missionId)) return res.status(400).json({ error:'Already completed' });
    if (!progress.data.completed) progress.data.completed = [];
    progress.data.completed.push(missionId);
    progress.markModified('data');
    await progress.save();

    const xpResult = await grantXP(req.user.email, mission.xp, `mission_${missionId}`);
    res.json({ success:true, xp:mission.xp, leveledUp:xpResult?.leveledUp, newLevel:xpResult?.level, rankedUp:xpResult?.rankedUp, newRank:xpResult?.rank });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// STORE — Badges & Profile items bought with COINS (profit!)
// ══════════════════════════════════════════════════════════════
const STORE_ITEMS = [
  // ── BADGES ────────────────────────────────────────────────
  { id:'badge_fire_legend', name:'Fire Legend',   category:'badge',  price:499, rarity:'legendary', emoji:'🔥', colors:['#ff4500','#ff6b35'], desc:'Blazing legend badge — rarest of all', glow:'rgba(255,69,0,0.8)' },
  { id:'badge_diamond',     name:'Diamond Elite', category:'badge',  price:299, rarity:'legendary', emoji:'💎', colors:['#00e5ff','#7c3aed'], desc:'Ultra-rare diamond tier badge', glow:'rgba(0,229,255,0.7)' },
  { id:'badge_crown_king',  name:'King of FAM',   category:'badge',  price:399, rarity:'legendary', emoji:'👑', colors:['#ffd700','#ff8c00'], desc:'The ultimate FAM royalty badge', glow:'rgba(255,215,0,0.8)' },
  { id:'badge_ace',         name:'Ace Player',    category:'badge',  price:149, rarity:'epic',      emoji:'🎯', colors:['#7c3aed','#ec4899'], desc:'Proven Ace-tier competitor', glow:'rgba(124,58,237,0.6)' },
  { id:'badge_phantom',     name:'Phantom',       category:'badge',  price:199, rarity:'epic',      emoji:'👻', colors:['#6366f1','#8b5cf6'], desc:'Ghost-like presence on the battlefield', glow:'rgba(99,102,241,0.6)' },
  { id:'badge_veteran',     name:'Veteran',       category:'badge',  price:79,  rarity:'rare',      emoji:'⚔️', colors:['#06b6d4','#3b82f6'], desc:'Battle-hardened veteran badge', glow:'rgba(6,182,212,0.5)' },
  { id:'badge_sniper',      name:'Sniper Elite',  category:'badge',  price:99,  rarity:'rare',      emoji:'🎯', colors:['#10b981','#06b6d4'], desc:'Precision marksman badge', glow:'rgba(16,185,129,0.5)' },
  { id:'badge_rookie',      name:'Rising Star',   category:'badge',  price:49,  rarity:'common',    emoji:'⭐', colors:['#64748b','#94a3b8'], desc:'Every legend started somewhere', glow:'rgba(100,116,139,0.4)' },
  // ── PROFILE FRAMES ────────────────────────────────────────
  { id:'frame_fire',        name:'Fire Frame',    category:'frame',  price:299, rarity:'legendary', emoji:'🔥', colors:['#ff4500','#ff8c00'], desc:'Animated fire border around your avatar', glow:'rgba(255,69,0,0.7)' },
  { id:'frame_electric',    name:'Electric',      category:'frame',  price:199, rarity:'epic',      emoji:'⚡', colors:['#facc15','#f97316'], desc:'Crackling electric frame effect', glow:'rgba(250,204,21,0.6)' },
  { id:'frame_galaxy',      name:'Galaxy',        category:'frame',  price:249, rarity:'epic',      emoji:'🌌', colors:['#7c3aed','#06b6d4'], desc:'Cosmic galaxy animated frame', glow:'rgba(124,58,237,0.6)' },
  { id:'frame_cyber',       name:'Cyber Neon',    category:'frame',  price:149, rarity:'rare',      emoji:'🔷', colors:['#06b6d4','#3b82f6'], desc:'Neon cyber grid frame', glow:'rgba(6,182,212,0.5)' },
  // ── TITLES ─────────────────────────────────────────────────
  { id:'title_destroyer',   name:'Destroyer',     category:'title',  price:199, rarity:'epic',      emoji:'💥', colors:['#ef4444','#f97316'], desc:'Show enemies who the destroyer is', glow:'rgba(239,68,68,0.6)' },
  { id:'title_godlike',     name:'Godlike',        category:'title', price:499, rarity:'legendary', emoji:'⚡', colors:['#ffd700','#ff8c00'], desc:'Reserved for truly elite players', glow:'rgba(255,215,0,0.8)' },
  { id:'title_ninja',       name:'Shadow Ninja',  category:'title',  price:149, rarity:'rare',      emoji:'🥷', colors:['#6366f1','#818cf8'], desc:'Silent and deadly — the ninja title', glow:'rgba(99,102,241,0.5)' },
  { id:'title_champion',    name:'Champion',      category:'title',  price:99,  rarity:'rare',      emoji:'🏆', colors:['#06b6d4','#0284c7'], desc:'Tournament champion title', glow:'rgba(6,182,212,0.5)' },
  // ── CHAT EFFECTS ──────────────────────────────────────────
  { id:'chat_fire',         name:'Fire Chat',     category:'effect', price:99,  rarity:'rare',      emoji:'🔥', colors:['#ff4500','#ff8c00'], desc:'Your chat messages show with fire effect', glow:'rgba(255,69,0,0.5)' },
  { id:'chat_rainbow',      name:'Rainbow Text',  category:'effect', price:79,  rarity:'rare',      emoji:'🌈', colors:['#ec4899','#8b5cf6'], desc:'Rainbow gradient text in chats', glow:'rgba(236,72,153,0.5)' },
];

router.get('/store/items', requireAuth, async (req, res) => {
  try {
    const owned = await E().find({ type:'StoreItem', 'data.user_email':req.user.email });
    const ownedIds = owned.map(o => o.data.item_id);
    const wallet = await E().findOne({ type:'Wallet', 'data.user_email':req.user.email });
    res.json({ items:STORE_ITEMS.map(i => ({ ...i, owned:ownedIds.includes(i.id) })), balance:wallet?.data?.balance||0 });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

router.post('/store/purchase', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error:'Item not found' });
    const already = await E().findOne({ type:'StoreItem', 'data.user_email':req.user.email, 'data.item_id':itemId });
    if (already) return res.status(400).json({ error:'Already owned!' });
    const wallet = await E().findOne({ type:'Wallet', 'data.user_email':req.user.email });
    if (!wallet || (wallet.data.balance||0) < item.price) return res.status(400).json({ error:`Need ${item.price-(wallet?.data?.balance||0)} more coins` });
    wallet.data.balance -= item.price;
    wallet.data.total_spent = (wallet.data.total_spent||0) + item.price;
    await wallet.save();
    await new (E())({ type:'StoreItem', data:{ user_email:req.user.email, item_id:itemId, item_name:item.name, category:item.category, purchased_at:new Date().toISOString() } }).save();
    await new (E())({ type:'Transaction', data:{ user_email:req.user.email, amount:-item.price, type:'store_purchase', status:'completed', description:`Bought: ${item.name}`, timestamp:new Date().toISOString() } }).save();
    // Grant XP for buying from store
    await grantXP(req.user.email, 50, `store_purchase_${itemId}`);
    await new (E())({ type:'Notification', data:{ user_email:req.user.email, title:`🎉 ${item.name} Unlocked!`, message:`${item.desc} — equipped to your profile!`, type:'system', created_date:new Date().toISOString() } }).save();
    res.json({ success:true, balance:wallet.data.balance });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// SEASON PASS — Purchased with coins (PROFIT item)
// Pricing: Free tier (XP grind), Premium 199 coins = ₹199
// ══════════════════════════════════════════════════════════════
const SEASON_PASS_PRICE = 199; // coins (= ₹199 — pure profit after server costs)
const SEASON_REWARDS = {
  free: [
    { level:1,  xp:0,   type:'xp_reward',   amount:50,   icon:'⭐', label:'+50 XP Bonus' },
    { level:2,  xp:0,   type:'xp_reward',   amount:75,   icon:'⭐', label:'+75 XP Bonus' },
    { level:3,  xp:0,   type:'badge',       badge:'badge_rookie',  icon:'🏅', label:'Rising Star Badge' },
    { level:4,  xp:0,   type:'xp_reward',   amount:100,  icon:'💫', label:'+100 XP Bonus' },
    { level:5,  xp:0,   type:'xp_reward',   amount:150,  icon:'💫', label:'+150 XP Bonus' },
    { level:6,  xp:0,   type:'badge',       badge:'badge_veteran', icon:'⚔️', label:'Veteran Badge' },
    { level:7,  xp:0,   type:'xp_reward',   amount:200,  icon:'🔥', label:'+200 XP Bonus' },
    { level:8,  xp:0,   type:'xp_reward',   amount:250,  icon:'🔥', label:'+250 XP Bonus' },
    { level:9,  xp:0,   type:'title',       title_id:'title_champion', icon:'🏆', label:'Champion Title' },
    { level:10, xp:0,   type:'xp_reward',   amount:500,  icon:'👑', label:'+500 XP Mega Bonus' },
  ],
  premium: [
    { level:1,  type:'badge',    badge:'badge_sniper',     icon:'🎯', label:'Sniper Elite Badge' },
    { level:2,  type:'frame',    item_id:'frame_cyber',    icon:'🔷', label:'Cyber Neon Frame' },
    { level:3,  type:'xp_bonus', multiplier:2,             icon:'⚡', label:'2x XP Boost (7 days)' },
    { level:4,  type:'badge',    badge:'badge_phantom',    icon:'👻', label:'Phantom Badge' },
    { level:5,  type:'effect',   item_id:'chat_fire',      icon:'🔥', label:'Fire Chat Effect' },
    { level:6,  type:'frame',    item_id:'frame_electric', icon:'⚡', label:'Electric Frame' },
    { level:7,  type:'badge',    badge:'badge_ace',        icon:'🎯', label:'Ace Player Badge' },
    { level:8,  type:'title',    title_id:'title_ninja',   icon:'🥷', label:'Shadow Ninja Title' },
    { level:9,  type:'frame',    item_id:'frame_galaxy',   icon:'🌌', label:'Galaxy Frame' },
    { level:10, type:'badge',    badge:'badge_fire_legend',icon:'🔥', label:'FIRE LEGEND Badge 👑' },
  ]
};

router.get('/season-pass/status', requireAuth, async (req, res) => {
  try {
    let pass = await E().findOne({ type:'SeasonPass', 'data.user_email':req.user.email });
    const wallet = await E().findOne({ type:'Wallet', 'data.user_email':req.user.email });
    const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });

    // XP from profile determines season level (separate from profile level)
    const totalXP = prof?.data?.xp || 0;
    // Season level: every 500 XP = 1 season level (max 10)
    const seasonLevel = Math.min(10, Math.floor(totalXP / 500) + 1);

    if (!pass) {
      pass = new (E())({ type:'SeasonPass', data:{ user_email:req.user.email, premium:false, claimed_free:[], claimed_premium:[] } });
      await pass.save();
    }

    res.json({
      ...pass.data, id:pass._id,
      seasonLevel, totalXP,
      nextLevelXP: seasonLevel < 10 ? seasonLevel * 500 : null,
      passPrice: SEASON_PASS_PRICE,
      balance: wallet?.data?.balance || 0,
      rewards: SEASON_REWARDS
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

router.post('/season-pass/buy', requireAuth, async (req, res) => {
  try {
    const wallet = await E().findOne({ type:'Wallet', 'data.user_email':req.user.email });
    if (!wallet || (wallet.data.balance||0) < SEASON_PASS_PRICE) {
      return res.status(400).json({ error:`Need ${SEASON_PASS_PRICE} coins to buy Season Pass. Deposit coins first.` });
    }
    const pass = await E().findOne({ type:'SeasonPass', 'data.user_email':req.user.email });
    if (pass?.data?.premium) return res.status(400).json({ error:'Already have Premium Season Pass!' });

    wallet.data.balance -= SEASON_PASS_PRICE;
    await wallet.save();
    if (pass) { pass.data.premium = true; pass.data.purchased_at = new Date().toISOString(); await pass.save(); }
    else { await new (E())({ type:'SeasonPass', data:{ user_email:req.user.email, premium:true, purchased_at:new Date().toISOString(), claimed_free:[], claimed_premium:[] } }).save(); }

    await new (E())({ type:'Transaction', data:{ user_email:req.user.email, amount:-SEASON_PASS_PRICE, type:'season_pass', status:'completed', description:'Premium Season Pass purchased', timestamp:new Date().toISOString() } }).save();
    await new (E())({ type:'Notification', data:{ user_email:req.user.email, title:'🏅 Premium Season Pass Activated!', message:`Unlock exclusive badges, frames & titles as you level up this season!`, type:'system', created_date:new Date().toISOString() } }).save();

    res.json({ success:true, balance:wallet.data.balance });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

router.post('/season-pass/claim', requireAuth, async (req, res) => {
  try {
    const { level, track } = req.body;
    const pass = await E().findOne({ type:'SeasonPass', 'data.user_email':req.user.email });
    if (!pass) return res.status(404).json({ error:'No season pass' });
    if (track === 'premium' && !pass.data.premium) return res.status(400).json({ error:'Premium pass required' });
    const claimedKey = `${level}_${track}`;
    const claimedArr = track === 'free' ? pass.data.claimed_free : pass.data.claimed_premium;
    if (claimedArr?.includes(claimedKey)) return res.status(400).json({ error:'Already claimed' });

    // Check season level
    const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });
    const totalXP = prof?.data?.xp || 0;
    const seasonLevel = Math.min(10, Math.floor(totalXP / 500) + 1);
    if (seasonLevel < level) return res.status(400).json({ error:`Reach Season Level ${level} first (need ${level*500} XP)` });

    const reward = SEASON_REWARDS[track]?.find(r => r.level === level);
    if (!reward) return res.status(404).json({ error:'Reward not found' });

    // Grant reward
    let granted = null;
    if (reward.type === 'xp_reward') {
      await grantXP(req.user.email, reward.amount, `season_${track}_lv${level}`);
      granted = { type:'xp', amount:reward.amount };
    } else if (reward.type === 'badge' || reward.type === 'frame' || reward.type === 'effect' || reward.type === 'title') {
      const itemId = reward.badge || reward.item_id || reward.title_id;
      const already = await E().findOne({ type:'StoreItem', 'data.user_email':req.user.email, 'data.item_id':itemId });
      if (!already) {
        await new (E())({ type:'StoreItem', data:{ user_email:req.user.email, item_id:itemId, item_name:reward.label, category:reward.type, purchased_at:new Date().toISOString(), source:'season_pass' } }).save();
      }
      granted = { type:reward.type, item:itemId, label:reward.label };
    } else if (reward.type === 'xp_bonus') {
      const until = new Date(Date.now() + 7*86400000).toISOString();
      if (prof) { prof.data.xp_boost_until = until; prof.data.xp_boost = reward.multiplier; prof.markModified('data'); await prof.save(); }
      granted = { type:'xp_boost', until, multiplier:reward.multiplier };
    }

    if (!pass.data.claimed_free) pass.data.claimed_free = [];
    if (!pass.data.claimed_premium) pass.data.claimed_premium = [];
    if (track === 'free') pass.data.claimed_free.push(claimedKey);
    else pass.data.claimed_premium.push(claimedKey);
    await pass.save();

    res.json({ success:true, granted, reward });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// XP PROFILE — get level/XP info
// ══════════════════════════════════════════════════════════════
router.get('/profile/xp', requireAuth, async (req, res) => {
  try {
    const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });
    const badges = await E().find({ type:'UserBadge', 'data.user_email':req.user.email });
    const storeItems = await E().find({ type:'StoreItem', 'data.user_email':req.user.email });
    const xp = prof?.data?.xp || 0;
    const level = prof?.data?.level || 1;
    const nextLevelXP = Math.pow(level, 2) * 50;
    const prevLevelXP = Math.pow(level-1, 2) * 50;
    res.json({
      xp, level,
      nextLevelXP, prevLevelXP,
      progressPct: nextLevelXP > prevLevelXP ? Math.min(100,((xp-prevLevelXP)/(nextLevelXP-prevLevelXP))*100) : 100,
      xpToNext: Math.max(0, nextLevelXP - xp),
      badges: badges.map(b => b.data),
      equippedItems: storeItems.map(i => i.data),
      xpBoost: prof?.data?.xp_boost || 1,
      xpBoostUntil: prof?.data?.xp_boost_until || null,
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// REFERRAL
// ══════════════════════════════════════════════════════════════
router.get('/referral/stats', requireAuth, async (req, res) => {
  try {
    const prof = await E().findOne({ type:'UserProfile', 'data.user_email':req.user.email });
    const refCode = prof?.data?.referral_code || '';
    const referred = await E().find({ type:'UserProfile', 'data.referred_by':refCode });
    res.json({ referral_code:refCode, total_referred:referred.length, earnings: prof?.data?.referral_earnings || 0, pending:referred.filter(r=>!r.data.referral_reward_claimed).length, completed:referred.filter(r=>r.data.referral_reward_claimed).length });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// GET /features/referral/history — referred users list with bonus status
router.get('/referral/history', requireAuth, async (req, res) => {
  try {
    const prof = await E().findOne({ type: 'UserProfile', 'data.user_email': req.user.email });
    const refCode = prof?.data?.referral_code || '';
    if (!refCode) return res.json([]);
    const referred = await E().find({ type: 'UserProfile', 'data.referred_by': refCode });
    const history = referred.map(r => ({
      username: r.data.username || 'Player',
      user_email: r.data.user_email,
      joined_date: r.data.created_date || r.createdAt,
      reward_claimed: r.data.referral_reward_claimed || false,
      status: r.data.referral_reward_claimed ? 'completed' : 'pending',
    }));
    res.json(history);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /features/referral/leaderboard — top 20 referrers
router.get('/referral/leaderboard', async (req, res) => {
  try {
    const profiles = await E().find({ type: 'UserProfile', 'data.total_referred': { $gt: 0 } }).sort({ 'data.total_referred': -1 }).limit(20);
    const leaderboard = profiles.map((p, i) => ({
      rank: i + 1,
      username: p.data.username || 'Player',
      total_referred: p.data.total_referred || 0,
      referral_earnings: p.data.referral_earnings || 0,
    }));
    res.json(leaderboard);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// FLASH SALES
// ══════════════════════════════════════════════════════════════
router.get('/flash-sale', async (req, res) => {
  try {
    const sales = await E().find({ type:'FlashSale', 'data.active':true });
    const now = new Date();
    res.json(sales.filter(s=>new Date(s.data.ends_at)>now).map(s=>({...s.data, id:s._id})));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// GIFT COINS
// ══════════════════════════════════════════════════════════════
router.post('/gift/send', requireAuth, async (req, res) => {
  try {
    const { recipientEmail, amount, message } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ error:'Min gift is 10 coins' });
    if (recipientEmail === req.user.email) return res.status(400).json({ error:'Cannot gift yourself' });
    const senderWallet = await E().findOne({ type:'Wallet', 'data.user_email':req.user.email });
    if (!senderWallet || (senderWallet.data.balance||0) < amount) return res.status(400).json({ error:'Insufficient coins' });
    const recipientWallet = await E().findOne({ type:'Wallet', 'data.user_email':recipientEmail });
    if (!recipientWallet) return res.status(404).json({ error:'Recipient not found' });
    senderWallet.data.balance -= amount; await senderWallet.save();
    recipientWallet.data.balance += amount; await recipientWallet.save();
    const senderName = req.user.full_name || req.user.email.split('@')[0];
    await new (E())({ type:'CoinGift', data:{ sender_email:req.user.email, sender_name:senderName, recipient_email:recipientEmail, amount, message:message||'', sent_at:new Date().toISOString() } }).save();
    await new (E())({ type:'Notification', data:{ user_email:recipientEmail, title:`🎁 Gift from ${senderName}!`, message:`${senderName} gifted you ${amount} coins!${message?` "${message}"`:''}`, type:'system', created_date:new Date().toISOString() } }).save();
    res.json({ success:true, balance:senderWallet.data.balance });
  } catch(e) { res.status(500).json({ error:e.message }); }
});
router.get('/gift/history', requireAuth, async (req, res) => {
  try {
    const [sent, received] = await Promise.all([
      E().find({ type:'CoinGift', 'data.sender_email':req.user.email }).sort({createdAt:-1}).limit(20),
      E().find({ type:'CoinGift', 'data.recipient_email':req.user.email }).sort({createdAt:-1}).limit(20),
    ]);
    res.json({ sent:sent.map(s=>s.data), received:received.map(r=>r.data) });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ══════════════════════════════════════════════════════════════
// PREDICTIONS
// ══════════════════════════════════════════════════════════════
router.get('/predictions', requireAuth, async (req, res) => {
  try {
    const preds = await E().find({ type:'Prediction', 'data.status':'open' }).sort({createdAt:-1}).limit(10);
    const myBets = await E().find({ type:'PredictionBet', 'data.user_email':req.user.email });
    const betMap = {}; myBets.forEach(b=>{ betMap[b.data.prediction_id]=b.data; });
    res.json(preds.map(p=>({...p.data, id:p._id, myBet:betMap[p._id.toString()]||null})));
  } catch(e) { res.status(500).json({ error:e.message }); }
});
router.post('/predictions/bet', requireAuth, async (req, res) => {
  try {
    const { predictionId, choice, amount } = req.body;
    if (!amount || amount < 5) return res.status(400).json({ error:'Min bet is 5 coins' });
    const pred = await E().findById(predictionId);
    if (!pred || pred.data.status !== 'open') return res.status(400).json({ error:'Prediction not available' });
    const already = await E().findOne({ type:'PredictionBet', 'data.user_email':req.user.email, 'data.prediction_id':predictionId });
    if (already) return res.status(400).json({ error:'Already bet' });
    const wallet = await E().findOne({ type:'Wallet', 'data.user_email':req.user.email });
    if (!wallet || (wallet.data.balance||0) < amount) return res.status(400).json({ error:'Insufficient coins' });
    wallet.data.balance -= amount; await wallet.save();
    await new (E())({ type:'PredictionBet', data:{ user_email:req.user.email, prediction_id:predictionId, choice, amount, status:'pending', placed_at:new Date().toISOString() } }).save();
    res.json({ success:true, balance:wallet.data.balance });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

export default router;

// ── Rank thresholds info ──────────────────────────────────────
router.get('/rank-thresholds', requireAuth, async (req, res) => {
  res.json({ thresholds: RANK_THRESHOLDS });
});
