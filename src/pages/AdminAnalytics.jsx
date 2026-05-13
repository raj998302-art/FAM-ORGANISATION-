import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, Users, Trophy, Coins, Calendar, RefreshCw, BarChart2, PieChart, Activity } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';

function StatBox({ label, value, sub, color = 'cyan', icon: Icon }) {
  return (
    <GlowCard glowColor={color} className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-slate-400 text-xs">{label}</p>
          <p className={`text-2xl font-black text-${color}-400 mt-0.5`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
        )}
      </div>
    </GlowCard>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-28 truncate">{label}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full bg-${color || 'cyan'}-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-${color || 'cyan'}-400 text-xs font-bold w-10 text-right`}>{value}</span>
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const user = await apiClient.auth.me();
      if (!user.panels?.includes('master_panel')) { navigate(createPageUrl('AdminDashboard')); return; }
    } catch { navigate(createPageUrl('Home')); return; }
    loadData();
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [profiles, tournaments, transactions, withdrawals, events, forms, chats] = await Promise.all([
        apiClient.entities.UserProfile.list().catch(() => []),
        apiClient.entities.Tournament.list().catch(() => []),
        apiClient.entities.Transaction.list().catch(() => []),
        apiClient.entities.WithdrawalRequest.list().catch(() => []),
        apiClient.entities.Event.list().catch(() => []),
        apiClient.entities.RoleApplication.list().catch(() => []),
        apiClient.entities.ChatMessage.list().catch(() => []),
      ]);

      // Revenue
      const completedDeposits = (transactions || []).filter(t => t.status === 'completed' && t.type === 'deposit');
      const totalRevenue = completedDeposits.reduce((s, t) => s + (t.amount || 0), 0);
      const todayRevenue = completedDeposits
        .filter(t => new Date(t.created_date) > new Date(Date.now() - 86400000))
        .reduce((s, t) => s + (t.amount || 0), 0);
      const weekRevenue = completedDeposits
        .filter(t => new Date(t.created_date) > new Date(Date.now() - 7 * 86400000))
        .reduce((s, t) => s + (t.amount || 0), 0);

      // Tournaments
      const activeTournaments = (tournaments || []).filter(t => ['upcoming', 'registration_open', 'live'].includes(t.status));
      const completedTournaments = (tournaments || []).filter(t => t.status === 'completed');
      const totalPrize = activeTournaments.reduce((s, t) => s + (t.prize_pool || 0), 0);

      // Users
      const vipUsers = (profiles || []).filter(p => p.vip_role && p.vip_role !== 'none').length;
      const activeToday = (profiles || []).filter(p => new Date(p.last_seen) > new Date(Date.now() - 86400000)).length;
      const newThisWeek = (profiles || []).filter(p => new Date(p.created_date) > new Date(Date.now() - 7 * 86400000)).length;

      // Withdrawals
      const pendingWithdrawals = (withdrawals || []).filter(w => w.status === 'pending');
      const totalWithdrawn = (withdrawals || []).filter(w => w.status === 'approved').reduce((s, w) => s + (w.amount || 0), 0);

      // Tournament mode breakdown
      const modeCounts = (tournaments || []).reduce((acc, t) => {
        acc[t.mode] = (acc[t.mode] || 0) + 1;
        return acc;
      }, {});

      // Top earning tournaments
      const topTournaments = (tournaments || [])
        .sort((a, b) => (b.prize_pool || 0) - (a.prize_pool || 0))
        .slice(0, 5);

      // Transaction types breakdown
      const txByType = (transactions || []).reduce((acc, t) => {
        if (t.status === 'completed') acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {});

      setData({
        totalUsers: (profiles || []).length,
        vipUsers,
        activeToday,
        newThisWeek,
        totalRevenue,
        todayRevenue,
        weekRevenue,
        totalTournaments: (tournaments || []).length,
        activeTournaments: activeTournaments.length,
        completedTournaments: completedTournaments.length,
        totalPrize,
        pendingWithdrawals: pendingWithdrawals.length,
        totalWithdrawn,
        totalEvents: (events || []).length,
        activeEvents: (events || []).filter(e => e.status === 'active').length,
        pendingForms: (forms || []).filter(f => f.status === 'pending').length,
        totalChats: (chats || []).length,
        modeCounts,
        topTournaments,
        txByType,
        netProfit: totalRevenue - totalWithdrawn,
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading analytics..." />;
  if (!data) return null;

  const maxMode = Math.max(...Object.values(data.modeCounts));

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
            <AppEmoji name="stats" size={26} /> ANALYTICS
          </NeonText>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700/50"
        >
          <RefreshCw className={`w-5 h-5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Revenue Section */}
      <p className="text-slate-400 text-xs font-bold uppercase mb-3 tracking-wider">Revenue</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox label="Total Revenue" value={`₹${data.totalRevenue.toLocaleString('en-IN')}`} icon={TrendingUp} color="green" sub="All time deposits" />
        <StatBox label="Net Profit" value={`₹${data.netProfit.toLocaleString('en-IN')}`} icon={Coins} color={data.netProfit >= 0 ? 'green' : 'red'} sub="Revenue - Withdrawals" />
        <StatBox label="Today" value={`₹${data.todayRevenue}`} icon={Activity} color="cyan" sub="Today's deposits" />
        <StatBox label="This Week" value={`₹${data.weekRevenue}`} icon={Calendar} color="purple" sub="7-day deposits" />
      </div>

      {/* Users Section */}
      <p className="text-slate-400 text-xs font-bold uppercase mb-3 tracking-wider">Users</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox label="Total Users" value={data.totalUsers} icon={Users} color="cyan" sub="Registered accounts" />
        <StatBox label="VIP Members" value={data.vipUsers} icon={Users} color="yellow" sub={`${((data.vipUsers/data.totalUsers||0)*100).toFixed(1)}% of users`} />
        <StatBox label="Active Today" value={data.activeToday} icon={Activity} color="green" sub="Seen in last 24h" />
        <StatBox label="New This Week" value={data.newThisWeek} icon={TrendingUp} color="purple" sub="Last 7 days" />
      </div>

      {/* Tournaments Section */}
      <p className="text-slate-400 text-xs font-bold uppercase mb-3 tracking-wider">Tournaments</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBox label="Total" value={data.totalTournaments} icon={Trophy} color="gold" />
        <StatBox label="Active" value={data.activeTournaments} icon={Trophy} color="green" />
        <StatBox label="Prize Pool Active" value={`₹${data.totalPrize}`} icon={Coins} color="yellow" />
        <StatBox label="Completed" value={data.completedTournaments} icon={Trophy} color="cyan" />
      </div>

      {/* Mode Breakdown */}
      {Object.keys(data.modeCounts).length > 0 && (
        <GlowCard glowColor="cyan" className="p-4 mb-5">
          <p className="text-cyan-400 font-bold text-sm mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Tournament Modes
          </p>
          <div className="space-y-2">
            {Object.entries(data.modeCounts).map(([mode, count]) => (
              <MiniBar key={mode} label={mode.charAt(0).toUpperCase() + mode.slice(1)} value={count} max={maxMode} color="cyan" />
            ))}
          </div>
        </GlowCard>
      )}

      {/* Top Tournaments */}
      {data.topTournaments.length > 0 && (
        <GlowCard glowColor="gold" className="p-4 mb-5">
          <p className="text-yellow-400 font-bold text-sm mb-3 flex items-center gap-2">
            <AppEmoji name="trophy" size={16} /> Top Tournaments by Prize
          </p>
          <div className="space-y-2">
            {data.topTournaments.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>{i + 1}</span>
                <span className="text-white text-sm flex-1 truncate">{t.title}</span>
                <span className="text-green-400 text-xs font-bold">₹{t.prize_pool || 0}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Withdrawals & Events */}
      <p className="text-slate-400 text-xs font-bold uppercase mb-3 tracking-wider">Operations</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox label="Pending Withdrawals" value={data.pendingWithdrawals} icon={Coins} color={data.pendingWithdrawals > 0 ? 'red' : 'green'} />
        <StatBox label="Total Withdrawn" value={`₹${data.totalWithdrawn}`} icon={Coins} color="orange" />
        <StatBox label="Active Events" value={data.activeEvents} icon={Calendar} color="purple" sub={`${data.totalEvents} total`} />
        <StatBox label="Pending Forms" value={data.pendingForms} icon={Users} color={data.pendingForms > 0 ? 'yellow' : 'green'} />
      </div>

      {/* Quick Actions */}
      <GlowCard glowColor="cyan" className="p-4">
        <p className="text-cyan-400 font-bold text-sm mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <GamingButton variant="outline" size="sm" onClick={() => navigate(createPageUrl('AdminTournaments'))}>Tournaments</GamingButton>
          <GamingButton variant="outline" size="sm" onClick={() => navigate(createPageUrl('AdminUsers'))}>Users</GamingButton>
          <GamingButton variant="outline" size="sm" onClick={() => navigate(createPageUrl('AdminWithdrawals'))}>Withdrawals</GamingButton>
          <GamingButton variant="primary" size="sm" onClick={() => loadData(true)}>Refresh Data</GamingButton>
        </div>
      </GlowCard>
    </div>
  );
}
