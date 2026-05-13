import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Upload, CheckCircle, Clock, XCircle, Send, Trophy, Star, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import RoleBadge from '../components/ui/RoleBadge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  STAFF_HIERARCHY, PROMOTION_TASKS, getPromotionTarget,
  getRoleLabel, getRoleColor, isProtectedRole
} from '../lib/staffHierarchy';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-500/20',
  approved: 'text-green-400 bg-green-500/20',
  rejected: 'text-red-400 bg-red-500/20',
};

export default function PromotionTasks() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [submitting, setSubmitting] = useState(null);
  const [proofs, setProofs] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      const [profiles, subs] = await Promise.all([
        apiClient.entities.UserProfile.filter({ user_email: currentUser.email }),
        apiClient.entities.PromotionSubmission.filter({ user_email: currentUser.email }),
      ]);
      setProfile(profiles[0] || null);
      setSubmissions(Array.isArray(subs) ? subs : []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const getCurrentRole = () => {
    const roles = user?.roles || [];
    // Find highest staff role
    const ordered = ['senior_tournament_manager', 'tournament_manager'];
    return ordered.find(r => roles.includes(r)) || null;
  };

  const currentRole = getCurrentRole();
  const promotionTarget = currentRole ? getPromotionTarget(currentRole) : null;
  const tasks = promotionTarget ? (PROMOTION_TASKS[promotionTarget] || []) : [];

  const getSubmission = (taskId) => submissions.find(s => s.task_id === taskId);

  const submitProof = async (task) => {
    const proof = proofs[task.id];
    if (!proof?.trim()) {
      toast.error('Please provide your proof before submitting');
      return;
    }
    setSubmitting(task.id);
    try {
      await apiClient.entities.PromotionSubmission.create({
        user_email: user.email,
        username: profile?.username || user.email,
        current_role: currentRole,
        target_role: promotionTarget,
        task_id: task.id,
        task_title: task.title,
        proof_type: task.proof_type,
        proof_content: proof.trim(),
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      toast.success('Proof submitted! Waiting for approval from senior staff.');
      setProofs(p => ({ ...p, [task.id]: '' }));
      await loadData();
    } catch (e) {
      toast.error('Failed to submit: ' + e.message);
    } finally { setSubmitting(null); }
  };

  const allTasksApproved = tasks.length > 0 && tasks.every(t => {
    const sub = getSubmission(t.id);
    return sub?.status === 'approved';
  });

  const requestPromotion = async () => {
    if (!allTasksApproved) { toast.error('All tasks must be approved first.'); return; }
    try {
      await apiClient.entities.PromotionRequest.create({
        user_email: user.email,
        username: profile?.username || user.email,
        current_role: currentRole,
        target_role: promotionTarget,
        status: 'pending',
        requested_at: new Date().toISOString(),
        tasks_completed: tasks.map(t => t.id),
      });
      // Notify admins
      await apiClient.admin.broadcastNotification(
        `Promotion Request: ${profile?.username}`,
        `${profile?.username || user.email} has completed all tasks for ${getRoleLabel(promotionTarget)} and is requesting promotion from ${getRoleLabel(currentRole)}.`,
        'broadcast'
      );
      toast.success('Promotion request sent! Senior staff will review and approve.');
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading promotion tasks..." />;

  const isStaff = currentRole !== null;
  const hasPromoPath = promotionTarget && !isProtectedRole(promotionTarget);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="gold" size="2xl" className="flex items-center gap-2">
          <AppEmoji name="trophy" size={26} /> PROMOTION TASKS
        </NeonText>
      </div>

      {/* Not staff */}
      {!isStaff && (
        <GlowCard glowColor="orange" className="p-8 text-center">
          <AppEmoji name="target" size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-white font-bold text-lg mb-2">No Staff Role Found</p>
          <p className="text-slate-400 text-sm mb-4">Apply for Tournament Manager first to start your staff journey!</p>
          <GamingButton variant="primary" onClick={() => navigate(createPageUrl('Forms'))}>Apply for Staff</GamingButton>
        </GlowCard>
      )}

      {/* Has staff role */}
      {isStaff && (
        <>
          {/* Current Role Card */}
          <GlowCard glowColor={getRoleColor(currentRole)} className="p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-${getRoleColor(currentRole)}-500/20 border border-${getRoleColor(currentRole)}-500/30 flex items-center justify-center`}>
                <AppEmoji name="shield" size={30} />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs mb-1">Current Role</p>
                <p className="text-white font-black text-xl">{getRoleLabel(currentRole)}</p>
                {promotionTarget && (
                  <div className="flex items-center gap-2 mt-1">
                    <ArrowUp className="w-3 h-3 text-green-400" />
                    <p className="text-green-400 text-xs font-semibold">Next: {getRoleLabel(promotionTarget)}</p>
                  </div>
                )}
              </div>
              <RoleBadge role={currentRole} />
            </div>
          </GlowCard>

          {/* No promotion path */}
          {!hasPromoPath && (
            <GlowCard glowColor="gold" className="p-6 text-center">
              <AppEmoji name="crown" size={48} className="mx-auto mb-3" />
              <p className="text-white font-bold">You're at the highest promotable rank!</p>
              <p className="text-slate-400 text-sm mt-1">Further promotions are assigned directly by the Owner.</p>
            </GlowCard>
          )}

          {/* Promotion tasks */}
          {hasPromoPath && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-300 font-bold text-sm">Tasks for {getRoleLabel(promotionTarget)}</p>
                <p className="text-slate-400 text-xs">{tasks.filter(t => getSubmission(t.id)?.status === 'approved').length}/{tasks.length} approved</p>
              </div>

              {/* Progress bar */}
              <div className="bg-slate-800 rounded-full h-2 mb-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(tasks.filter(t => getSubmission(t.id)?.status === 'approved').length / tasks.length) * 100}%` }}
                />
              </div>

              <div className="space-y-4">
                {tasks.map((task, i) => {
                  const sub = getSubmission(task.id);
                  const isApproved = sub?.status === 'approved';
                  const isPending = sub?.status === 'pending';
                  const isRejected = sub?.status === 'rejected';

                  return (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <GlowCard glowColor={isApproved ? 'green' : isPending ? 'gold' : isRejected ? 'red' : 'cyan'} className="p-4">
                        {/* Task header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                              isApproved ? 'bg-green-500/20 text-green-400' :
                              isPending ? 'bg-yellow-500/20 text-yellow-400' :
                              isRejected ? 'bg-red-500/20 text-red-400' :
                              'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {isApproved ? <CheckCircle className="w-5 h-5" /> : isPending ? <Clock className="w-5 h-5" /> : isRejected ? <XCircle className="w-5 h-5" /> : i + 1}
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">{task.title}</p>
                              {sub?.status && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_COLORS[sub.status] || ''}`}>
                                  {sub.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-400 text-sm mb-3 leading-relaxed">{task.description}</p>
                        <p className="text-xs text-slate-500 mb-4 italic">Proof: {task.proof_hint}</p>

                        {/* Already approved */}
                        {isApproved && (
                          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Task approved!
                            </p>
                            {sub?.approved_by && <p className="text-slate-400 text-xs mt-1">By: {sub.approved_by}</p>}
                          </div>
                        )}

                        {/* Pending review */}
                        {isPending && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                            <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                              <Clock className="w-4 h-4" /> Under review by senior staff
                            </p>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{sub.proof_content}</p>
                          </div>
                        )}

                        {/* Rejected — can resubmit */}
                        {isRejected && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-3">
                            <p className="text-red-400 text-sm font-semibold">Rejected</p>
                            {sub?.reject_reason && <p className="text-slate-400 text-xs mt-1">Reason: {sub.reject_reason}</p>}
                            <p className="text-slate-500 text-xs mt-1">You can resubmit with better proof.</p>
                          </div>
                        )}

                        {/* Proof submission form */}
                        {!isApproved && !isPending && (
                          <div className="space-y-3">
                            <Label className="text-slate-300">
                              {task.proof_type === 'screenshot' ? 'Paste Image URL / Imgur Link' : 'Your Proof / Explanation'}
                            </Label>
                            {task.proof_type === 'screenshot' ? (
                              <Input
                                value={proofs[task.id] || ''}
                                onChange={e => setProofs(p => ({ ...p, [task.id]: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="https://imgur.com/... or image URL"
                              />
                            ) : (
                              <Textarea
                                value={proofs[task.id] || ''}
                                onChange={e => setProofs(p => ({ ...p, [task.id]: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                                placeholder="Describe your proof in detail..."
                              />
                            )}
                            <GamingButton
                              variant="primary"
                              size="sm"
                              icon={Send}
                              loading={submitting === task.id}
                              onClick={() => submitProof(task)}
                              className="w-full"
                            >
                              Submit Proof
                            </GamingButton>
                          </div>
                        )}
                      </GlowCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Request promotion button */}
              {allTasksApproved && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <GlowCard glowColor="gold" className="p-5 text-center">
                    <AppEmoji name="confetti" size={48} className="mx-auto mb-3" />
                    <p className="text-yellow-400 font-black text-lg mb-1">All tasks approved!</p>
                    <p className="text-slate-300 text-sm mb-4">You're eligible for promotion to {getRoleLabel(promotionTarget)}. Request it now!</p>
                    <GamingButton variant="gold" size="lg" icon={ArrowUp} onClick={requestPromotion}>
                      Request Promotion to {getRoleLabel(promotionTarget)}
                    </GamingButton>
                  </GlowCard>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
