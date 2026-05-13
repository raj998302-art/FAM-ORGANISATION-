import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Coins, 
  Menu, 
  X,
  Settings,
  Shield,
  LogOut,
  Globe,
  Users,
  Award,
  Gift,
  HelpCircle,
  MessageCircle,
  Crown,
  FileText
} from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import RoleBadge from '../ui/RoleBadge';
import AppEmoji from '../ui/AppEmoji';
import { hasAnyAdminPanelAccess } from '@/lib/permissions';

const VIP_ROLES = ['vip', 'vip_plus', 'vip_elite'];
const STAFF_ROLES = ['owner','co_owner','fam_manager','head_admin','senior_chief_admin','chief_admin','senior_admin','admin','head_payment_manager','senior_payment_manager','payment_manager','head_technical_manager','senior_technical_manager','technical_manager','head_tournament_manager','senior_tournament_manager','tournament_manager','head_vip_tournament_manager','senior_vip_tournament_manager','vip_tournament_manager','head_forms_manager','senior_forms_manager','forms_manager','head_moderator','senior_moderator','moderator'];

export default function TopHeader({ user, profile, wallet, showMenu = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadNotificationCount();
  }, [user]);

  const loadNotificationCount = async () => {
    if (!user) return;
    const notifications = await apiClient.entities.Notification.filter({
      user_email: user.email,
      is_read: false
    });
    setNotificationCount(notifications.length);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50" />
        
        <div className="relative flex items-center justify-between px-4 py-3 safe-area-pt">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ boxShadow: '0 0 20px rgba(0,255,255,0.35)' }}
              className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
            >
              <img
                src="https://i.ibb.co/39H03P4C/file-00000000b718720782db0e5073b7aac2.png"
                alt="FAM"
                className="w-10 h-10 rounded-xl object-contain"
                onError={(e) => { e.target.style.display='none'; }}
              />
            </motion.div>
            <div>
              <h1 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 leading-tight">
                FIRE ARENA MAX
              </h1>
              <p className="text-slate-500 text-xs leading-tight hidden sm:block">Esports Platform</p>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Wallet Balance */}
            {wallet && (
              <Link to={createPageUrl('Wallet')}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl"
                >
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">
                    ₹{wallet.balance || 0}
                  </span>
                </motion.div>
              </Link>
            )}

            {/* Notifications */}
            <Link to={createPageUrl('Notifications')}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2"
              >
                <Bell className="w-6 h-6 text-slate-400 hover:text-cyan-400 transition-colors" />
                {notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>

            {/* Menu Toggle */}
            {showMenu && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-400" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Slide Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-slate-900 border-l border-slate-800"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100dvh' }}
            >
              {/* Fixed header — never scrolls */}
              <div className="p-6 border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-500/50"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <span className="text-xl font-bold text-cyan-400">
                        {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-white">{profile?.username || 'Player'}</p>
                    <p className="text-sm text-slate-400">Level {profile?.level || 1}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable nav — takes remaining height, touch scrolls properly */}
              <nav className="px-4 pt-4 pb-16 space-y-2 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
                <Link
                  to={createPageUrl('Profile')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200">Settings</span>
                </Link>
                
                <Link
                  to={createPageUrl('Teams')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-200">Teams</span>
                </Link>
                
                <Link
                  to={createPageUrl('Achievements')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-200">Achievements</span>
                </Link>
                
                <Link
                  to={createPageUrl('DirectMessages')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-200">Direct Messages</span>
                </Link>
                
                <Link
                  to={createPageUrl('Events')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <Gift className="w-5 h-5 text-orange-400" />
                  <span className="text-slate-200">Special Events</span>
                </Link>

                <Link
                  to={createPageUrl('FAQ')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-200">FAQ</span>
                </Link>

                <Link
                  to={createPageUrl('TrophyRoom')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-200">Trophy Room</span>
                </Link>

                <Link
                  to={createPageUrl('Forms')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors"
                >
                  <AppEmoji name="forms" size={20}/>
                  <div className="flex-1">
                    <span className="text-cyan-300 font-semibold block text-sm">Staff Applications</span>
                    <span className="text-slate-500 text-xs">Apply for a role in FAM</span>
                  </div>
                </Link>

                <Link
                  to={createPageUrl('Deposit')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:from-yellow-500/20 hover:to-orange-500/20 transition-colors"
                >
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">Buy Coins</span>
                </Link>
                
                <Link
                  to={createPageUrl('Website')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <Globe className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200">Website</span>
                </Link>

                <Link
                  to={createPageUrl('VIPPlans')}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:from-yellow-500/20 transition-colors"
                >
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">VIP Plans</span>
                </Link>

                {VIP_ROLES.some(r => (user?.roles || []).includes(r)) && (
                  <Link
                    to={createPageUrl('VIPPanel')}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/15 to-purple-500/15 border border-yellow-500/40 hover:from-yellow-500/25 transition-colors"
                  >
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">VIP Panel</span>
                    {(user?.roles || []).filter(r => VIP_ROLES.includes(r)).map(r => (
                      <RoleBadge key={r} role={r} size="xs" showLabel={false} />
                    ))}
                  </Link>
                )}

                {hasAnyAdminPanelAccess(user) && (
                  <Link
                    to={createPageUrl('RolePanel')}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                  >
                    <Shield className="w-5 h-5 text-purple-400" />
                    <div className="flex-1">
                      <span className="text-purple-400 font-medium block">My Panel</span>
                      <span className="text-purple-300/60 text-xs">Role-based access</span>
                    </div>
                  </Link>
                )}

                <button
                  onClick={async () => {
                    localStorage.removeItem('token');
                    await apiClient.auth.logout(window.location.origin + '/');
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors w-full text-left"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Logout</span>
                </button>

              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}