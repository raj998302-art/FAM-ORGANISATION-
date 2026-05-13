import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const EntityModel = mongoose.model('Entity');

router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { participant } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Invalid ID' });
    }

    const tournament = await EntityModel.findById(id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    
    // Check fee
    const fee = tournament.data.entry_fee || 0;
    
    const wallet = await EntityModel.findOne({ type: 'Wallet', 'data.user_email': req.user.email });
    if (!wallet) return res.status(400).json({ error: 'Wallet not found' });

    if (wallet.data.balance < fee) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct
    wallet.data.balance -= fee;
    wallet.data.total_spent = (wallet.data.total_spent || 0) + fee;
    await wallet.save();
    
    // Add participant
    if (!tournament.data.participants) tournament.data.participants = [];
    tournament.data.participants.push({
      ...participant,
      user_id: req.user._id,
      user_email: req.user.email,
      joined_at: new Date().toISOString()
    });
    tournament.data.filled_slots = (tournament.data.filled_slots || 0) + 1;
    await tournament.save();
    
    // Transaction
    await new EntityModel({
      type: 'Transaction',
      data: {
        user_email: req.user.email,
        type: 'entry_fee',
        amount: -fee,
        status: 'completed',
        description: `Entry fee for ${tournament.data.title}`,
        tournament_id: id,
        timestamp: new Date().toISOString()
      }
    }).save();

    // Auto-complete 'play1' daily mission when user joins a tournament
    try {
      const today = new Date().toDateString();
      let mProgress = await EntityModel.findOne({ type:'MissionProgress', 'data.user_email':req.user.email, 'data.date':today });
      if (!mProgress) { mProgress = new EntityModel({ type:'MissionProgress', data:{ user_email:req.user.email, date:today, completed:[] } }); }
      if (!mProgress.data.completed) mProgress.data.completed = [];
      if (!mProgress.data.completed.includes('play1')) {
        mProgress.data.completed.push('play1');
        mProgress.markModified('data');
        await mProgress.save();
        // Grant 50 XP for play1 mission
        const prof = await EntityModel.findOne({ type:'UserProfile', 'data.user_email':req.user.email });
        if (prof) {
          prof.data.xp = (prof.data.xp || 0) + 50;
          const newLevel = Math.max(1, Math.floor(Math.sqrt(prof.data.xp / 50)));
          prof.data.level = newLevel;
          const rankThresholds = [{rank:'bronze',minXP:0},{rank:'silver',minXP:500},{rank:'platinum',minXP:1500},{rank:'diamond',minXP:3000},{rank:'heroic',minXP:6000},{rank:'master',minXP:10000},{rank:'grandmaster',minXP:20000}];
          let newRank = 'bronze';
          for (const t of rankThresholds) { if (prof.data.xp >= t.minXP) newRank = t.rank; else break; }
          prof.data.rank = newRank;
          prof.markModified('data');
          await prof.save();
        }
      }
    } catch(mErr) { console.error('Mission auto-complete error:', mErr.message); }

    res.json({ success: true, balance: wallet.data.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Award prize to winner
router.post('/:id/award', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { winners } = req.body; // [{ user_email, amount, position }]

    if (!req.user.roles.includes('owner') && !req.user.roles.includes('co_owner') &&
        !req.user.roles.includes('fam_manager') && !req.user.roles.includes('head_tournament_manager') &&
        !req.user.roles.includes('senior_tournament_manager') && !req.user.roles.includes('tournament_manager') &&
        !req.user.roles.includes('head_vip_tournament_manager') && !req.user.roles.includes('vip_tournament_manager')) {
      return res.status(403).json({ error: 'Not authorized to award prizes' });
    }

    if (!Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ error: 'Winners list required' });
    }

    const tournament = await EntityModel.findById(id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    for (const winner of winners) {
      const { user_email, amount, position } = winner;
      if (!user_email || !amount) continue;

      const wallet = await EntityModel.findOne({ type: 'Wallet', 'data.user_email': user_email });
      if (wallet) {
        wallet.data.balance = (wallet.data.balance || 0) + Number(amount);
        wallet.data.winnings = (wallet.data.winnings || 0) + Number(amount);
        await wallet.save();
      }

      await new EntityModel({ type: 'Transaction', data: {
        user_email, amount: Number(amount), type: 'prize',
        status: 'completed',
        description: `Prize #${position} - ${tournament.data.title}`,
        tournament_id: id, timestamp: new Date().toISOString()
      }}).save();

      await new EntityModel({ type: 'Notification', data: {
        user_email,
        title: `You Won! ₹${amount}`,
        message: `Congratulations! You finished #${position} in "${tournament.data.title}" and won ₹${amount}!`,
        type: 'prize', created_date: new Date().toISOString()
      }}).save();

      // Update user profile win count
      const profile = await EntityModel.findOne({ type: 'UserProfile', 'data.user_email': user_email });
      if (profile && position === 1) {
        profile.data.tournaments_won = (profile.data.tournaments_won || 0) + 1;
        await profile.save();
      }
    }

    // Mark tournament as completed
    tournament.data.status = 'completed';
    tournament.data.winners = winners;
    tournament.data.completed_at = new Date().toISOString();
    await tournament.save();

    res.json({ success: true, awarded_count: winners.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
