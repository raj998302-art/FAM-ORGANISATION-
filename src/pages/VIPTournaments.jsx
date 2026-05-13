import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Crown, Trophy, Star, Zap, Users, ChevronRight, Lock,
  ChevronLeft, Coins, Target, Clock, Shield
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import RoleBadge from '../components/ui/RoleBadge';
import { Badge } from '@/components/ui/badge';
import { getUserRoles } from '@/lib/permissions';
import TournamentCard from '../components/tournament/TournamentCard';

const VIP_ROLES = ['vip_elite', 'vip_plus', 'vip', 'owner', 'co_owner', 'fam_manager'];

const VIP_TIER_BADGE = {
  vip: { label: 'VIP', color: 'cyan', icon: Star },
  vip_plus: { label: 'VIP+', color: 'purple', icon: Zap },
  vip_elite: { label: 'VIP Elite', color: 'gold', icon: Crown },
};

export default function VIPTournaments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const roles = getUserRoles(currentUser);
      const tier = ['vip_elite', 'vip_plus', 'vip'].find(r => roles.includes(r));

      if (!roles.some(r => VIP_ROLES.includes(r))) {
        navigate(createPageUrl('VIPPlans'));
        return;
      }

      setUser(currentUser);
      setUserTier(tier || 'staff');

      const [allTournaments, wallets] = await Promise.all([
        apiClient.entities.Tournament.filter({}, '-createdAt', 100),
        apiClient.entities.Wallet.filter({ user_email: currentUser.email }),
      ]);

      // Filter VIP-tagged tournaments
      const vipTournaments = (allTournaments || []).filter(t =>
        t.is_vip || t.vip_only || t.tournament_type?.includes('vip') ||
        t.required_role === 'vip' || t.required_role === 'vip_plus' || t.required_role === 'vip_elite' ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes('vip')))
      );

      setTournaments(vipTournaments);
      if (wallets.length > 0) setWallet(wallets[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen message="Loading VIP Tournaments..." />;

  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status === 'registration_open';
    if (filter === 'live') return t.status === 'ongoing';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const tierConfig = VIP_TIER_BADGE[userTier] || { label: 'Staff', color: 'cyan', icon: Shield };
  const TierIcon = tierConfig.icon;

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('VIPPanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="gold" size="xl">VIP TOURNAMENTS</NeonText>
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" /> Exclusive for VIP members
            </p>
          </div>
          <RoleBadge role={userTier || 'vip'} size="sm" />
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-yellow-900/30 via-orange-900/20 to-slate-900 border border-yellow-500/20 p-5">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-yellow-400 font-black text-lg">VIP ZONE</p>
              <p className="text-slate-300 text-sm">Bigger prizes. Smaller fields. Elite competition.</p>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-bold">Balance: ₹{wallet?.balance || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
          {['all', 'open', 'live', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tournaments */}
      {filteredTournaments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-yellow-400/30" />
          </div>
          <p className="text-slate-400 font-bold text-lg">No VIP Tournaments Yet</p>
          <p className="text-slate-500 text-sm mt-1">Check back soon for exclusive VIP events!</p>
          <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left max-w-xs mx-auto">
            <p className="text-cyan-400 font-bold text-sm mb-2">💡 What to expect:</p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Higher prize pools (₹500 – ₹5000+)</li>
              <li>• Smaller player fields (8-16 slots)</li>
              <li>• VIP-exclusive brackets</li>
              <li>• Priority room access</li>
              <li>• Faster results &amp; payouts</li>
            </ul>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredTournaments.map((t, i) => (
            <motion.div key={t.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(createPageUrl('TournamentDetails') + `?id=${t.id}`)}
              className="cursor-pointer">
              <div className="relative">
                {/* VIP Badge */}
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    <Crown className="w-3 h-3" /> VIP
                  </div>
                </div>
                <TournamentCard tournament={t} wallet={wallet} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CTA if no VIP tournaments */}
      {filteredTournaments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
          <GamingButton variant="outline" className="w-full" onClick={() => navigate(createPageUrl('Tournaments'))}>
            Browse Regular Tournaments
          </GamingButton>
        </motion.div>
      )}
    </div>
  );
}
