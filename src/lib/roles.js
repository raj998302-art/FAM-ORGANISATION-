import { PERMISSIONS, getUserRoles, getUserPermissions, getUserPanelAccess } from './permissions';

export const ALL_ROLES = [
  { value: 'owner', label: 'Owner', group: 'Leadership' },
  { value: 'co_owner', label: 'Co-Owner', group: 'Leadership' },
  { value: 'fam_manager', label: 'FAM Manager', group: 'Leadership' },
  { value: 'head_payment_manager', label: 'Head Payment Manager', group: 'Payment' },
  { value: 'senior_payment_manager', label: 'Senior Payment Manager', group: 'Payment' },
  { value: 'payment_manager', label: 'Payment Manager', group: 'Payment' },
  { value: 'head_technical_manager', label: 'Head Technical Manager', group: 'Technical' },
  { value: 'senior_technical_manager', label: 'Senior Technical Manager', group: 'Technical' },
  { value: 'technical_manager', label: 'Technical Manager', group: 'Technical' },
  { value: 'head_tournament_manager', label: 'Head Tournament Manager', group: 'Tournament' },
  { value: 'senior_tournament_manager', label: 'Senior Tournament Manager', group: 'Tournament' },
  { value: 'tournament_manager', label: 'Tournament Manager', group: 'Tournament' },
  { value: 'head_vip_tournament_manager', label: 'Head VIP Tournament Manager', group: 'VIP Tournament' },
  { value: 'senior_vip_tournament_manager', label: 'Senior VIP Tournament Manager', group: 'VIP Tournament' },
  { value: 'vip_tournament_manager', label: 'VIP Tournament Manager', group: 'VIP Tournament' },
  { value: 'head_forms_manager', label: 'Head Forms Manager', group: 'Forms' },
  { value: 'senior_forms_manager', label: 'Senior Forms Manager', group: 'Forms' },
  { value: 'forms_manager', label: 'Forms Manager', group: 'Forms' },
  { value: 'head_admin', label: 'Head Admin', group: 'Admin' },
  { value: 'senior_chief_admin', label: 'Senior Chief Admin', group: 'Admin' },
  { value: 'chief_admin', label: 'Chief Admin', group: 'Admin' },
  { value: 'senior_admin', label: 'Senior Admin', group: 'Admin' },
  { value: 'admin', label: 'Admin', group: 'Admin' },
  { value: 'head_team_system_manager', label: 'Head Team System Manager', group: 'Team' },
  { value: 'senior_team_system_manager', label: 'Senior Team System Manager', group: 'Team' },
  { value: 'team_system_manager', label: 'Team System Manager', group: 'Team' },
  { value: 'head_achievements_manager', label: 'Head Achievements Manager', group: 'Achievements' },
  { value: 'senior_achievements_manager', label: 'Senior Achievements Manager', group: 'Achievements' },
  { value: 'achievements_manager', label: 'Achievements Manager', group: 'Achievements' },
  { value: 'head_vip_zone_manager', label: 'Head VIP Zone Manager', group: 'VIP Zone' },
  { value: 'senior_vip_zone_manager', label: 'Senior VIP Zone Manager', group: 'VIP Zone' },
  { value: 'vip_zone_manager', label: 'VIP Zone Manager', group: 'VIP Zone' },
  { value: 'head_community_manager', label: 'Head Community Manager', group: 'Community' },
  { value: 'senior_community_manager', label: 'Senior Community Manager', group: 'Community' },
  { value: 'community_manager', label: 'Community Manager', group: 'Community' },
  { value: 'head_moderator', label: 'Head Moderator', group: 'Moderation' },
  { value: 'senior_moderator', label: 'Senior Moderator', group: 'Moderation' },
  { value: 'moderator', label: 'Moderator', group: 'Moderation' },
  { value: 'vip_elite', label: 'VIP Elite', group: 'VIP' },
  { value: 'vip_plus', label: 'VIP+', group: 'VIP' },
  { value: 'vip', label: 'VIP', group: 'VIP' },
  { value: 'player', label: 'Player', group: 'Player' }
];

export const ALL_STAFF_ROLES = ALL_ROLES.filter(r => r.value !== 'player').map(r => r.value);

export const hasAdminAccess = (user) => {
  const perms = getUserPermissions(user);
  return perms.includes(PERMISSIONS.MANAGE_USERS) || perms.includes(PERMISSIONS.MANAGE_SYSTEM) || perms.includes(PERMISSIONS.BAN_USERS) || perms.includes(PERMISSIONS.MANAGE_SETTINGS) || perms.includes('all');
};

export const hasPaymentAccess = (user) => {
  const perms = getUserPermissions(user);
  return perms.includes(PERMISSIONS.MANAGE_PAYMENTS) || perms.includes(PERMISSIONS.APPROVE_DEPOSITS) || perms.includes(PERMISSIONS.PROCESS_WITHDRAWALS) || perms.includes('all');
};

export const hasTournamentAccess = (user) => {
  const perms = getUserPermissions(user);
  return perms.includes(PERMISSIONS.MANAGE_TOURNAMENTS) || perms.includes(PERMISSIONS.MANAGE_VIP_TOURNAMENTS) || perms.includes(PERMISSIONS.AWARD_CERTIFICATES) || perms.includes('all');
};

export const canAssignRoles = (user) => {
  const perms = getUserPermissions(user);
  const roles = getUserRoles(user);
  return perms.includes(PERMISSIONS.ASSIGN_ROLES) || perms.includes(PERMISSIONS.MANAGE_SYSTEM) || perms.includes('all') || roles.includes('owner') || roles.includes('co_owner') || roles.includes('fam_manager');
};

export const canBanUsers = (user) => {
  const perms = getUserPermissions(user);
  const roles = getUserRoles(user);
  return perms.includes(PERMISSIONS.BAN_USERS) || perms.includes(PERMISSIONS.MANAGE_SYSTEM) || perms.includes('all') || roles.includes('owner') || roles.includes('co_owner') || roles.includes('fam_manager');
};

export const isOwner = (user) => {
  const roles = getUserRoles(user);
  return roles.includes('owner');
};

export const getRoleLabel = (role) => {
  const found = ALL_ROLES.find(r => r.value === role);
  return found ? found.label : (role || 'Player');
};

export const ROLES_BY_GROUP = ALL_ROLES.reduce((acc, r) => {
  if (!acc[r.group]) acc[r.group] = [];
  acc[r.group].push(r);
  return acc;
}, {});