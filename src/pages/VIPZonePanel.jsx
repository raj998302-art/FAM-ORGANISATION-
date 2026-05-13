import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Crown, Star, Zap, Users, ChevronLeft, RefreshCw,
  Search, CheckCircle, XCircle, Edit3, Plus, Clock,
  TrendingUp, AlertTriangle, Coins
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import RoleBadge from '../components/ui/RoleBadge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';

const VIP_TIERS = [
  { role: 'vip', label: 'VIP', color: 'cyan', icon: Star },
  { role: 'vip_plus', label: 'VIP+', color: 'purple', icon: Zap },
  { role: 'vip_elite', label: 'VIP Elite', color: 'gold', icon: Crown },
];

export default function VIPZonePanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, revenue: 0 });
  const [selectedSub, setSelectedSub] = useState(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantRole, setGrantRole] = useState('vip');
  const [grantDays, setGrantDays] = useState(30);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('MANAGE_VIP_ZONE') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const subs = await apiClient.entities.Subscription.filter({}, '-createdAt', 200);
      setSubscriptions(subs);

      const active = subs.filter(s => s.status === 'active').length;
      const expired = subs.filter(s => s.status === 'expired').length;
      const revenue = subs.reduce((s, sub) => s + (sub.amount || 0), 0);
      setStats({ total: subs.length, active, expired, revenue });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleGrantVIP = async () => {
    if (!grantEmail) { toast.error('Enter user email'); return; }
    setProcessing(true);
    try {
      // Create subscription record
      const endDate = new Date(Date.now() + grantDays * 24 * 60 * 60 * 1000).toISOString();
      await apiClient.entities.Subscription.create({
        user_email: grantEmail,
        role: grantRole,
        amount: 0,
        plan_id: `manual_${grantRole}`,
        start_date: new Date().toISOString(),
        end_date: endDate,
        status: 'active',
        granted_by: user.email
      });

      // Update user roles via admin route
      const users = await apiClient.admin.getUsers();
      const targetUser = users.find(u => u.email === grantEmail);
      if (targetUser) {
        const currentRoles = targetUser.roles || ['user'];
        if (!currentRoles.includes(grantRole)) {
          await apiClient.admin.assignRole(targetUser._id || targetUser.id, [...currentRoles, grantRole]);
        }
      }

      // Notify user
      await apiClient.entities.Notification.create({
        user_email: grantEmail,
        title: `🎉 VIP Access Granted!`,
        message: `You have been granted ${grantRole.toUpperCase()} access for ${grantDays} days by staff.`,
        type: 'vip_grant', created_date: new Date().toISOString()
      });

      toast.success(`VIP granted to ${grantEmail}`);
      setShowGrantDialog(false);
      setGrantEmail('');
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(false); }
  };

  const handleRevoke = async (sub) => {
    try {
      await apiClient.entities.Subscription.update(sub.id, { status: 'revoked' });
      await apiClient.entities.Notification.create({
        user_email: sub.user_email,
        title: '⚠️ VIP Access Revoked',
        message: `Your ${sub.role?.toUpperCase()} access has been revoked by staff.`,
        type: 'system', created_date: new Date().toISOString()
      });
      toast.success('VIP access revoked');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading VIP Zone Panel..." />;

  const filtered = subscriptions.filter(s =>
    (tierFilter === 'all' || s.role === tierFilter) &&
    (statusFilter === 'all' || s.status === statusFilter) &&
    (!search || s.user_email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="gold" size="xl">VIP ZONE PANEL</NeonText>
            <p className="text-slate-400 text-xs">Manage VIP members & subscriptions</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-yellow-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <GlowCard glowColor="cyan" className="p-3 text-center">
            <p className="text-xl font-black text-cyan-400">{stats.active}</p>
            <p className="text-xs text-slate-400">Active VIPs</p>
          </GlowCard>
          <GlowCard glowColor="gold" className="p-3 text-center">
            <p className="text-xl font-black text-yellow-400">₹{stats.revenue}</p>
            <p className="text-xs text-slate-400">VIP Revenue</p>
          </GlowCard>
        </div>

        {/* VIP Tier Breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {VIP_TIERS.map(tier => {
            const count = subscriptions.filter(s => s.role === tier.role && s.status === 'active').length;
            const TIcon = tier.icon;
            return (
              <GlowCard key={tier.role} glowColor={tier.color} className="p-3 text-center cursor-pointer"
                onClick={() => { setTierFilter(tier.role); setStatusFilter('active'); }}>
                <TIcon className={`w-5 h-5 mx-auto mb-1 ${tier.color === 'gold' ? 'text-yellow-400' : `text-${tier.color}-400`}`} />
                <p className={`text-lg font-black ${tier.color === 'gold' ? 'text-yellow-400' : `text-${tier.color}-400`}`}>{count}</p>
                <p className="text-xs text-slate-400">{tier.label}</p>
              </GlowCard>
            );
          })}
        </div>

        {/* Grant VIP Button */}
        <GamingButton variant="primary" className="w-full mb-4" icon={Plus} onClick={() => setShowGrantDialog(true)}>
          Grant VIP Access
        </GamingButton>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search email..." className="pl-9 bg-slate-800 border-slate-700 text-white text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {['all', 'active', 'expired', 'revoked'].map(s => (
              <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No subscriptions found</div>
        ) : (
          filtered.map((sub, i) => {
            const tier = VIP_TIERS.find(t => t.role === sub.role);
            const TIcon = tier?.icon || Crown;
            const isExpired = sub.status === 'expired' || (sub.end_date && new Date(sub.end_date) < new Date());
            const daysLeft = sub.end_date ? Math.ceil((new Date(sub.end_date) - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
            return (
              <motion.div key={sub.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <GlowCard glowColor={sub.status === 'active' ? (tier?.color || 'cyan') : 'purple'} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tier?.color === 'gold' ? 'bg-yellow-500/20' : `bg-${tier?.color || 'cyan'}-500/20`}`}>
                        <TIcon className={`w-5 h-5 ${tier?.color === 'gold' ? 'text-yellow-400' : `text-${tier?.color || 'cyan'}-400`}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{sub.user_email}</p>
                        <RoleBadge role={sub.role} size="xs" />
                        <p className="text-xs text-slate-400 mt-1">
                          {sub.end_date ? (isExpired ? '⚠️ Expired' : `⏳ ${daysLeft}d left`) : 'No expiry'}
                        </p>
                        {sub.granted_by && <p className="text-xs text-slate-500">Granted by {sub.granted_by}</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-yellow-400 font-bold text-sm">₹{sub.amount || 0}</p>
                      <Badge variant="outline" className={`text-xs mb-2 ${sub.status === 'active' ? 'text-green-400 border-green-500/50' : 'text-red-400 border-red-500/50'}`}>
                        {sub.status}
                      </Badge>
                      {sub.status === 'active' && (
                        <button onClick={() => handleRevoke(sub)}
                          className="block text-xs text-red-400 hover:text-red-300 transition-colors mt-1">
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Grant VIP Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2"><Crown className="w-5 h-5" /> Grant VIP Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">User Email</label>
              <Input value={grantEmail} onChange={e => setGrantEmail(e.target.value)}
                placeholder="user@example.com" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">VIP Tier</label>
              <Select value={grantRole} onValueChange={setGrantRole}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {VIP_TIERS.map(t => (
                    <SelectItem key={t.role} value={t.role} className="text-white">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Duration (days)</label>
              <Input type="number" value={grantDays} onChange={e => setGrantDays(Number(e.target.value))}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <GamingButton variant="primary" className="w-full" disabled={processing} onClick={handleGrantVIP}>
              {processing ? 'Granting...' : 'Grant VIP'}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
