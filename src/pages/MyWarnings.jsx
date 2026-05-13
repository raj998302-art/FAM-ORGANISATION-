import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertTriangle, Shield, CheckCircle, MessageSquare, Clock, Coins } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const WARN_REMOVAL_COST = 500;

const WARN_LEVELS = {
  1: { label: '1st Warning',              color: 'text-yellow-400', border: 'border-yellow-500/40 bg-yellow-500/10', glow: 'gold'   },
  2: { label: '2nd Warning — Final',       color: 'text-orange-400', border: 'border-orange-500/40 bg-orange-500/10', glow: 'orange' },
  3: { label: '3rd Warning — Account Risk',color: 'text-red-400',    border: 'border-red-500/40 bg-red-500/10',       glow: 'red'    },
};

export default function MyWarnings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appealModal, setAppealModal] = useState(null);
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      const [warns, wallets, userAppeals] = await Promise.all([
        apiClient.entities.UserWarning.filter({ user_email: cu.email }, '-issued_at', 20).catch(() => []),
        apiClient.entities.Wallet.filter({ user_email: cu.email }).catch(() => []),
        apiClient.entities.WarningAppeal.filter({ user_email: cu.email }, '-created_date', 20).catch(() => []),
      ]);
      setWarnings(Array.isArray(warns) ? warns : []);
      setWallet(wallets[0] || null);
      setAppeals(Array.isArray(userAppeals) ? userAppeals : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const activeWarnings = warnings.filter(w => w.status === 'active');
  const removedWarnings = warnings.filter(w => w.status !== 'active');

  // Today's appeal check — only 1 free appeal per day
  const todayKey = new Date().toISOString().slice(0, 10);
  const appealedToday = appeals.some(a => a.created_date?.startsWith(todayKey));

  const removeWithCoins = async (warning) => {
    const balance = wallet?.balance || 0;
    if (balance < WARN_REMOVAL_COST) {
      toast.error(`Need ₹${WARN_REMOVAL_COST} coins. You have ₹${balance}.`);
      navigate(createPageUrl('Wallet'));
      return;
    }
    setRemovingId(warning.id);
    try {
      // Deduct coins
      await apiClient.entities.Wallet.update(wallet.id, { balance: balance - WARN_REMOVAL_COST });
      // Log transaction
      await apiClient.entities.Transaction.create({
        user_email: user.email,
        type: 'debit',
        amount: WARN_REMOVAL_COST,
        description: `Warning removal (Warning #${warning.warning_number})`,
        status: 'completed',
        created_date: new Date().toISOString(),
      });
      // Remove warning
      await apiClient.entities.UserWarning.update(warning.id, {
        status: 'removed_by_coins',
        removed_at: new Date().toISOString(),
        removed_method: 'coins',
      });
      toast.success(`Warning #${warning.warning_number} removed! ₹${WARN_REMOVAL_COST} deducted.`);
      await loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to remove warning');
    } finally { setRemovingId(null); }
  };

  const submitAppeal = async () => {
    if (!appealText.trim() || appealText.trim().length < 30) {
      toast.error('Write at least 30 characters explaining your appeal.');
      return;
    }
    if (appealedToday) {
      toast.error('You can only submit 1 free appeal per day.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.entities.WarningAppeal.create({
        user_email: user.email,
        warning_id: appealModal.id,
        warning_number: appealModal.warning_number,
        warning_reason: appealModal.reason,
        appeal_text: appealText.trim(),
        status: 'pending',
        created_date: new Date().toISOString(),
      });
      // Notify admins via broadcast
      await apiClient.entities.Notification.create({
        user_email: 'raj998302@gmail.com',
        title: 'Warning Appeal Submitted',
        message: `${user.email} has submitted an appeal for Warning #${appealModal.warning_number} (${appealModal.reason}).`,
        type: 'system', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Appeal submitted! Admin will review within 24–48 hours.');
      setAppealModal(null);
      setAppealText('');
      await loadData();
    } catch (e) {
      toast.error(e.message || 'Failed to submit appeal');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen message="Loading your warnings..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="red" size="2xl" className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" /> MY WARNINGS
        </NeonText>
      </div>

      {/* Status card */}
      <GlowCard glowColor={activeWarnings.length === 0 ? 'green' : activeWarnings.length >= 3 ? 'red' : 'orange'} className="p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            activeWarnings.length === 0 ? 'bg-green-500/20' : activeWarnings.length >= 3 ? 'bg-red-500/20' : 'bg-orange-500/20'
          }`}>
            {activeWarnings.length === 0
              ? <Shield className="w-8 h-8 text-green-400" />
              : <AlertTriangle className={`w-8 h-8 ${activeWarnings.length >= 3 ? 'text-red-400' : 'text-orange-400'}`} />}
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-xl">
              {activeWarnings.length === 0 ? 'Account in Good Standing' :
               activeWarnings.length >= 3 ? 'Account at Risk of Ban!' :
               `${activeWarnings.length} Active Warning${activeWarnings.length > 1 ? 's' : ''}`}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">
              {activeWarnings.length === 0 ? 'Keep following the rules to stay safe!' :
               activeWarnings.length >= 3 ? 'Please resolve your warnings immediately.' :
               `${3 - activeWarnings.length} warning(s) remaining before auto-ban`}
            </p>
          </div>
          {/* Warning dots */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map(n => (
              <div key={n} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                n <= activeWarnings.length ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-500'
              }`}>{n}</div>
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Removal options info */}
      <GlowCard glowColor="cyan" className="p-4 mb-5">
        <p className="text-cyan-400 font-bold text-sm mb-2">How to Remove a Warning</p>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <AppEmoji name="coins" size={16} />
            <span>Spend <strong className="text-yellow-400">₹{WARN_REMOVAL_COST} coins</strong> to instantly remove 1 warning</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Submit a <strong className="text-purple-400">free appeal</strong> (1 per day) — admin reviews in 24–48 hrs</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Warnings may expire after 90 days of good behaviour (admin discretion)</span>
          </div>
        </div>
        <div className="mt-3 p-2.5 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400">Your balance: <strong className="text-yellow-400">₹{wallet?.balance || 0}</strong>
            {wallet?.balance >= WARN_REMOVAL_COST ? <span className="text-green-400 ml-2">✓ Enough to remove a warning</span>
              : <span className="text-red-400 ml-2">Need ₹{WARN_REMOVAL_COST - (wallet?.balance || 0)} more</span>}
          </p>
        </div>
      </GlowCard>

      {/* Active warnings */}
      {activeWarnings.length > 0 && (
        <div className="mb-6">
          <p className="text-slate-400 text-xs font-bold uppercase mb-3">Active Warnings</p>
          <div className="space-y-4">
            {activeWarnings.map(w => {
              const cfg = WARN_LEVELS[w.warning_number] || WARN_LEVELS[3];
              const appealForThis = appeals.find(a => a.warning_id === w.id && a.status === 'pending');

              return (
                <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <GlowCard glowColor={cfg.glow} className={`p-4 border ${cfg.border}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                        <p className="text-white font-bold mt-1">{w.reason}</p>
                        {w.details && <p className="text-slate-400 text-xs mt-0.5">{w.details}</p>}
                        <p className="text-slate-600 text-xs mt-1">
                          {w.issued_at ? new Date(w.issued_at).toLocaleDateString('en-IN') : '—'} · By admin
                        </p>
                      </div>
                      <AlertTriangle className={`w-6 h-6 ${cfg.color} flex-shrink-0`} />
                    </div>

                    {w.proof_url && (
                      <a href={w.proof_url} target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 text-xs underline block mb-3">View proof screenshot</a>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <GamingButton
                        variant="gold"
                        size="sm"
                        loading={removingId === w.id}
                        onClick={() => removeWithCoins(w)}
                        className="flex-1"
                      >
                        <AppEmoji name="coins" size={14} className="inline mr-1" />
                        Remove (₹{WARN_REMOVAL_COST})
                      </GamingButton>

                      {!appealForThis && (
                        <GamingButton
                          variant="outline"
                          size="sm"
                          disabled={appealedToday}
                          onClick={() => { setAppealModal(w); setAppealText(''); }}
                          className="flex-1"
                        >
                          {appealedToday ? 'Appealed Today' : 'Appeal (Free)'}
                        </GamingButton>
                      )}

                      {appealForThis && (
                        <div className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 text-xs font-bold">Appeal Pending</span>
                        </div>
                      )}
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved warnings */}
      {removedWarnings.length > 0 && (
        <div className="mb-6">
          <p className="text-slate-400 text-xs font-bold uppercase mb-3">Resolved Warnings</p>
          <div className="space-y-3">
            {removedWarnings.map(w => (
              <GlowCard key={w.id} glowColor="green" className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm">{w.reason}</p>
                    <p className="text-green-400 text-xs mt-0.5">
                      {w.status === 'revoked' ? 'Revoked by admin' :
                       w.status === 'removed_by_coins' ? `Removed (spent ₹${WARN_REMOVAL_COST} coins)` :
                       w.status === 'removed_by_appeal' ? 'Removed by appeal' : 'Resolved'}
                    </p>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {activeWarnings.length === 0 && removedWarnings.length === 0 && (
        <div className="text-center py-16">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-3 opacity-70" />
          <p className="text-green-400 font-bold text-lg">Clean Record!</p>
          <p className="text-slate-400 text-sm mt-1">Keep playing fair and stay warning-free.</p>
        </div>
      )}

      {/* Appeal Dialog */}
      <Dialog open={!!appealModal} onOpenChange={() => setAppealModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" /> Submit Appeal
            </DialogTitle>
          </DialogHeader>
          {appealModal && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-400 text-xs">Appealing Warning #{appealModal.warning_number}</p>
                <p className="text-white font-semibold text-sm">{appealModal.reason}</p>
              </div>
              <div>
                <Label className="text-slate-300 block mb-2">Your Appeal (min 30 characters) *</Label>
                <Textarea
                  value={appealText}
                  onChange={e => setAppealText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                  placeholder="Explain clearly why this warning should be removed. Be honest and provide any context that supports your case..."
                />
                <p className="text-slate-600 text-xs mt-1">{appealText.length}/30 minimum</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-400">
                <strong>Important:</strong> You can only submit 1 free appeal per day. Admin will review in 24–48 hours.
                If appeal is rejected, the warning stays active.
              </div>
              <div className="flex gap-3">
                <GamingButton variant="outline" className="flex-1" onClick={() => setAppealModal(null)}>Cancel</GamingButton>
                <GamingButton variant="purple" className="flex-1" loading={submitting} onClick={submitAppeal}>Submit Appeal</GamingButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
