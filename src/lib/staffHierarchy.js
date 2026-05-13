// ── Fire Arena Max — Staff Hierarchy & Promotion System ──────────────────
// 
// HIERARCHY (lowest to highest):
//   Tournament Manager → Senior Tournament Manager → Head Tournament Manager
//   → FAM Manager → Co-Owner → Owner
//
// RULES:
//   • Users apply for Tournament Manager (lowest entry point)
//   • No one can apply for Co-Owner / Owner / FAM Manager
//   • Promotions are approved by the NEXT tier above
//   • Owner/Co-Owner can approve any role
//   • Head TM approves Senior TM → Head TM promotions
//   • FAM Manager approves Head TM → FAM Manager
//

export const STAFF_HIERARCHY = {
  // Key: role name, Value: config
  tournament_manager: {
    label: 'Tournament Manager',
    shortLabel: 'Tournament Manager',
    color: 'cyan',
    level: 1,
    canApply: true,
    canBePromotedTo: 'senior_tournament_manager',
    promotionApprovers: ['head_tournament_manager', 'fam_manager', 'co_owner', 'owner'],
    description: 'Creates & manages tournaments, posts results, handles room details',
    requirements: [
      'Must be an active member for at least 7 days',
      'Must have played at least 3 tournaments',
      'Must have a valid Free Fire UID linked',
      'Must agree to the Staff Code of Conduct',
    ],
  },
  senior_tournament_manager: {
    label: 'Senior Tournament Manager',
    shortLabel: 'Sr. TM',
    color: 'blue',
    level: 2,
    canApply: false, // Promotion only
    canBePromotedTo: 'head_tournament_manager',
    promotionApprovers: ['head_tournament_manager', 'fam_manager', 'co_owner', 'owner'],
    description: 'Oversees TMs, handles escalations, manages VIP tournaments',
    promotionRequirements: [
      'Must be Tournament Manager for at least 30 days',
      'Must have successfully managed 10+ tournaments',
      'Must complete 3 promotion tasks',
      'Approved by Head Tournament Manager or above',
    ],
  },
  head_tournament_manager: {
    label: 'Head Tournament Manager',
    shortLabel: 'Head TM',
    color: 'purple',
    level: 3,
    canApply: false,
    canBePromotedTo: 'fam_manager',
    promotionApprovers: ['fam_manager', 'co_owner', 'owner'],
    description: 'Leads the entire tournament division, makes final calls',
    promotionRequirements: [
      'Must be Sr. TM for at least 60 days',
      'Must complete 5 promotion tasks',
      'Approved by FAM Manager or Owner',
    ],
  },
  fam_manager: {
    label: 'FAM Manager',
    shortLabel: 'FAM Mgr',
    color: 'gold',
    level: 10,
    canApply: false, // Owner-assigned only
    promotionApprovers: ['co_owner', 'owner'],
    description: 'Senior staff, manages all operations. Assigned by Owner only.',
  },
  co_owner: {
    label: 'Co-Owner',
    shortLabel: 'Co-Owner',
    color: 'gold',
    level: 11,
    canApply: false, // Owner-assigned only
    description: 'Joint authority with Owner. Appointed by Owner only.',
  },
  owner: {
    label: 'Owner',
    shortLabel: 'Owner',
    color: 'red',
    level: 12,
    canApply: false,
    description: 'Supreme authority. Cannot be applied for.',
  },
};

// Which roles can approve which applications
export const canApproveApplication = (approverRole, targetRole) => {
  const target = STAFF_HIERARCHY[targetRole];
  if (!target) return false;
  return target.promotionApprovers?.includes(approverRole) || false;
};

// Can this user role approve this promotion?
export const canApprovePanelAccess = (userRoles = []) => {
  const privileged = ['head_tournament_manager', 'fam_manager', 'co_owner', 'owner'];
  return userRoles.some(r => privileged.includes(r));
};

// Roles that cannot be applied for
export const PROTECTED_ROLES = ['owner', 'co_owner', 'fam_manager'];

// Promotion task templates per role
export const PROMOTION_TASKS = {
  // Tasks to earn promotion FROM tournament_manager TO senior_tournament_manager
  senior_tournament_manager: [
    {
      id: 'pt_tm_1',
      title: 'Host 5 Successful Tournaments',
      description: 'Successfully manage and complete 5 tournaments with results uploaded within 2 hours of match end.',
      proof_type: 'screenshot',
      proof_hint: 'Screenshot of completed tournament list in admin panel',
    },
    {
      id: 'pt_tm_2',
      title: 'Zero Complaint Streak',
      description: 'Manage 3 consecutive tournaments with zero user complaints to admin.',
      proof_type: 'screenshot',
      proof_hint: 'Screenshot showing admin support chat — no complaints about your tournaments',
    },
    {
      id: 'pt_tm_3',
      title: 'Train a New TM',
      description: 'Help onboard a newly joined Tournament Manager and guide them through their first tournament.',
      proof_type: 'screenshot',
      proof_hint: 'Screenshot of conversation with new TM + their first hosted tournament',
    },
  ],
  // Tasks to earn promotion FROM senior_tournament_manager TO head_tournament_manager
  head_tournament_manager: [
    {
      id: 'pt_stm_1',
      title: 'Host 15 Tournaments as Sr. TM',
      description: 'Successfully manage 15 tournaments in your Senior TM role.',
      proof_type: 'screenshot',
      proof_hint: 'Screenshot of your tournament history',
    },
    {
      id: 'pt_stm_2',
      title: 'Resolve 5 Player Disputes',
      description: 'Successfully mediate and resolve 5 player disputes or complaints.',
      proof_type: 'screenshot',
      proof_hint: 'Screenshots of resolved dispute conversations',
    },
    {
      id: 'pt_stm_3',
      title: 'Create Tournament Format Proposal',
      description: 'Write and submit a new tournament format or rule improvement that gets implemented.',
      proof_type: 'text',
      proof_hint: 'Paste your full proposal here',
    },
    {
      id: 'pt_stm_4',
      title: 'Mentor 3 Tournament Managers',
      description: 'Successfully mentor 3 TMs who complete at least 5 tournaments each under your guidance.',
      proof_type: 'screenshot',
      proof_hint: 'Screenshots showing TMs you mentored and their completed tournaments',
    },
    {
      id: 'pt_stm_5',
      title: 'Zero Escalations for 30 Days',
      description: 'Run the tournament division for 30 consecutive days without any escalation to FAM Manager.',
      proof_type: 'text',
      proof_hint: 'State the dates and confirm no escalations occurred',
    },
  ],
};

export const getRoleColor = (role) => STAFF_HIERARCHY[role]?.color || 'slate';
export const getRoleLevel = (role) => STAFF_HIERARCHY[role]?.level || 0;
export const getRoleLabel = (role) => STAFF_HIERARCHY[role]?.label || role?.replace(/_/g, ' ').toUpperCase() || 'Unknown';
export const canRoleApply = (role) => STAFF_HIERARCHY[role]?.canApply || false;
export const isProtectedRole = (role) => PROTECTED_ROLES.includes(role);

// Get next promotion target for a role
export const getPromotionTarget = (currentRole) => STAFF_HIERARCHY[currentRole]?.canBePromotedTo || null;
