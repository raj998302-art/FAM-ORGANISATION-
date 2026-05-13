import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import {
  Shield, Coins, Trophy, Users, Settings, Bell, MessageCircle,
  Award, ChevronRight, ChevronLeft, Crown, Calendar
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import RoleBadge from '../components/ui/RoleBadge';
import LoadingScreen from '../components/ui/LoadingScreen';
import { getUserRoles, getUserPanelAccess, hasAnyAdminPanelAccess } from '@/lib/permissions';

const PANEL_CARDS = {
  master_panel:          { label: 'Master Panel',        desc: 'Full admin dashboard & stats', icon: Shield,       color: 'purple', page: 'AdminDashboard' },
  admin_panel:           { label: 'Admin Panel',          desc: 'Manage all users & roles',     icon: Users,        color: 'cyan',   page: 'AdminUsers' },
  payment_panel:         { label: 'Payment Panel',        desc: 'Deposits, withdrawals, QR',    icon: Coins,        color: 'gold',   page: 'PaymentPanel' },
  technical_panel:       { label: 'Technical Panel',      desc: 'System config, maintenance',   icon: Settings,     color: 'blue',   page: 'TechnicalPanel' },
  tournament_panel:      { label: 'Tournaments',          desc: 'Create & manage tournaments',  icon: Trophy,       color: 'gold',   page: 'AdminTournaments' },
  vip_tournament_panel:  { label: 'VIP Tournaments',      desc: 'Manage VIP-only matches',      icon: Crown,        color: 'purple', page: 'VIPTournamentPanel' },
  forms_panel:           { label: 'Forms Manager',        desc: 'Review staff applications & manage roles', icon: Award,      color: 'cyan', page: 'AdminForms' },
  team_panel:            { label: 'Teams',                desc: 'Manage all teams & rosters',   icon: Users,        color: 'blue',   page: 'TeamPanel' },
  achievement_panel:     { label: 'Achievements',         desc: 'Manage player achievements',   icon: Trophy,       color: 'cyan',   page: 'AdminAchievements' },
  vip_zone_panel:        { label: 'VIP Zone Panel',       desc: 'VIP management & subscriptions', icon: Crown,      color: 'gold',   page: 'VIPZonePanel' },
  community_panel:       { label: 'Community Panel',      desc: 'Broadcasts, events & posts',   icon: Bell,         color: 'orange', page: 'CommunityPanel' },
  events_panel:          { label: 'Events Manager',        desc: 'Create & manage events with thumbnails', icon: Calendar, color: 'purple', page: 'AdminEvents' },
  promotion_review:      { label: 'Promotion Reviews',     desc: 'Approve staff promotion task proofs',   icon: Award,    color: 'gold',   page: 'AdminPromotion' },
  moderation_panel:      { label: 'Moderation Panel',     desc: 'Ban, reports & safety',        icon: MessageCircle, color: 'purple', page: 'ModerationPanel' },
};

export default function RolePanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, tournaments: 0, pending: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      if (!hasAnyAdminPanelAccess(currentUser)) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const [profileList, tournaments, withdrawals] = await Promise.all([
        apiClient.entities.UserProfile.list(),
        apiClient.entities.Tournament.filter({ status: 'registration_open' }),
        apiClient.entities.WithdrawalRequest.filter({ status: 'pending' }),
      ]);
      setStats({ users: profileList.length, tournaments: tournaments.length, pending: withdrawals.length });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen message="Loading your panel..." />;

  const roles = getUserRoles(user);
  const allowedPanels = getUserPanelAccess(user);

  if (allowedPanels.length === 0) {
    navigate(createPageUrl('Home'));
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-cyan-500/20`}>
            <Shield className={`w-8 h-8 text-cyan-400`} />
          </div>
          <div className="flex-1">
            <NeonText color="cyan" size="xl">STAFF PORTAL</NeonText>
            <p className="text-slate-400 text-sm mt-0.5">Unified Access Panel</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {roles.map(r => (
                <RoleBadge key={r} role={r} size="xs" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-cyan-400">{stats.users}</p>
          <p className="text-xs text-slate-400">Total Users</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-yellow-400">{stats.tournaments}</p>
          <p className="text-xs text-slate-400">Open Events</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-orange-400">{stats.pending}</p>
          <p className="text-xs text-slate-400">Pending</p>
        </div>
      </motion.div>

      {/* Authorized Panels */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 px-1">Authorized Modules</h2>
        <div className="space-y-3">
          {allowedPanels.map((path, ii) => {
            const item = PANEL_CARDS[path];
            if (!item) return null;
            const ItemIcon = item.icon;
            return (
              <Link key={ii} to={createPageUrl(item.page || path)}>
                <GlowCard glowColor={item.color} className="p-4" animated>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-${item.color === 'gold' ? 'yellow' : item.color}-500/20 flex items-center justify-center`}>
                        <ItemIcon className={`w-5 h-5 text-${item.color === 'gold' ? 'yellow' : item.color}-400`} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </GlowCard>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Back to App */}
      <div className="mt-4">
        <GamingButton variant="outline" className="w-full" onClick={() => navigate(createPageUrl('Home'))}>
          ← Back to App
        </GamingButton>
      </div>
    </div>
  );
}