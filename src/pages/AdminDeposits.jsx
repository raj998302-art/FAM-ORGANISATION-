import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Coins, ChevronLeft, Check, X, Clock, Crown, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ALLOWED_ROLES = ['owner','co_owner','fam_manager','head_admin','senior_chief_admin','chief_admin','senior_admin','admin','head_payment_manager','senior_payment_manager','payment_manager'];
const VIP_PLANS = { vip_weekly: 'VIP Weekly', vip_plus_monthly: 'VIP+ Monthly', vip_elite_monthly: 'VIP Elite' };

import { hasPaymentAccess } from '@/lib/roles';

export default function AdminDeposits() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [vipDeposits, setVipDeposits] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [tab, setTab] = useState('deposits');
  const [showManualDeposit, setShowManualDeposit] = useState(false);
  const [manualForm, setManualForm] = useState({ user_email: '', amount: '', note: '' });
  const [manualProcessing, setManualProcessing] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const user = await apiClient.auth.me();
    if (!hasPaymentAccess(user)) {
      navigate(createPageUrl('Home'));
      return;
    }
    await loadData();
  };

  const loadData = async () => {
    try {
      const all = await apiClient.entities.Transaction.list('-created_date', 300);
      setDeposits(all.filter(t => t.type === 'deposit'));
      setVipDeposits(all.filter(t => t.type === 'vip_subscription'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const approveDeposit = async (txn) => {
    setProcessingId(txn.id);
    try {
      const currentUser = await apiClient.auth.me();
      const wallets = await apiClient.entities.Wallet.filter({ user_email: txn.user_email });
      if (!wallets.length) { toast.error('Wallet not found'); setProcessingId(null); return; }
      const wallet = wallets[0];

      await Promise.all([
        apiClient.entities.Transaction.update(txn.id, {
          status: 'completed',
          processed_by: currentUser.email,
          processed_at: new Date().toISOString()
        }),
        apiClient.entities.Wallet.update(wallet.id, {
          balance: (wallet.balance || 0) + txn.amount,
          total_deposited: (wallet.total_deposited || 0) + txn.amount
        }),
        apiClient.entities.Notification.create({
          user_id: txn.user_id,
          user_email: txn.user_email,
          title: 'Deposit Approved!',
          message: `Your deposit of ₹${txn.amount} has been approved and coins added to your wallet!`,
          type: 'system'
        })
      ]);
      toast.success(`₹${txn.amount} approved & credited!`);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectDeposit = async (txn) => {
    setProcessingId(txn.id + '_r');
    try {
      const currentUser = await apiClient.auth.me();
      await Promise.all([
        apiClient.entities.Transaction.update(txn.id, {
          status: 'rejected',
          processed_by: currentUser.email,
          processed_at: new Date().toISOString()
        }),
        apiClient.entities.Notification.create({
          user_id: txn.user_id,
          user_email: txn.user_email,
          title: 'Deposit Rejected',
          message: `Your deposit of ₹${txn.amount} (UTR: ${txn.utr_number || 'N/A'}) was rejected. Contact support for help.`,
          type: 'system'
        })
      ]);
      toast.success('Rejected');
      loadData();
    } catch (e) {
      toast.error('Failed');
    } finally {
      setProcessingId(null);
    }
  };

  const approveVIP = async (txn) => {
    setProcessingId(txn.id);
    try {
      const currentUser = await apiClient.auth.me();
      const planLabel = VIP_PLANS[txn.vip_plan] || 'VIP';
      const expiry = new Date();
      if (txn.vip_plan === 'vip_weekly') expiry.setDate(expiry.getDate() + 7);
      else expiry.setMonth(expiry.getMonth() + 1);

      await Promise.all([
        apiClient.entities.Transaction.update(txn.id, {
          status: 'completed',
          processed_by: currentUser.email,
          processed_at: new Date().toISOString()
        }),
        apiClient.entities.Notification.create({
          user_id: txn.user_id,
          user_email: txn.user_email,
          title: `${planLabel} Activated!`,
          message: `Your ${planLabel} subscription is now active until ${expiry.toLocaleDateString()}!`,
          type: 'reward'
        })
      ]);
      toast.success(`VIP activated for ${txn.user_email}!`);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to activate VIP');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
  const pendingVip = vipDeposits.filter(d => d.status === 'pending').length;
  const filtered = (tab === 'deposits' ? deposits : vipDeposits).filter(d => filter === 'all' || d.status === filter);

  if (loading) return <LoadingScreen message="Loading deposits..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div className="flex-1">
          <NeonText color="gold" size="2xl" className="flex items-center gap-2">
            <Coins className="w-7 h-7" /> DEPOSITS & VIP
          </NeonText>
          {(pendingDeposits + pendingVip) > 0 && (
            <p className="text-sm text-orange-400">{pendingDeposits + pendingVip} pending approvals</p>
          )}
        </div>
        <button onClick={() => setShowManualDeposit(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold hover:bg-green-500/40 transition-all">
          <Plus className="w-4 h-4" /> Manual
        </button>
      </div>

      {/* Manual Deposit Dialog */}
      <Dialog open={showManualDeposit} onOpenChange={setShowManualDeposit}>
        <DialogContent className="bg-slate-900 border border-green-500/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2"><Plus className="w-5 h-5" /> Manual Coin Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Directly add coins to a user's wallet. This action is logged.</p>
            <Input value={manualForm.user_email} onChange={e => setManualForm(f => ({ ...f, user_email: e.target.value }))}
              placeholder="User Email *" className="bg-slate-800 border-slate-700 text-white" />
            <Input type="number" value={manualForm.amount} onChange={e => setManualForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="Amount (₹) *" className="bg-slate-800 border-slate-700 text-white" />
            <Textarea value={manualForm.note} onChange={e => setManualForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Note / Reason (optional)" className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} />
            <GamingButton variant="primary" className="w-full" disabled={manualProcessing}
              onClick={async () => {
                if (!manualForm.user_email || !manualForm.amount) { toast.error('Email and amount required'); return; }
                setManualProcessing(true);
                try {
                  const result = await apiClient.admin.manualDeposit(manualForm.user_email, Number(manualForm.amount), manualForm.note);
                  toast.success(`₹${manualForm.amount} added! New balance: ₹${result.new_balance}`);
                  setShowManualDeposit(false);
                  setManualForm({ user_email: '', amount: '', note: '' });
                  loadData();
                } catch (e) { toast.error(e.message); }
                finally { setManualProcessing(false); }
              }}>
              {manualProcessing ? 'Adding...' : `Add ₹${manualForm.amount || 0} Coins`}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tab Toggle */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setTab('deposits')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'deposits' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-slate-800/50 text-slate-400 border border-slate-700'}`}
        >
          <Coins className="w-4 h-4" />
          Deposits {pendingDeposits > 0 && <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingDeposits}</span>}
        </button>
        <button
          onClick={() => setTab('vip')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'vip' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-slate-800/50 text-slate-400 border border-slate-700'}`}
        >
          <Crown className="w-4 h-4" />
          VIP {pendingVip > 0 && <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingVip}</span>}
        </button>
      </div>

      {/* Status Filter */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="w-full bg-slate-900/50 border border-slate-700 p-1 h-auto grid grid-cols-3">
          <TabsTrigger value="pending" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-slate-400 py-2 text-sm">Pending</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-slate-400 py-2 text-sm">Approved</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 py-2 text-sm">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((txn, index) => (
          <motion.div key={txn.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <GlowCard glowColor={txn.status === 'pending' ? 'orange' : txn.status === 'completed' ? 'green' : 'red'} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      txn.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                      txn.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{txn.status}</span>
                    {txn.vip_plan && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400">
                        {VIP_PLANS[txn.vip_plan] || txn.vip_plan}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white">₹{txn.amount}</p>
                  <p className="text-xs text-slate-400 mt-1 break-all">{txn.user_email}</p>
                  {txn.utr_number && <p className="text-xs text-cyan-400 font-mono mt-0.5">UTR: {txn.utr_number}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(txn.created_date).toLocaleString()}</p>
                  {txn.processed_by && <p className="text-xs text-slate-500">Processed by: {txn.processed_by}</p>}
                </div>
              </div>

              {txn.status === 'pending' && (
                <div className="flex gap-2">
                  <GamingButton
                    variant="success" size="sm" className="flex-1"
                    loading={processingId === txn.id}
                    disabled={!!processingId}
                    onClick={() => tab === 'vip' ? approveVIP(txn) : approveDeposit(txn)}
                    icon={Check}
                  >
                    Approve
                  </GamingButton>
                  <GamingButton
                    variant="danger" size="sm" className="flex-1"
                    loading={processingId === txn.id + '_r'}
                    disabled={!!processingId}
                    onClick={() => rejectDeposit(txn)}
                    icon={X}
                  >
                    Reject
                  </GamingButton>
                </div>
              )}
            </GlowCard>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <GlowCard glowColor="cyan" className="p-8 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No {filter !== 'all' ? filter : ''} {tab === 'vip' ? 'VIP' : 'deposit'} requests</p>
          </GlowCard>
        )}
      </div>
    </div>
  );
}