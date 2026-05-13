import { Role } from '../models/role.model.js';

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

export const seedRoles = async () => {
  await Role.deleteMany({});
  
  const allPermsExceptSystem = Object.values(PERMISSIONS).filter(p => !['MANAGE_SYSTEM'].includes(p));

  const seedData = [
    // ─── LEADERSHIP ──────────────────────────────────────────────────
    { name: 'owner',       priority: 100, permissions: ['all'], panelAccess: ALL_PANELS },
    { name: 'co_owner',    priority: 90,  permissions: allPermsExceptSystem, panelAccess: ALL_PANELS },
    { name: 'fam_manager', priority: 80,  permissions: allPermsExceptSystem, panelAccess: ALL_PANELS },

    // ─── PAYMENT DEPARTMENT ──────────────────────────────────────────
    { name: 'head_payment_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_PAYMENTS, PERMISSIONS.APPROVE_DEPOSITS, PERMISSIONS.PROCESS_WITHDRAWALS], panelAccess: ['payment_panel'] },
    { name: 'senior_payment_manager', priority: 66, permissions: [PERMISSIONS.APPROVE_DEPOSITS, PERMISSIONS.PROCESS_WITHDRAWALS], panelAccess: ['payment_panel'] },
    { name: 'payment_manager',        priority: 61, permissions: [PERMISSIONS.APPROVE_DEPOSITS, PERMISSIONS.PROCESS_WITHDRAWALS], panelAccess: ['payment_panel'] },

    // ─── TECHNICAL DEPARTMENT ────────────────────────────────────────
    { name: 'head_technical_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_SYSTEM], panelAccess: ['technical_panel'] },
    { name: 'senior_technical_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_SETTINGS], panelAccess: ['technical_panel'] },
    { name: 'technical_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_SETTINGS], panelAccess: ['technical_panel'] },

    // ─── TOURNAMENT DEPARTMENT ───────────────────────────────────────
    { name: 'head_tournament_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_TOURNAMENTS, PERMISSIONS.AWARD_CERTIFICATES], panelAccess: ['tournament_panel'] },
    { name: 'senior_tournament_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_TOURNAMENTS, PERMISSIONS.AWARD_CERTIFICATES], panelAccess: ['tournament_panel'] },
    { name: 'tournament_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_TOURNAMENTS], panelAccess: ['tournament_panel'] },

    // ─── VIP TOURNAMENT DEPARTMENT ───────────────────────────────────
    { name: 'head_vip_tournament_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_VIP_TOURNAMENTS, PERMISSIONS.AWARD_CERTIFICATES], panelAccess: ['vip_tournament_panel'] },
    { name: 'senior_vip_tournament_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_VIP_TOURNAMENTS, PERMISSIONS.AWARD_CERTIFICATES], panelAccess: ['vip_tournament_panel'] },
    { name: 'vip_tournament_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_VIP_TOURNAMENTS], panelAccess: ['vip_tournament_panel'] },

    // ─── FORMS DEPARTMENT ────────────────────────────────────────────
    { name: 'head_forms_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_FORMS, PERMISSIONS.AWARD_CERTIFICATES], panelAccess: ['forms_panel'] },
    { name: 'senior_forms_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_FORMS, PERMISSIONS.AWARD_CERTIFICATES], panelAccess: ['forms_panel'] },
    { name: 'forms_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_FORMS], panelAccess: ['forms_panel'] },

    // ─── ADMIN DEPARTMENT ────────────────────────────────────────────
    { name: 'head_admin',        priority: 75, permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.BAN_USERS, PERMISSIONS.ASSIGN_ROLES], panelAccess: ['admin_panel', 'moderation_panel'] },
    { name: 'senior_chief_admin', priority: 73, permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.BAN_USERS], panelAccess: ['admin_panel', 'moderation_panel'] },
    { name: 'chief_admin',       priority: 70, permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.BAN_USERS], panelAccess: ['admin_panel'] },
    { name: 'senior_admin',      priority: 65, permissions: [PERMISSIONS.MANAGE_USERS], panelAccess: ['admin_panel'] },
    { name: 'admin',             priority: 60, permissions: [PERMISSIONS.MANAGE_USERS], panelAccess: ['admin_panel'] },

    // ─── TEAM SYSTEM DEPARTMENT ──────────────────────────────────────
    { name: 'head_team_system_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_TEAMS], panelAccess: ['team_panel'] },
    { name: 'senior_team_system_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_TEAMS], panelAccess: ['team_panel'] },
    { name: 'team_system_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_TEAMS], panelAccess: ['team_panel'] },

    // ─── ACHIEVEMENTS DEPARTMENT ─────────────────────────────────────
    { name: 'head_achievements_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_ACHIEVEMENTS], panelAccess: ['achievement_panel'] },
    { name: 'senior_achievements_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_ACHIEVEMENTS], panelAccess: ['achievement_panel'] },
    { name: 'achievements_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_ACHIEVEMENTS], panelAccess: ['achievement_panel'] },

    // ─── VIP ZONE DEPARTMENT ─────────────────────────────────────────
    { name: 'head_vip_zone_manager',   priority: 72, permissions: [PERMISSIONS.MANAGE_VIP_ZONE, PERMISSIONS.MANAGE_VIP_TOURNAMENTS], panelAccess: ['vip_zone_panel'] },
    { name: 'senior_vip_zone_manager', priority: 66, permissions: [PERMISSIONS.MANAGE_VIP_ZONE], panelAccess: ['vip_zone_panel'] },
    { name: 'vip_zone_manager',        priority: 61, permissions: [PERMISSIONS.MANAGE_VIP_ZONE], panelAccess: ['vip_zone_panel'] },

    // ─── COMMUNITY DEPARTMENT ────────────────────────────────────────
    { name: 'head_community_manager',   priority: 72, permissions: [PERMISSIONS.MODERATE_COMMUNITY, PERMISSIONS.SEND_BROADCAST, PERMISSIONS.VIEW_SUPPORT_CHATS], panelAccess: ['community_panel'] },
    { name: 'senior_community_manager', priority: 66, permissions: [PERMISSIONS.MODERATE_COMMUNITY, PERMISSIONS.SEND_BROADCAST], panelAccess: ['community_panel'] },
    { name: 'community_manager',        priority: 61, permissions: [PERMISSIONS.MODERATE_COMMUNITY], panelAccess: ['community_panel'] },

    // ─── MODERATION DEPARTMENT ───────────────────────────────────────
    { name: 'head_moderator',   priority: 72, permissions: [PERMISSIONS.BAN_USERS, PERMISSIONS.VIEW_SUPPORT_CHATS, PERMISSIONS.MODERATE_COMMUNITY], panelAccess: ['moderation_panel'] },
    { name: 'senior_moderator', priority: 66, permissions: [PERMISSIONS.BAN_USERS, PERMISSIONS.MODERATE_COMMUNITY], panelAccess: ['moderation_panel'] },
    { name: 'moderator',        priority: 61, permissions: [PERMISSIONS.BAN_USERS], panelAccess: ['moderation_panel'] },

    // ─── VIP TIERS ───────────────────────────────────────────────────
    { name: 'vip_elite', priority: 25, permissions: ['join_vip_tournaments', 'join_elite_tournaments', 'vip_chat', 'priority_support'], panelAccess: [] },
    { name: 'vip_plus',  priority: 23, permissions: ['join_vip_tournaments', 'vip_chat', 'priority_support'], panelAccess: [] },
    { name: 'vip',       priority: 21, permissions: ['join_vip_tournaments', 'vip_chat'], panelAccess: [] },

    // ─── PLAYER / USER ───────────────────────────────────────────────
    { name: 'player', priority: 15, permissions: ['join_tournament', 'chat'], panelAccess: [] },
    { name: 'user',   priority: 10, permissions: ['join_tournament', 'chat'], panelAccess: [] },
  ];

  await Role.insertMany(seedData);
  console.log('Roles seeded.');
};
