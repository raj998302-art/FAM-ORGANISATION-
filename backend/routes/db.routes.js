import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// A generic "Entity" schema to hold untyped JSON data
const EntitySchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const EntityModel = mongoose.models.Entity || mongoose.model('Entity', EntitySchema);

const fixId = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject();
  return { id: obj._id.toString(), ...obj.data, createdAt: obj.createdAt, updatedAt: obj.updatedAt };
};

// Generic Create
router.post('/:entityName', requireAuth, async (req, res) => {
  try {
    const { entityName } = req.params;
    // Prevent role escalation in UserProfile or other sensitive entities
    if (entityName === 'User' && !req.user.roles.includes('owner') && !req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Unauthorized to create users directly' });
    }
    
    // Prevent non-admins from spoofing payment statuses or sensitive flags
    let safeData = { ...req.body };
    const isOwnerOrAdmin = req.user.roles.includes('owner') || req.user.roles.includes('admin');
    
    if (!isOwnerOrAdmin) {
       if (entityName === 'WithdrawalRequest' || entityName === 'Transaction') {
          safeData.status = 'pending';
       }
       // Secure fields in UserProfile
       if (entityName === 'UserProfile') {
          delete safeData.is_banned;
          delete safeData.ban_reason;
       }
    }

    const item = new EntityModel({
      type: entityName,
      data: safeData
    });
    await item.save();

    // Auto-notify all users when a Tournament, Event, or Announcement is created
    if (entityName === 'Tournament' || entityName === 'Event' || entityName === 'Announcement') {
      try {
        const { User } = await import('../models/user.model.js');
        const users = await User.find({}).select('email').lean();
        const isEvent = entityName === 'Event';
        const isAnnouncement = entityName === 'Announcement';
        let title, message, notifType;
        if (isAnnouncement) {
          title = safeData.title || 'New Announcement';
          message = safeData.content ? safeData.content.slice(0, 120) : 'New announcement from FAM admin!';
          notifType = 'broadcast';
        } else if (isEvent) {
          title = `New Event: ${safeData.title || 'New Event'}`;
          message = `A new event "${safeData.title}" has been added! Check it out now.`;
          notifType = 'event';
        } else {
          title = `New Tournament: ${safeData.title || 'New Tournament'}`;
          message = `New tournament "${safeData.title}" is open for registration! Entry fee: ₹${safeData.entry_fee || 0}. Join now!`;
          notifType = 'tournament';
        }
        const notifs = users.map(u => ({
          type: 'Notification',
          data: {
            user_email: u.email,
            title,
            message,
            type: notifType,
            ref_id: item._id.toString(),
            is_read: false,
            created_date: new Date().toISOString()
          }
        }));
        if (notifs.length > 0) await EntityModel.insertMany(notifs);
      } catch (notifErr) {
        console.error('Auto-notification error:', notifErr.message);
      }
    }

    res.json(fixId(item));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic List
router.get('/:entityName', requireAuth, async (req, res) => {
  try {
    const { entityName } = req.params;
    const items = await EntityModel.find({ type: entityName });
    res.json(items.map(fixId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Filter (where criteria are sent in `{queries: {...}, sort: 'field', limit: N}`)
router.post('/:entityName/filter', requireAuth, async (req, res) => {
  try {
    const { entityName } = req.params;
    let { queries, sort, limit } = req.body;
    
    let dbQuery = { type: entityName };
    if (queries) {
      for (const [key, value] of Object.entries(queries)) {
        dbQuery[`data.${key}`] = value;
      }
    }

    // Build the mongoose query with optional sort and limit
    let mongoQuery = EntityModel.find(dbQuery);

    if (sort) {
      // Support '-field' for descending, 'field' for ascending
      // Map data fields → data.field, but createdAt/updatedAt are top-level
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortDir = sort.startsWith('-') ? -1 : 1;
      const isTopLevel = ['createdAt', 'updatedAt', 'created_date', '_id'].includes(sortField);
      const resolvedField = isTopLevel ? sortField.replace('created_date', 'createdAt') : `data.${sortField}`;
      mongoQuery = mongoQuery.sort({ [resolvedField]: sortDir });
    } else {
      // Default: newest first
      mongoQuery = mongoQuery.sort({ createdAt: -1 });
    }

    if (limit && !isNaN(parseInt(limit))) {
      mongoQuery = mongoQuery.limit(parseInt(limit));
    }

    const items = await mongoQuery.exec();
    res.json(items.map(fixId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Generic Get by ID
router.get('/:entityName/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(404).json({ error: 'Invalid ID' });
    }
    const item = await EntityModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(fixId(item));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Update
router.put('/:entityName/:id', requireAuth, async (req, res) => {
  try {
    const { entityName } = req.params;
    const existing = await EntityModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    // Security check: Prevent updating sensitive data like wallet balances unless staff
    const isOwnerOrAdmin = req.user.roles.includes('owner') || req.user.roles.includes('admin') || req.user.roles.includes('co_owner') || req.user.roles.includes('fam_manager');
    const isPaymentStaff = req.user.roles.some(r => ['head_payment_manager','senior_payment_manager','payment_manager'].includes(r));
    const isModerationStaff = req.user.roles.some(r => ['head_admin','chief_admin','head_moderator','senior_moderator','moderator'].includes(r));
    
    if (entityName === 'Wallet' && !isOwnerOrAdmin && !isPaymentStaff) {
      const dbWallet = fixId(existing);
      if (req.body.balance !== undefined && req.body.balance !== dbWallet.balance) {
         return res.status(403).json({ error: 'Role escalation prevented: cannot manually change balances' });
      }
    }
    
    let safeData = { ...req.body };
    if (!isOwnerOrAdmin && !isModerationStaff) {
       if (entityName === 'WithdrawalRequest') {
          delete safeData.status; // Only staff can update withdrawal status
       }
       if (entityName === 'UserProfile') {
          // Block sensitive security fields — allow profile customization
          delete safeData.is_banned;
          delete safeData.ban_reason;
          delete safeData.banned_at;
          delete safeData.roles;
          delete safeData.user_id;
          delete safeData.user_email;
          // Allow: username, avatar_url, ign, ff_uid, ff_uid_set_date, etc.
       }
    }
    
    existing.data = { ...existing.data, ...safeData };
    existing.markModified('data'); // CRITICAL FIX: ensures Mongoose detects nested changes
    await existing.save();

    // Real-time: broadcast settings update to all connected clients
    if (entityName === 'AppSettings') {
      try {
        const { emitSettingsUpdated } = await import('../config/socket.js');
        emitSettingsUpdated(fixId(existing));
      } catch (socketErr) {
        // Non-fatal — socket may not be initialized in all environments
        console.warn('[SOCKET] Could not emit settingsUpdated:', socketErr.message);
      }
    }

    res.json(fixId(existing));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Delete
router.delete('/:entityName/:id', requireAuth, async (req, res) => {
  try {
    const staffRoles = ['owner','co_owner','fam_manager','head_admin','senior_chief_admin','chief_admin','senior_admin','admin',
      'head_payment_manager','senior_payment_manager','payment_manager',
      'head_community_manager','senior_community_manager','community_manager',
      'head_tournament_manager','senior_tournament_manager','tournament_manager',
      'head_vip_tournament_manager','senior_vip_tournament_manager','vip_tournament_manager',
      'head_moderator','senior_moderator','moderator'];
    const hasStaffRole = req.user.roles.some(r => staffRoles.includes(r));
    if (!hasStaffRole) {
      return res.status(403).json({ error: 'Staff access required to delete records' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Invalid ID' });
    await EntityModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
