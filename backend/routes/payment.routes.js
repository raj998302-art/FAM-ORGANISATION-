import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const Entity = () => mongoose.model('Entity');

// ── Helper: credit wallet idempotently ───────────────────────────────────
async function creditWallet(userEmail, amount, paymentId, source = 'api') {
  const E = Entity();
  // Idempotency check
  const done = await E.findOne({ type:'Transaction', 'data.payment_id': paymentId });
  if (done) return { already: true };

  const wallet = await E.findOne({ type:'Wallet', 'data.user_email': userEmail });
  if (!wallet) return { error: 'Wallet not found' };

  // VIP bonus
  const user = await mongoose.model('User').findOne({ email: userEmail }).lean();
  const roles = user?.roles || [];
  const bonusPct = roles.includes('vip_elite') ? 15 : roles.includes('vip_plus') ? 10 : roles.includes('vip') ? 5 : 0;
  const bonus = bonusPct > 0 ? Math.floor(amount * bonusPct / 100) : 0;

  wallet.data.balance = (wallet.data.balance || 0) + amount + bonus;
  wallet.data.total_deposited = (wallet.data.total_deposited || 0) + amount;
  if (bonus > 0) wallet.data.bonus_balance = (wallet.data.bonus_balance || 0) + bonus;
  await wallet.save();

  // Transaction record
  await new E({ type:'Transaction', data:{
    user_email: userEmail, amount, type:'deposit', status:'success',
    payment_id: paymentId, source, timestamp: new Date().toISOString()
  }}).save();

  // Notifications
  const msgs = [`✅ ₹${amount} deposited successfully! +${amount}${bonus>0?` + ${bonus} VIP bonus`:''} coins added.`];
  if (bonus > 0) msgs.push(`🎁 VIP Bonus: +₹${bonus} coins (${bonusPct}% VIP bonus)`);
  for (const msg of msgs) {
    await new E({ type:'Notification', data:{
      user_email: userEmail, title: bonus > 0 ? `Deposit + VIP Bonus` : `Deposit Confirmed`,
      message: msg, type:'deposit', created_date: new Date().toISOString()
    }}).save();
  }

  // Referral bonus (first deposit ≥ ₹100)
  if (amount >= 100) {
    const prof = await E.findOne({ type:'UserProfile', 'data.user_email': userEmail });
    if (prof?.data?.referred_by && !prof.data.referral_reward_claimed) {
      const refProf = await E.findOne({ type:'UserProfile', 'data.referral_code': prof.data.referred_by });
      if (refProf && refProf.data.user_email !== userEmail) {
        const refWallet = await E.findOne({ type:'Wallet', 'data.user_email': refProf.data.user_email });
        if (refWallet) {
          refWallet.data.balance = (refWallet.data.balance || 0) + 10;
          refWallet.markModified('data');
          refWallet.data.total_earned = (refWallet.data.total_earned || 0) + 10;
          prof.data.referral_reward_claimed = true;
          // Update referrer earnings stats
          refProf.data.referral_earnings = (refProf.data.referral_earnings || 0) + 10;
          refProf.markModified('data');
          await Promise.all([refWallet.save(), prof.save(), refProf.save()]);
          await new E({ type:'Notification', data:{
            user_email: refProf.data.user_email,
            title: 'Referral Bonus!', message: 'You received ₹10 bonus — your referred player made their first deposit!',
            type:'system'
          }}).save();
        }
      }
    }
  }

  return { ok: true, bonus };
}

// ── POST /api/payments/orders ─────────────────────────────────────────────
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ error: 'Minimum deposit is ₹10' });

    if (!process.env.RAZORPAY_KEY_ID || process.env.NODE_ENV !== 'production') {
      const mockId = `mock_order_${Date.now()}`;
      await new (Entity())({ type:'PendingOrder', data:{ order_id:mockId, amount, user_email:req.user.email, status:'created' }}).save();
      return res.json({ id: mockId, amount: amount * 100, currency: 'INR', key_id: 'rzp_test_mock', is_mock: true });
    }

    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rzp.orders.create({ amount: amount * 100, currency: 'INR', receipt: `rcpt_${Date.now()}` });
    await new (Entity())({ type:'PendingOrder', data:{ order_id:order.id, amount, user_email:req.user.email, status:'created' }}).save();
    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/payments/verify ─────────────────────────────────────────────
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, user_email } = req.body;
    let ok = false;
    if (razorpay_order_id?.startsWith('mock_') && razorpay_signature === 'mock_signature') {
      ok = true;
    } else {
      const sig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      ok = sig === razorpay_signature;
    }
    if (!ok) return res.status(400).json({ message: 'Invalid payment signature' });
    const result = await creditWallet(user_email, Number(amount), razorpay_payment_id, 'frontend');
    if (result.error) return res.status(400).json({ message: result.error });
    res.json({ message: 'Coins credited', bonus: result.bonus || 0 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/payments/webhook ────────────────────────────────────────────
// Register in Razorpay Dashboard → Webhooks → payment.captured
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers['x-razorpay-signature'];
      const exp = crypto.createHmac('sha256', secret).update(req.rawBody || JSON.stringify(req.body)).digest('hex');
      if (sig !== exp) return res.status(400).json({ message: 'Bad signature' });
    }
    const { event, payload } = req.body;
    if (event === 'payment.captured') {
      const p = payload?.payment?.entity;
      const order = await (Entity()).findOne({ type:'PendingOrder', 'data.order_id': p?.order_id });
      if (order) {
        const r = await creditWallet(order.data.user_email, p.amount / 100, p.id, 'webhook');
        if (!r.already) { order.data.status = 'webhook_done'; await order.save(); }
      }
    }
    res.json({ status: 'ok' });
  } catch(e) { res.json({ status: 'ok', err: e.message }); }
});

// ── POST /api/payments/vip/subscribe ─────────────────────────────────────
router.post('/vip/subscribe', requireAuth, async (req, res) => {
  try {
    const { planId, role, price, days } = req.body;
    const E = Entity();
    const wallet = await E.findOne({ type:'Wallet', 'data.user_email': req.user.email });
    if (!wallet) return res.status(400).json({ error: 'Wallet not found' });
    if ((wallet.data.balance || 0) < price) return res.status(400).json({ error: `Insufficient balance. Need ${price} coins.` });

    wallet.data.balance -= price;
    wallet.data.total_spent = (wallet.data.total_spent || 0) + price;
    await wallet.save();

    // Add role
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user.roles.includes(role)) { user.roles.push(role); await user.save(); }

    const end = new Date(Date.now() + days * 86400000).toISOString();
    // Deactivate old subs for same role
    await E.updateMany({ type:'Subscription', 'data.user_email':req.user.email, 'data.role':role }, { $set:{ 'data.status':'superseded' }});

    await new E({ type:'Subscription', data:{
      user_email:req.user.email, plan_id:planId, role, amount:price,
      start_date: new Date().toISOString(), end_date: end, status:'active'
    }}).save();

    await new E({ type:'Transaction', data:{ user_email:req.user.email, amount:-price, type:'vip_subscription', status:'completed', timestamp:new Date().toISOString(), description:`${planId} subscription` }}).save();
    await new E({ type:'Notification', data:{ user_email:req.user.email, title:`${role.replace('_',' ').toUpperCase()} Activated!`, message:`Your VIP subscription is active until ${new Date(end).toLocaleDateString('en-IN')}.`, type:'system', created_date:new Date().toISOString() }}).save();

    res.json({ success:true, balance:wallet.data.balance });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/payments/withdraw ───────────────────────────────────────────
router.post('/withdraw', requireAuth, async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    if (!amount || amount < 50) return res.status(400).json({ error: 'Minimum withdrawal is ₹50' });
    const E = Entity();
    const wallet = await E.findOne({ type:'Wallet', 'data.user_email': req.user.email });
    if (!wallet || (wallet.data.balance || 0) < amount) return res.status(400).json({ error: 'Insufficient balance' });
    wallet.data.balance -= amount;
    await wallet.save();
    await new E({ type:'Transaction', data:{ user_email:req.user.email, amount:-amount, type:'withdrawal', status:'pending', timestamp:new Date().toISOString(), withdrawal_method:method, withdrawal_details:details }}).save();
    await new E({ type:'WithdrawalRequest', data:{ user_email:req.user.email, amount, payment_method:method, payment_details:details, status:'pending', created_date:new Date().toISOString(), username:req.user.full_name||req.user.email }}).save();
    await new E({ type:'Notification', data:{ user_email:req.user.email, title:'Withdrawal Submitted', message:`₹${amount} via ${method} is being processed.`, type:'system', created_date:new Date().toISOString() }}).save();
    res.json({ success:true, balance:wallet.data.balance });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
