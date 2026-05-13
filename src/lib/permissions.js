export const PERMISSIONS = {
  // Master
  MANAGE_SYSTEM: 'MANAGE_SYSTEM',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  
  // Users & Roles
  MANAGE_USERS: 'MANAGE_USERS',
  ASSIGN_ROLES: 'ASSIGN_ROLES',
  BAN_USERS: 'BAN_USERS',
  
  // Financial
  MANAGE_PAYMENTS: 'MANAGE_PAYMENTS',
  APPROVE_DEPOSITS: 'APPROVE_DEPOSITS',
  PROCESS_WITHDRAWALS: 'PROCESS_WITHDRAWALS',
  
  // Tournaments
  MANAGE_TOURNAMENTS: 'MANAGE_TOURNAMENTS',
  MANAGE_VIP_TOURNAMENTS: 'MANAGE_VIP_TOURNAMENTS',
  AWARD_CERTIFICATES: 'AWARD_CERTIFICATES',
  
  // Content & Support
  SEND_BROADCAST: 'SEND_BROADCAST',
  VIEW_SUPPORT_CHATS: 'VIEW_SUPPORT_CHATS',
  MANAGE_FORMS: 'MANAGE_FORMS',
  
  // Custom
  MANAGE_TEAMS: 'MANAGE_TEAMS',
  MANAGE_ACHIEVEMENTS: 'MANAGE_ACHIEVEMENTS',
  MANAGE_VIP_ZONE: 'MANAGE_VIP_ZONE',
  MODERATE_COMMUNITY: 'MODERATE_COMMUNITY'
};

export const getUserRoles = (user) => {
  if (!user) return [];
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
  if (user.role) return [user.role];
  return [];
};

export const getUserPermissions = (user) => {
  return user?.permissions || [];
};

export const getUserPanelAccess = (user) => {
  return user?.panels || [];
};

export const checkPermission = (user, permission) => {
  if (!user) return false;
  const perms = getUserPermissions(user);
  if (perms.includes('all')) return true;
  return perms.includes(permission);
};

// Hardcoded owner emails that ALWAYS bypass maintenance/bans
export const OWNER_EMAILS = [
  'raj998302@gmail.com',
];

export const isOwnerEmail = (user) => {
  if (!user) return false;
  return OWNER_EMAILS.includes((user.email || '').toLowerCase().trim());
};

export const hasAnyAdminPanelAccess = (user) => {
  if (!user) return false;
  // Owner email always bypasses — cannot be locked out
  if (isOwnerEmail(user)) return true;
  // Any panel access
  if (getUserPanelAccess(user).length > 0) return true;
  // Any staff/admin role
  const staffRoles = ['owner','co_owner','fam_manager','admin','moderator',
    'tournament_manager','senior_tournament_manager','head_tournament_manager',
    'payment_manager','vip_manager','community_manager','tech_support'];
  const userRoles = getUserRoles(user);
  return staffRoles.some(r => userRoles.includes(r));
};
