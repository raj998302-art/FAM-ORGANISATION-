import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const EntityModel = mongoose.model('Entity');
const User = mongoose.model('User');
const Role = mongoose.model('Role');

// Middleware to check if user has admin access
const requireAdmin = async (req, res, next) => {
  if (!req.user || (!req.user.roles.includes('admin') && !req.user.roles.includes('owner') && !req.user.roles.includes('co_owner') && !req.user.roles.includes('fam_manager'))) {
     return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.post('/assign-role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, roles } = req.body;
    
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    
    // Check hierarchy
    const currentUserRoleDocs = await Role.find({ name: { $in: req.user.roles } });
    const targetUserRoleDocs = await Role.find({ name: { $in: targetUser.roles || ['user'] } });
    const newRolesDocs = await Role.find({ name: { $in: roles } });
    
    const currentMaxPriority = Math.max(...currentUserRoleDocs.map(r => r.priority), 0);
    const targetMaxPriority = targetUserRoleDocs.length > 0 ? Math.max(...targetUserRoleDocs.map(r => r.priority), 0) : 0;
    const newRolesMaxPriority = newRolesDocs.length > 0 ? Math.max(...newRolesDocs.map(r => r.priority), 0) : 0;
    
    // Only owner can assign owner
    if (roles.includes('owner') && !req.user.roles.includes('owner')) {
       return res.status(403).json({ error: 'Only owner can assign owner role' });
    }
    
    // Users can only assign roles priority < their own
    if (!req.user.roles.includes('owner')) {
       if (newRolesMaxPriority >= currentMaxPriority) {
          return res.status(403).json({ error: 'Cannot assign roles with equal or higher priority than your own' });
       }
       if (targetMaxPriority >= currentMaxPriority) {
          return res.status(403).json({ error: 'Cannot modify user who has equal or higher priority than you' });
       }
    }
    
    // Ensure 'owner' cannot be removed from owners by anyone else
    if (targetUser.roles?.includes('owner') && !roles.includes('owner') && !req.user.roles.includes('owner')) {
       return res.status(403).json({ error: 'Cannot demote an owner' });
    }

    targetUser.roles = roles;
    await targetUser.save();
    
    res.json({ success: true, message: 'Roles assigned successfully', roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
   try {
     const users = await User.find({}).select('-password');
     res.json(users);
   } catch (err) {
     res.status(500).json({ error: err.message });
   }
});

router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
     const totalUsers = await User.countDocuments();
     
     // Quick aggregations using Entity model
     const wallets = await EntityModel.find({ type: 'Wallet' });
     let totalBalance = 0;
     let totalWinnings = 0;
     wallets.forEach(w => {
       totalBalance += (w.data.balance || 0);
       totalWinnings += (w.data.winnings || 0);
     });

     const transactions = await EntityModel.find({ type: 'Transaction' });
     let totalDeposits = 0;
     let totalWithdrawals = 0;

     transactions.forEach(tx => {
        if (tx.data.type === 'deposit' && tx.data.status === 'completed') {
           totalDeposits += Math.abs(tx.data.amount);
        }
        if (tx.data.type === 'withdrawal' && tx.data.status === 'completed') {
           totalWithdrawals += Math.abs(tx.data.amount);
        }
     });

     const tournaments = await EntityModel.find({ type: 'Tournament' });
     const totalTournaments = tournaments.length;

     res.json({
        totalUsers,
        totalBalance,
        totalWinnings,
        totalDeposits,
        totalWithdrawals,
        totalTournaments
     });
  } catch (err) {
     res.status(500).json({ error: err.message });
  }
});

router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
  try {
      const logs = await EntityModel.find({ type: 'SystemLog' }).sort({ _id: -1 }).limit(100);
      res.json(logs);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Manual deposit — admin credits coins to a user's wallet
router.post('/manual-deposit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_email, amount, note } = req.body;
    if (!user_email || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid request' });

    const wallet = await EntityModel.findOne({ type: 'Wallet', 'data.user_email': user_email });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    wallet.data.balance = (wallet.data.balance || 0) + Number(amount);
    await wallet.save();

    await new EntityModel({ type: 'Transaction', data: {
      user_email, amount: Number(amount), type: 'manual_deposit',
      status: 'completed', description: note || `Manual deposit by admin ${req.user.email}`,
      payment_id: `manual_${Date.now()}`, timestamp: new Date().toISOString()
    }}).save();

    await new EntityModel({ type: 'Notification', data: {
      user_email, title: '💰 Coins Added!',
      message: `₹${amount} has been added to your wallet by admin.${note ? ` Note: ${note}` : ''}`,
      type: 'deposit', created_date: new Date().toISOString()
    }}).save();

    await new EntityModel({ type: 'SystemLog', data: {
      event: 'MANUAL_DEPOSIT', admin_email: req.user.email,
      user_email, amount, timestamp: new Date().toISOString()
    }}).save();

    res.json({ success: true, new_balance: wallet.data.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban user
router.post('/ban-user', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_email, reason } = req.body;
    const profile = await EntityModel.findOne({ type: 'UserProfile', 'data.user_email': user_email });
    if (!profile) return res.status(404).json({ error: 'User profile not found' });

    profile.data.is_banned = true;
    profile.data.ban_reason = reason || 'Violated terms of service';
    profile.data.banned_by = req.user.email;
    profile.data.ban_date = new Date().toISOString();
    await profile.save();

    await new EntityModel({ type: 'SystemLog', data: {
      event: 'USER_BANNED', admin_email: req.user.email,
      user_email, reason, timestamp: new Date().toISOString()
    }}).save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unban user
router.post('/unban-user', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_email } = req.body;
    const profile = await EntityModel.findOne({ type: 'UserProfile', 'data.user_email': user_email });
    if (!profile) return res.status(404).json({ error: 'User profile not found' });

    profile.data.is_banned = false;
    profile.data.ban_reason = '';
    profile.data.ban_date = null;
    await profile.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Broadcast notification to all users
router.post('/broadcast-notification', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const users = await User.find({}).select('email');

    const notifs = users.map(u => ({
      type: 'Notification',
      data: {
        user_email: u.email, title, message,
        type: type || 'broadcast', created_date: new Date().toISOString()
      }
    }));

    await EntityModel.insertMany(notifs);
    res.json({ success: true, sent_to: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/promote — promote a staff member to a new role
router.post('/users/promote', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'email and role required' });
    const PROTECTED = ['owner', 'co_owner', 'fam_manager'];
    if (PROTECTED.includes(role)) return res.status(403).json({ error: 'Cannot promote to this role via automation' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Add new role, keep existing
    if (!user.roles.includes(role)) user.roles.push(role);
    // Remove the role they were just promoted FROM if it's a TM role
    const TM_CHAIN = ['tournament_manager', 'senior_tournament_manager', 'head_tournament_manager'];
    const roleIdx = TM_CHAIN.indexOf(role);
    if (roleIdx > 0) {
      user.roles = user.roles.filter(r => r !== TM_CHAIN[roleIdx - 1]);
    }
    await user.save();
    // Update UserProfile
    const prof = await EntityModel.findOne({ type: 'UserProfile', 'data.user_email': email });
    if (prof) {
      prof.data.staff_role = role;
      prof.markModified('data');
      await prof.save();
    }
    res.json({ success: true, promoted_to: role, user_email: email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
