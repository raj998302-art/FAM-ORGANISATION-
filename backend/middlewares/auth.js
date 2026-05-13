import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    req.user = user;

    // Maintenance logic globally
    const mongoose = (await import('mongoose')).default;
    const EntityModel = mongoose.model('Entity');
    const settingsDoc = await EntityModel.findOne({ type: 'AppSettings' });
    if (settingsDoc && settingsDoc.data && settingsDoc.data.maintenance_mode) {
      const rolesData = await mongoose.model('Role').find({ name: { $in: user.roles || ['user'] } });
      let isStaff = false;
      rolesData.forEach(r => {
        if (r.panelAccess.length > 0) isStaff = true;
      });
      if (!isStaff) return res.status(503).json({ message: 'System under maintenance' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      
      const roles = await Role.find({ name: { $in: req.user.roles } });
      const allPermissions = new Set();
      roles.forEach(r => {
        r.permissions.forEach(p => allPermissions.add(p));
      });
      
      if (allPermissions.has('all') || allPermissions.has(permission)) {
        next();
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};
