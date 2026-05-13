import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminWarningAppeals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appeals, setAppeals] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const cu = await apiClient.auth.me();
      if (!cu.panels?.includes('master_panel') && !cu.panels?.includes('moderation_panel')) {
        navigate(createPageUrl('AdminDashboard')); return;
      }
      await loadAppeals();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.WarningAppeal.filter({ status: 'pending' }, '-created_date', 50).catch(() => []);
      setAppeals(Array.isArray(data) ? data : []);
    } catch { setAppeals([]); }
    finally { setLoading(false); }
  };

  const approveAppeal = async (appeal) => {
    setProcessing(appeal.id);
    try {
      // Update appeal
      await apiClient.entities.WarningAppeal.update(appeal.id, { status: 'approved', resolved_at: new Date().toISOString() });
      // Remove the warning
      await apiClient.entities.UserWarning.update(appeal.warning_id, { status: 'removed_by_appeal', removed_at: new Date().toISOString() });
      // Notify user
      await apiClient.entities.Notification.create({
        user_email: appeal.user_email,
        title: 'Appeal Approved!',
        message: `Your appeal for Warning #${appeal.warning_number} (${appeal.warning_reason}) has been approved. The warning has been removed.`,
        type: 'reward', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Appeal approved — warning removed');
      loadAppeals();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const rejectAppeal = async () => {
    if (!rejectReason.trim()) { toast.error('Provide a rejection reason'); return; }
    const appeal = rejectModal;
    setProcessing(appeal.id);
    try {
      await apiClient.entities.WarningAppeal.update(appeal.id, {
        status: 'rejected',
        reject_reason: rejectReason.trim(),
        resolved_at: new Date().toISOString(),
      });
      await apiClient.entities.Notification.create({
        user_email: appeal.user_email,
        title: 'Appeal Rejected',
        message: `Your appeal for Warning #${appeal.warning_number} was not approved. Reason: ${rejectReason.trim()}. The warning remains active.`,
        type: 'system', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Appeal rejected with feedback sent');
      setRejectModal(null);
      setRejectReason('');
      loadAppeals();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  if (loading) return <LoadingScreen message="Loading appeals..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="purple" size="2xl" className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> WARNING APPEALS
        </NeonText>
        {appeals.length > 0 && (
          <span className="bg-purple-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{appeals.length}</span>
        )}
      </div>

      {appeals.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">No pending appeals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal, i) => (
            <motion.div key={appeal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlowCard glowColor="purple" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{appeal.user_email}</p>
                    <p className="text-purple-400 text-xs mt-0.5">Appealing Warning #{appeal.warning_number}</p>
                    <p className="text-slate-400 text-xs">{appeal.warning_reason}</p>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl mb-4">
                  <p className="text-slate-300 text-sm leading-relaxed">{appeal.appeal_text}</p>
                </div>
                <p className="text-slate-600 text-xs mb-3">
                  Submitted: {appeal.created_date ? new Date(appeal.created_date).toLocaleString('en-IN') : '—'}
                </p>
                <div className="flex gap-2">
                  <GamingButton variant="green" size="sm" icon={CheckCircle} loading={processing === appeal.id} onClick={() => approveAppeal(appeal)} className="flex-1">
                    Approve — Remove Warning
                  </GamingButton>
                  <GamingButton variant="danger" size="sm" icon={XCircle} onClick={() => { setRejectModal(appeal); setRejectReason(''); }} className="flex-1">
                    Reject
                  </GamingButton>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Appeal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-slate-400 text-sm">{rejectModal?.user_email} — Warning #{rejectModal?.warning_number}</p>
            <div>
              <label className="text-slate-300 text-sm block mb-2">Rejection Reason (sent to user)</label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Explain why the appeal is rejected..." />
            </div>
            <div className="flex gap-3">
              <GamingButton variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</GamingButton>
              <GamingButton variant="danger" className="flex-1" loading={processing === rejectModal?.id} onClick={rejectAppeal}>Send Rejection</GamingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
