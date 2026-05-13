import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, XCircle, ArrowUp, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import RoleBadge from '../components/ui/RoleBadge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getRoleLabel, getRoleColor, canApproveApplication } from '../lib/staffHierarchy';

export default function AdminPromotion() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [promotionRequests, setPromotionRequests] = useState([]);
  const [tab, setTab] = useState('tasks'); // tasks | promotions
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const cu = await apiClient.auth.me();
      // Check access: must be senior staff
      const allowed = ['head_tournament_manager', 'fam_manager', 'co_owner', 'owner', 'master_panel'];
      const hasAccess = cu.panels?.includes('master_panel') ||
        allowed.some(r => cu.roles?.includes(r));
      if (!hasAccess) { navigate(createPageUrl('RolePanel')); return; }
      setUser(cu);
      await loadData();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadData = async () => {
    try {
      const [subs, reqs] = await Promise.all([
        apiClient.entities.PromotionSubmission.filter({ status: 'pending' }, '-submitted_at', 100),
        apiClient.entities.PromotionRequest.filter({ status: 'pending' }, '-requested_at', 50),
      ]);
      setSubmissions(Array.isArray(subs) ? subs : []);
      setPromotionRequests(Array.isArray(reqs) ? reqs : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approveTask = async (sub) => {
    setProcessing(sub.id);
    try {
      await apiClient.entities.PromotionSubmission.update(sub.id, {
        status: 'approved',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
      });
      // Notify the staff member
      await apiClient.entities.Notification.create({
        user_email: sub.user_email,
        title: 'Promotion Task Approved!',
        message: `Your task "${sub.task_title}" has been approved by ${user.full_name || user.email}. Keep going!`,
        type: 'reward', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Task approved!');
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const rejectTask = async () => {
    if (!rejectReason.trim()) { toast.error('Enter a reason'); return; }
    const sub = rejectModal;
    setProcessing(sub.id);
    try {
      await apiClient.entities.PromotionSubmission.update(sub.id, {
        status: 'rejected',
        reject_reason: rejectReason.trim(),
        rejected_by: user.email,
        rejected_at: new Date().toISOString(),
      });
      await apiClient.entities.Notification.create({
        user_email: sub.user_email,
        title: 'Task Needs Improvement',
        message: `Your task "${sub.task_title}" was not approved. Reason: ${rejectReason.trim()}. Please resubmit with better proof.`,
        type: 'system', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Rejected with feedback sent');
      setRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const approvePromotion = async (req) => {
    setProcessing(req.id);
    try {
      await apiClient.entities.PromotionRequest.update(req.id, {
        status: 'approved',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
      });
      // Update user's role via admin endpoint
      await apiClient.admin.promoteUser(req.user_email, req.target_role);
      await apiClient.entities.Notification.create({
        user_email: req.user_email,
        title: `Promoted to ${getRoleLabel(req.target_role)}!`,
        message: `Congratulations! You have been promoted to ${getRoleLabel(req.target_role)} by ${user.full_name || user.email}. Welcome to your new role!`,
        type: 'reward', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success(`${req.username} promoted to ${getRoleLabel(req.target_role)}!`);
      loadData();
    } catch (e) { toast.error('Promotion failed: ' + e.message); }
    finally { setProcessing(null); }
  };

  if (loading) return <LoadingScreen message="Loading promotions..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
          <NeonText color="gold" size="2xl" className="flex items-center gap-2">
            <ArrowUp className="w-7 h-7" /> PROMOTIONS
          </NeonText>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">
            {submissions.length} tasks
          </span>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
            {promotionRequests.length} requests
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['tasks', 'Task Approvals'], ['promotions', 'Promotion Requests']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              tab === t ? 'bg-gold-500/20 border-yellow-400/50 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
            {l} {t === 'tasks' && submissions.length > 0 && <span className="ml-1 bg-yellow-500 text-black text-xs rounded-full px-1.5">{submissions.length}</span>}
          </button>
        ))}
      </div>

      {/* Task submissions */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <AppEmoji name="target" size={64} className="mx-auto mb-3 opacity-30" />
              <p className="text-slate-400">No pending task submissions</p>
            </div>
          ) : submissions.map((sub, i) => (
            <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard glowColor="gold" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <RoleBadge role={sub.current_role} size="sm" />
                      <span className="text-slate-400 text-xs">→</span>
                      <RoleBadge role={sub.target_role} size="sm" />
                    </div>
                    <p className="text-white font-bold">{sub.username || sub.user_email}</p>
                    <p className="text-slate-400 text-xs">{sub.user_email}</p>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl mb-3">
                  <p className="text-slate-300 font-semibold text-sm mb-1">{sub.task_title}</p>
                  <p className="text-slate-400 text-xs mb-2">Type: {sub.proof_type === 'screenshot' ? 'Image URL/Screenshot' : 'Text explanation'}</p>
                  <p className="text-white text-sm break-all">{sub.proof_content}</p>
                  {sub.proof_type === 'screenshot' && sub.proof_content.startsWith('http') && (
                    <img src={sub.proof_content} alt="Proof" className="mt-2 rounded-lg max-h-48 object-contain" onError={e => { e.target.style.display = 'none'; }} />
                  )}
                </div>
                <p className="text-slate-500 text-xs mb-3">
                  Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('en-IN') : '—'}
                </p>
                <div className="flex gap-2">
                  <GamingButton variant="green" size="sm" icon={CheckCircle} loading={processing === sub.id} onClick={() => approveTask(sub)} className="flex-1">Approve</GamingButton>
                  <GamingButton variant="danger" size="sm" icon={XCircle} onClick={() => { setRejectModal(sub); setRejectReason(''); }} className="flex-1">Reject</GamingButton>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Promotion requests */}
      {tab === 'promotions' && (
        <div className="space-y-4">
          {promotionRequests.length === 0 ? (
            <div className="text-center py-12">
              <AppEmoji name="trophy" size={64} className="mx-auto mb-3 opacity-30" />
              <p className="text-slate-400">No pending promotion requests</p>
            </div>
          ) : promotionRequests.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlowCard glowColor="green" className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <ArrowUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{req.username}</p>
                    <p className="text-slate-400 text-xs">{req.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl">
                  <RoleBadge role={req.current_role} />
                  <ArrowUp className="w-4 h-4 text-green-400" />
                  <RoleBadge role={req.target_role} />
                </div>
                <p className="text-slate-400 text-xs mb-4">All {req.tasks_completed?.length || 0} tasks approved ✓</p>
                <GamingButton variant="green" size="lg" icon={CheckCircle} loading={processing === req.id} onClick={() => approvePromotion(req)} className="w-full">
                  Approve Promotion to {getRoleLabel(req.target_role)}
                </GamingButton>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Task Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-slate-400 text-sm">Task: {rejectModal?.task_title}</p>
            <div>
              <label className="text-slate-300 text-sm block mb-2">Reason for rejection (will be sent to staff member)</label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Be specific about what needs improvement..."
              />
            </div>
            <div className="flex gap-3">
              <GamingButton variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</GamingButton>
              <GamingButton variant="danger" className="flex-1" icon={XCircle} loading={processing === rejectModal?.id} onClick={rejectTask}>Send Rejection</GamingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
