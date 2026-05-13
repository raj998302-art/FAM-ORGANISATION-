import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Shield, Ban, UserCheck, Search, ChevronLeft, RefreshCw,
  AlertTriangle, MessageCircle, Eye, Flag, Users, Clock, XCircle
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';

export default function ModerationPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ banned: 0, reports: 0, total: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('BAN_USERS') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const [allUsers, allProfiles, allReports] = await Promise.all([
        apiClient.admin.getUsers(),
        apiClient.entities.UserProfile.filter({}, '-createdAt', 200),
        apiClient.entities.Report.filter({}, '-createdAt', 100).catch(() => []),
      ]);

      setUsers(allUsers || []);
      setProfiles(allProfiles || []);
      setReports(allReports || []);

      const banned = (allProfiles || []).filter(p => p.is_banned).length;
      setStats({ banned, reports: (allReports || []).length, total: (allUsers || []).length });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleBan = async () => {
    if (!banReason) { toast.error('Please provide a ban reason'); return; }
    setProcessing(true);
    try {
      const profile = profiles.find(p => p.user_email === targetUser?.email);
      if (profile) {
        await apiClient.entities.UserProfile.update(profile.id, {
          is_banned: true, ban_reason: banReason, banned_by: user.email,
          ban_date: new Date().toISOString()
        });
        await apiClient.entities.Notification.create({
          user_email: targetUser.email,
          title: '🚫 Account Banned',
          message: `Your account has been banned. Reason: ${banReason}`,
          type: 'system', created_date: new Date().toISOString()
        });
        // Log it
        await apiClient.entities.SystemLog.create({
          event: 'USER_BANNED', user_email: targetUser.email,
          reason: banReason, banned_by: user.email, timestamp: new Date().toISOString()
        });
      }
      toast.success(`${targetUser.email} has been banned`);
      setShowBanDialog(false);
      setBanReason('');
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(false); }
  };

  const handleUnban = async (userEmail) => {
    try {
      const profile = profiles.find(p => p.user_email === userEmail);
      if (profile) {
        await apiClient.entities.UserProfile.update(profile.id, {
          is_banned: false, ban_reason: '', ban_date: null
        });
        await apiClient.entities.Notification.create({
          user_email: userEmail,
          title: '✅ Account Unbanned',
          message: 'Your account ban has been lifted. Welcome back!',
          type: 'system', created_date: new Date().toISOString()
        });
      }
      toast.success(`${userEmail} unbanned`);
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await apiClient.entities.Report.update(reportId, { status: 'dismissed' });
      toast.success('Report dismissed');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading Moderation Panel..." />;

  const filteredUsers = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );
  const bannedProfiles = profiles.filter(p => p.is_banned);

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="purple" size="xl">MODERATION PANEL</NeonText>
            <p className="text-slate-400 text-xs">Manage community safety</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-purple-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <GlowCard glowColor="cyan" className="p-3 text-center">
            <p className="text-xl font-black text-cyan-400">{stats.total}</p>
            <p className="text-xs text-slate-400">Total Users</p>
          </GlowCard>
          <GlowCard glowColor="red" className="p-3 text-center">
            <p className="text-xl font-black text-red-400">{stats.banned}</p>
            <p className="text-xs text-slate-400">Banned</p>
          </GlowCard>
          <GlowCard glowColor="orange" className="p-3 text-center">
            <p className="text-xl font-black text-orange-400">{stats.reports}</p>
            <p className="text-xs text-slate-400">Reports</p>
          </GlowCard>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['users', 'banned', 'reports'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${tab === t ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users..." className="pl-9 bg-slate-800 border-slate-700 text-white text-sm" />
      </div>

      <AnimatePresence mode="wait">
        {tab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              {filteredUsers.slice(0, 50).map((u, i) => {
                const profile = profiles.find(p => p.user_email === u.email);
                const isBanned = profile?.is_banned;
                return (
                  <motion.div key={u._id || u.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <GlowCard glowColor={isBanned ? 'red' : 'purple'} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{u.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          <p className="text-xs text-slate-500">{u.roles?.join(', ')}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isBanned ? (
                            <button onClick={() => handleUnban(u.email)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold hover:bg-green-500/40 transition-all">
                              <UserCheck className="w-3 h-3" /> Unban
                            </button>
                          ) : (
                            <button onClick={() => { setTargetUser(u); setShowBanDialog(true); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/40 transition-all">
                              <Ban className="w-3 h-3" /> Ban
                            </button>
                          )}
                        </div>
                      </div>
                      {isBanned && profile?.ban_reason && (
                        <p className="text-xs text-red-400 mt-2 border-t border-red-500/20 pt-2">⚠️ {profile.ban_reason}</p>
                      )}
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === 'banned' && (
          <motion.div key="banned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {bannedProfiles.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No banned users</div>
            ) : (
              <div className="space-y-3">
                {bannedProfiles.map((p, i) => (
                  <GlowCard key={p.id || i} glowColor="red" className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{p.ign || p.username}</p>
                        <p className="text-xs text-slate-400 truncate">{p.user_email}</p>
                        <p className="text-xs text-red-400 mt-1">Reason: {p.ban_reason}</p>
                        <p className="text-xs text-slate-500">Banned by: {p.banned_by} • {p.ban_date ? new Date(p.ban_date).toLocaleDateString() : ''}</p>
                      </div>
                      <button onClick={() => handleUnban(p.user_email)}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold hover:bg-green-500/40 transition-all flex-shrink-0">
                        Unban
                      </button>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'reports' && (
          <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No reports</div>
            ) : (
              <div className="space-y-3">
                {reports.filter(r => r.status !== 'dismissed').map((r, i) => (
                  <GlowCard key={r.id || i} glowColor="orange" className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-orange-400 font-bold text-sm">Report: {r.type || 'General'}</p>
                        <p className="text-xs text-white truncate">Against: {r.reported_user}</p>
                        <p className="text-xs text-slate-400 mt-1">{r.reason}</p>
                        <p className="text-xs text-slate-500">By: {r.reporter_email}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => { const u = users.find(uu => uu.email === r.reported_user); if (u) { setTargetUser(u); setBanReason(`Report: ${r.reason}`); setShowBanDialog(true); } }}
                          className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold">
                          Ban
                        </button>
                        <button onClick={() => handleDismissReport(r.id)}
                          className="px-3 py-1 rounded-lg bg-slate-700 border border-slate-600 text-slate-400 text-xs font-bold">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2"><Ban className="w-5 h-5" /> Ban User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">Banning: <span className="text-white font-bold">{targetUser?.email}</span></p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ban Reason *</label>
              <Textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                placeholder="Provide a clear reason for the ban..."
                className="bg-slate-800 border-slate-700 text-white resize-none" rows={3} />
            </div>
            <div className="flex gap-3">
              <GamingButton variant="outline" className="flex-1" onClick={() => setShowBanDialog(false)}>Cancel</GamingButton>
              <GamingButton variant="danger" className="flex-1" disabled={processing} onClick={handleBan}>
                {processing ? 'Banning...' : 'Confirm Ban'}
              </GamingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
