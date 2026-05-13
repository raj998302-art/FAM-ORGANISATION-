import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Scale, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_GLOW = { open: 'gold', reviewing: 'cyan', resolved: 'green', rejected: 'red' };

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [tab, setTab] = useState('open');
  const [viewItem, setViewItem] = useState(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const cu = await apiClient.auth.me();
      if (!cu.panels?.includes('master_panel')) { navigate(createPageUrl('AdminDashboard')); return; }
      loadDisputes();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.Dispute.list('-created_date', 100).catch(() => []);
      setDisputes(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const resolve = async (dispute, resolution) => {
    if (!note.trim()) { toast.error('Enter a resolution note for the user'); return; }
    setProcessing(dispute.id);
    try {
      await apiClient.entities.Dispute.update(dispute.id, {
        status: resolution,
        admin_note: note.trim(),
        resolved_at: new Date().toISOString(),
      });
      await apiClient.entities.Notification.create({
        user_email: dispute.user_email,
        title: `Dispute ${resolution === 'resolved' ? 'Resolved' : 'Dismissed'}`,
        message: `Your dispute (${dispute.type}) has been ${resolution}. Admin note: ${note.trim()}`,
        type: resolution === 'resolved' ? 'reward' : 'system',
        is_read: false, created_date: new Date().toISOString(),
      });
      toast.success(`Dispute ${resolution}!`);
      setViewItem(null); setNote('');
      loadDisputes();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const setReviewing = async (dispute) => {
    await apiClient.entities.Dispute.update(dispute.id, { status: 'reviewing' });
    loadDisputes();
  };

  const tabs = ['open','reviewing','resolved','rejected'];
  const filtered = disputes.filter(d => d.status === tab || (tab === 'open' && !d.status));
  const counts = tabs.reduce((a, t) => ({ ...a, [t]: disputes.filter(d => d.status === t || (t === 'open' && !d.status)).length }), {});

  if (loading) return <LoadingScreen message="Loading disputes..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
        <NeonText color="purple" size="2xl" className="flex items-center gap-2">
          <Scale className="w-7 h-7" /> DISPUTES
        </NeonText>
        {counts.open > 0 && <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{counts.open}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all capitalize ${tab === t ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Disputes */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><Scale className="w-14 h-14 text-slate-700 mx-auto mb-3" /><p className="text-slate-400">No {tab} disputes</p></div>
        ) : filtered.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlowCard glowColor={STATUS_GLOW[d.status] || 'gold'} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{d.user_email}</p>
                  <p className="text-slate-400 text-xs">{d.type}</p>
                  {d.tournament_name && <p className="text-slate-500 text-xs">Tournament: {d.tournament_name}</p>}
                  {d.against_user && <p className="text-slate-500 text-xs">Against: {d.against_user}</p>}
                </div>
                <p className="text-slate-600 text-xs flex-shrink-0 ml-2">{d.created_date ? new Date(d.created_date).toLocaleDateString('en-IN') : '—'}</p>
              </div>
              <p className="text-slate-300 text-sm mb-3 leading-relaxed line-clamp-2">{d.description}</p>
              {d.evidence_url && (
                <a href={d.evidence_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs underline block mb-3">View evidence screenshot</a>
              )}
              {d.admin_note && (
                <div className="p-2 bg-slate-800/50 rounded-lg mb-3 text-xs text-slate-400">
                  <strong>Admin note:</strong> {d.admin_note}
                </div>
              )}
              {(tab === 'open' || tab === 'reviewing') && (
                <div className="flex gap-2">
                  {tab === 'open' && (
                    <button onClick={() => setReviewing(d)} className="px-3 py-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-xl flex-1">Mark Reviewing</button>
                  )}
                  <GamingButton variant="green" size="sm" icon={CheckCircle} onClick={() => { setViewItem({ ...d, action: 'resolved' }); setNote(''); }} className="flex-1">Resolve</GamingButton>
                  <GamingButton variant="danger" size="sm" icon={XCircle} onClick={() => { setViewItem({ ...d, action: 'rejected' }); setNote(''); }} className="flex-1">Dismiss</GamingButton>
                </div>
              )}
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Resolution dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => { setViewItem(null); setNote(''); }}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{viewItem?.action === 'resolved' ? 'Resolve Dispute' : 'Dismiss Dispute'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-slate-400 text-sm">{viewItem?.user_email} — {viewItem?.type}</p>
            <div>
              <label className="text-slate-300 text-sm block mb-2">Resolution Note (sent to user) *</label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} className="bg-slate-800 border-slate-700 text-white"
                placeholder={viewItem?.action === 'resolved' ? 'Explain how the issue was resolved...' : 'Explain why the dispute was dismissed...'} />
            </div>
            <div className="flex gap-3">
              <GamingButton variant="outline" className="flex-1" onClick={() => setViewItem(null)}>Cancel</GamingButton>
              <GamingButton variant={viewItem?.action === 'resolved' ? 'green' : 'danger'} className="flex-1"
                loading={processing === viewItem?.id}
                onClick={() => resolve(viewItem, viewItem.action)}>
                {viewItem?.action === 'resolved' ? 'Confirm Resolve' : 'Confirm Dismiss'}
              </GamingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
