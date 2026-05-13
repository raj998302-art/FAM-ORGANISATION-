import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, CheckCircle, XCircle, AlertTriangle, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TABS = [
  { key: 'pending', label: 'Pending Review' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminAntiCheat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proofs, setProofs] = useState([]);
  const [tab, setTab] = useState('pending');
  const [viewProof, setViewProof] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const cu = await apiClient.auth.me();
      if (!cu.panels?.includes('master_panel') && !cu.panels?.includes('moderation_panel')) {
        navigate(createPageUrl('AdminDashboard')); return;
      }
      await loadProofs();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadProofs = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.MatchProof.list('-submitted_at', 200).catch(() => []);
      setProofs(Array.isArray(data) ? data : []);
    } catch { setProofs([]); }
    finally { setLoading(false); }
  };

  const approve = async (proof) => {
    setProcessing(proof.id);
    try {
      await apiClient.entities.MatchProof.update(proof.id, { status: 'approved', reviewed_at: new Date().toISOString() });
      await apiClient.entities.Notification.create({
        user_email: proof.user_email,
        title: 'Match Proof Approved!',
        message: `Your screenshot for "${proof.tournament_name}" has been verified. ${proof.position ? `Position: #${proof.position}.` : ''} ${proof.kills !== undefined ? `Kills: ${proof.kills}.` : ''}`,
        type: 'reward', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Proof approved!');
      loadProofs();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); setViewProof(null); }
  };

  const flag = async (proof) => {
    setProcessing(proof.id);
    try {
      await apiClient.entities.MatchProof.update(proof.id, { status: 'flagged', reviewed_at: new Date().toISOString() });
      await apiClient.entities.Notification.create({
        user_email: proof.user_email,
        title: 'Match Proof Under Anti-Cheat Review',
        message: 'Your screenshot has been flagged for detailed anti-cheat review. Please do not resubmit. We will update you within 24 hours.',
        type: 'system', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Flagged for anti-cheat review');
      loadProofs();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); setViewProof(null); }
  };

  const reject = async (proof) => {
    if (!rejectReason.trim()) { toast.error('Enter rejection reason'); return; }
    setProcessing(proof.id);
    try {
      await apiClient.entities.MatchProof.update(proof.id, {
        status: 'rejected',
        reject_reason: rejectReason.trim(),
        reviewed_at: new Date().toISOString(),
      });
      await apiClient.entities.Notification.create({
        user_email: proof.user_email,
        title: 'Match Proof Rejected',
        message: `Your screenshot for "${proof.tournament_name}" was rejected. Reason: ${rejectReason.trim()}. If you believe this is wrong, contact support.`,
        type: 'system', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Proof rejected with reason sent');
      setRejectReason('');
      setViewProof(null);
      loadProofs();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const filtered = proofs.filter(p => p.status === tab || (tab === 'pending' && !p.status));
  const counts = { pending: proofs.filter(p => p.status === 'pending' || !p.status).length, flagged: proofs.filter(p => p.status === 'flagged').length, approved: proofs.filter(p => p.status === 'approved').length, rejected: proofs.filter(p => p.status === 'rejected').length };

  if (loading) return <LoadingScreen message="Loading proof submissions..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="orange" size="2xl" className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-orange-400" /> ANTI-CHEAT
        </NeonText>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {TABS.map(t => (
          <div key={t.key} className="bg-slate-800/50 rounded-xl p-2.5 text-center border border-slate-700/50">
            <p className={`text-lg font-black ${t.key === 'pending' ? 'text-yellow-400' : t.key === 'flagged' ? 'text-orange-400' : t.key === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
              {counts[t.key]}
            </p>
            <p className="text-xs text-slate-500">{t.label.split(' ')[0]}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === t.key ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
            {t.label} {counts[t.key] > 0 && <span className="ml-1 bg-current text-slate-900 text-[10px] font-black px-1 rounded-full">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Proof list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No {tab} submissions</p>
          </div>
        ) : filtered.map((proof, i) => (
          <motion.div key={proof.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlowCard glowColor={proof.status === 'flagged' ? 'orange' : proof.status === 'approved' ? 'green' : proof.status === 'rejected' ? 'red' : 'cyan'} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold">{proof.user_email}</p>
                  <p className="text-slate-400 text-xs">{proof.tournament_name}</p>
                  <div className="flex gap-2 mt-1">
                    {proof.kills !== undefined && <span className="text-xs text-slate-400">Kills: <strong className="text-white">{proof.kills}</strong></span>}
                    {proof.position && <span className="text-xs text-slate-400">Pos: <strong className="text-white">#{proof.position}</strong></span>}
                  </div>
                </div>
                <p className="text-slate-600 text-xs">{proof.submitted_at ? new Date(proof.submitted_at).toLocaleDateString('en-IN') : '—'}</p>
              </div>

              {proof.screenshot_url && (
                <div className="mb-3 relative">
                  <img src={proof.screenshot_url} alt="Proof" className="w-full rounded-xl max-h-36 object-contain border border-slate-700 bg-slate-900"
                    onError={e => { e.target.style.display='none'; }} />
                  <a href={proof.screenshot_url} target="_blank" rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded-lg text-cyan-400 hover:text-cyan-300">
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              )}

              {proof.notes && <p className="text-slate-400 text-xs mb-3 italic">"{proof.notes}"</p>}

              {(tab === 'pending' || tab === 'flagged') && (
                <div className="flex gap-2">
                  <GamingButton variant="green" size="sm" icon={CheckCircle} loading={processing === proof.id} onClick={() => approve(proof)} className="flex-1">Approve</GamingButton>
                  <GamingButton variant="outline" size="sm" icon={AlertTriangle} onClick={() => flag(proof)} className="flex-1">Flag</GamingButton>
                  <GamingButton variant="danger" size="sm" icon={XCircle} onClick={() => { setViewProof(proof); setRejectReason(''); }} className="flex-1">Reject</GamingButton>
                </div>
              )}
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!viewProof && tab !== 'approved'} onOpenChange={() => { setViewProof(null); setRejectReason(''); }}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Proof</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-slate-400 text-sm">{viewProof?.user_email} — {viewProof?.tournament_name}</p>
            <div>
              <label className="text-slate-300 text-sm block mb-2">Rejection Reason (sent to user)</label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="e.g. Screenshot unclear, result not visible, suspected edit..." />
            </div>
            <div className="flex gap-3">
              <GamingButton variant="outline" className="flex-1" onClick={() => setViewProof(null)}>Cancel</GamingButton>
              <GamingButton variant="danger" className="flex-1" loading={processing === viewProof?.id} onClick={() => reject(viewProof)}>Reject & Notify</GamingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
