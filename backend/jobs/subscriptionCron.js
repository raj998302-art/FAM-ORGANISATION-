/**
 * subscriptionCron.js — Runs every hour.
 * • Marks expired subscriptions → expired
 * • Removes VIP role from user in MongoDB
 * • Sends renewal reminders at 2d and 1d before expiry
 */
import mongoose from 'mongoose';

export function startSubscriptionCron() {
  console.log('[VIP Cron] Started');
  checkExpired();
  setInterval(checkExpired, 60 * 60 * 1000); // every hour
}

async function checkExpired() {
  try {
    const Entity = mongoose.model('Entity');
    const User   = mongoose.model('User');
    const now    = new Date();

    const activeSubs = await Entity.find({ type: 'Subscription', 'data.status': 'active' });
    for (const sub of activeSubs) {
      const end = new Date(sub.data.end_date);
      const ms  = end.getTime() - now.getTime();

      if (ms <= 0) {
        // ── EXPIRED ─────────────────────────────────────────────
        sub.data.status = 'expired';
        await sub.save();

        const dbUser = await User.findOne({ email: sub.data.user_email });
        if (dbUser?.roles?.includes(sub.data.role)) {
          dbUser.roles = dbUser.roles.filter(r => r !== sub.data.role);
          await dbUser.save();
          console.log(`[VIP Cron] Removed ${sub.data.role} from ${sub.data.user_email}`);
        }

        const already = await Entity.findOne({ type:'Notification', 'data.user_email':sub.data.user_email, 'data.notif_ref':`expired_${sub._id}` });
        if (!already) {
          await new Entity({ type:'Notification', data:{
            user_email: sub.data.user_email,
            title: `⛔ ${sub.data.role.replace('_',' ').toUpperCase()} Expired`,
            message: 'Your VIP subscription has expired. Renew now to restore exclusive benefits!',
            type:'system', notif_ref:`expired_${sub._id}`, action_url:'/vip-plans',
            created_date: now.toISOString()
          }}).save();
        }
      } else {
        // ── REMINDER ─────────────────────────────────────────────
        const days = ms / 86400000;
        for (const d of [2, 1]) {
          if (days <= d && days > d - 0.05) {
            const key = `remind_${d}d_${sub._id}`;
            const already = await Entity.findOne({ type:'Notification', 'data.notif_ref': key });
            if (!already) {
              const hrs = Math.round(ms / 3600000);
              await new Entity({ type:'Notification', data:{
                user_email: sub.data.user_email,
                title: `⚠️ VIP Expires in ${hrs}h!`,
                message: `Your ${sub.data.role.replace('_',' ').toUpperCase()} expires in ${hrs} hours. Renew now to keep your perks!`,
                type:'system', notif_ref: key, action_url:'/vip-panel',
                created_date: now.toISOString()
              }}).save();
              console.log(`[VIP Cron] ${d}d reminder → ${sub.data.user_email}`);
            }
          }
        }
      }
    }
  } catch(e) { console.error('[VIP Cron]', e.message); }
}
