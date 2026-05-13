import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Coins, CheckCircle, XCircle, Clock, Search, RefreshCw,
  ArrowDownLeft, ArrowUpRight, ChevronLeft, AlertTriangle,
  TrendingUp, DollarSign, Users, Filter
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';

export default function PaymentPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab, setTab] = useState('deposits');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [processing, setProcessing] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('APPROVE_DEPOSITS') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const [txns, withdrawReqs] = await Promise.all([
        apiClient.entities.Transaction.filter({}, '-createdAt', 200),
        apiClient.entities.WithdrawalRequest.filter({}, '-createdAt', 100),
      ]);

      const deps = txns.filter(t => t.type === 'deposit' || t.type === 'manual_deposit');
      setDeposits(deps);
      setWithdrawals(withdrawReqs);

      const pending = withdrawReqs.filter(w => w.status === 'pending').length;
      const approved = withdrawReqs.filter(w => w.status === 'approved').length;
      const total = withdrawReqs.reduce((s, w) => s + (w.amount || 0), 0);
      setStats({ total, pending, approved, rejected: withdrawReqs.filter(w => w.status === 'rejected').length });
    } catch (e) { console.error(e); toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleWithdrawal = async (id, action) => {
    setProcessing(id);
    try {
      await apiClient.entities.WithdrawalRequest.update(id, { status: action });
      if (action === 'approved') {
        const req = withdrawals.find(w => w.id === id);
        if (req) {
          await apiClient.entities.Notification.create({
            user_email: req.user_email,
            title: '✅ Withdrawal Approved!',
            message: `Your withdrawal of ₹${req.amount} via ${req.payment_method} has been approved.`,
            type: 'payment', created_date: new Date().toISOString()
          });
        }
      }
      toast.success(`Withdrawal ${action}`);
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  if (loading) return <LoadingScreen message="Loading Payment Panel..." />;

  const filteredDeposits = deposits.filter(d =>
    (filter === 'all' || d.status === filter) &&
    (!search || d.user_email?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredWithdrawals = withdrawals.filter(w =>
    (filter === 'all' || w.status === filter) &&
    (!search || w.user_email?.toLowerCase().includes(search.toLowerCase()) || w.username?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDeposited = deposits.filter(d => d.status === 'success' || d.status === 'completed').reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="cyan" size="xl">PAYMENT PANEL</NeonText>
            <p className="text-slate-400 text-xs">Manage deposits & withdrawals</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <GlowCard glowColor="cyan" className="p-3 text-center">
            <p className="text-xl font-black text-cyan-400">₹{totalDeposited.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Deposits</p>
          </GlowCard>
          <GlowCard glowColor="orange" className="p-3 text-center">
            <p className="text-xl font-black text-orange-400">{stats.pending}</p>
            <p className="text-xs text-slate-400">Pending Withdrawals</p>
          </GlowCard>
          <GlowCard glowColor="green" className="p-3 text-center">
            <p className="text-xl font-black text-green-400">{stats.approved}</p>
            <p className="text-xs text-slate-400">Approved</p>
          </GlowCard>
          <GlowCard glowColor="red" className="p-3 text-center">
            <p className="text-xl font-black text-red-400">{stats.rejected}</p>
            <p className="text-xs text-slate-400">Rejected</p>
          </GlowCard>
        </div>
      </motion.div>

      {/* Tab + Filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-4">
        <div className="flex gap-2 mb-3">
          {['deposits', 'withdrawals'].map(t => (
            <button key={t} onClick={() => { setTab(t); setFilter('all'); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              {t} {t === 'withdrawals' && stats.pending > 0 && <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.pending}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by email..." className="pl-9 bg-slate-800 border-slate-700 text-white text-sm" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {['all', 'pending', 'success', 'completed', 'rejected'].map(s => (
                <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'deposits' ? (
          <motion.div key="deposits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No deposits found</div>
            ) : (
              <div className="space-y-3">
                {filteredDeposits.map((d, i) => (
                  <motion.div key={d.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlowCard glowColor={d.status === 'success' || d.status === 'completed' ? 'green' : 'cyan'} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.status === 'success' || d.status === 'completed' ? 'bg-green-500/20' : 'bg-cyan-500/20'}`}>
                            <ArrowDownLeft className={`w-5 h-5 ${d.status === 'success' || d.status === 'completed' ? 'text-green-400' : 'text-cyan-400'}`} />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{d.user_email}</p>
                            <p className="text-xs text-slate-400">{d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}</p>
                            {d.payment_id && <p className="text-xs text-slate-500 font-mono">{d.payment_id?.slice(0, 20)}...</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-black">+₹{d.amount}</p>
                          <Badge variant="outline" className={`text-xs ${d.status === 'success' || d.status === 'completed' ? 'text-green-400 border-green-500/50' : 'text-yellow-400 border-yellow-500/50'}`}>
                            {d.status}
                          </Badge>
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="withdrawals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No withdrawal requests</div>
            ) : (
              <div className="space-y-3">
                {filteredWithdrawals.map((w, i) => (
                  <motion.div key={w.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlowCard glowColor={w.status === 'pending' ? 'orange' : w.status === 'approved' ? 'green' : 'red'} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${w.status === 'pending' ? 'bg-orange-500/20' : w.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <ArrowUpRight className={`w-5 h-5 ${w.status === 'pending' ? 'text-orange-400' : w.status === 'approved' ? 'text-green-400' : 'text-red-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{w.username || w.user_email}</p>
                            <p className="text-xs text-slate-400 truncate">{w.user_email}</p>
                            <p className="text-xs text-slate-400">{w.payment_method} • {w.payment_details}</p>
                            <p className="text-xs text-slate-500">{w.created_date ? new Date(w.created_date).toLocaleString() : ''}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-orange-400 font-black">₹{w.amount}</p>
                          <Badge variant="outline" className={`text-xs mb-2 ${w.status === 'pending' ? 'text-orange-400 border-orange-500/50' : w.status === 'approved' ? 'text-green-400 border-green-500/50' : 'text-red-400 border-red-500/50'}`}>
                            {w.status}
                          </Badge>
                          {w.status === 'pending' && (
                            <div className="flex gap-1 mt-1">
                              <button disabled={processing === w.id} onClick={() => handleWithdrawal(w.id, 'approved')}
                                className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/50 hover:bg-green-500/40 transition-all">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </button>
                              <button disabled={processing === w.id} onClick={() => handleWithdrawal(w.id, 'rejected')}
                                className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 transition-all">
                                <XCircle className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
