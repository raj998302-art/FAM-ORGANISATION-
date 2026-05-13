import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle, XCircle, Clock, Users, Shield,
  MessageSquare, Eye, Search, Filter
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Pending' },
  approved:  { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',   label: 'Approved' },
  rejected:  { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',        label: 'Rejected' },
  interview: { color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30',      label: 'Interview' },
  selected:  { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30',  label: 'Selected' },
  bearing:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40',  label: 'Role Granted' },
};

const ROLE_EMOJI_MAP = {
  moderator: 'target',
  tournament_manager: 'trophy',
  payment_manager: 'coins',
  community_manager: 'team',
  technical_manager: 'stats',
  vip_tournament_manager: 'crown',
};

export default function AdminForms() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);  // currently viewed app
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Modal state
  const [actionModal, setActionModal] = useState(null); // { type: 'reject'|'interview', appId }
  const [actionNote, setActionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    try {
      const apps = await apiClient.entities.RoleApplication.list('-applied_at', 200).catch(() => []);
      setApplications(apps || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (appId, status, extra = {}) => {
    setProcessing(true);
    try {
      await apiClient.entities.RoleApplication.update(appId, {
        status,
        updated_at: new Date().toISOString(),
        ...extra,
      });
      toast.success(`Application ${STATUS_COLORS[status]?.label || status}!`);
      await loadApps();
      // If we had the app selected, refresh it
      if (selected?.id === appId) {
        const refreshed = applications.find(a => a.id === appId);
        if (refreshed) setSelected({ ...refreshed, status, ...extra });
      }
      setActionModal(null);
      setActionNote('');
    } catch (e) {
      toast.error(e.message || 'Update failed');
    } finally {
      setProcessing(false);
    }
  };

  // Grant role via admin API after bearing
  const grantRole = async (app) => {
    setProcessing(true);
    try {
      // Get target user
      const users = await apiClient.admin.getUsers();
      const targetUser = users.find(u => u.email === app.user_email);
      if (!targetUser) throw new Error('User not found');

      const currentRoles = targetUser.roles || [];
      const newRoles = Array.from(new Set([...currentRoles, app.role_id]));
      await apiClient.admin.assignRole(targetUser._id || targetUser.id, newRoles);

      // Mark as bearing
      await updateStatus(app.id, 'bearing', { role_granted_at: new Date().toISOString() });

      // Send notification to user
      await apiClient.entities.Notification.create({
        user_id: targetUser._id || targetUser.id,
        user_email: targetUser.email,
        title: `🎉 Role Granted: ${app.role_title}`,
        message: `Congratulations! Your application for ${app.role_title} has been approved and you have been granted this role in FAM Organisation.`,
        type: 'system'
      });

      toast.success(`🎉 Role ${app.role_title} granted to ${app.user_name}!`);
    } catch (e) {
      toast.error(e.message || 'Failed to grant role');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = applications.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchText && !a.user_name?.toLowerCase().includes(searchText.toLowerCase()) &&
        !a.user_email?.toLowerCase().includes(searchText.toLowerCase()) &&
        !a.role_title?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingScreen message="Loading Applications…"/>;

  // ─── Detail View ─────────────────────────────────────────────────────────────
  if (selected) {
    const cfg = STATUS_COLORS[selected.status] || STATUS_COLORS.pending;
    let answers = {};
    try { answers = JSON.parse(selected.answers || '{}'); } catch {}

    return (
      <div className="min-h-screen bg-slate-950 pb-10 px-4 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white p-1">
            <ChevronLeft className="w-6 h-6"/>
          </button>
          <div className="flex-1">
            <NeonText color="cyan" size="xl" className="block">{selected.role_title}</NeonText>
            <p className="text-slate-400 text-xs">{selected.user_name} · {selected.user_email}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</div>
        </div>

        {/* Answers */}
        <div className="space-y-3 mb-5">
          {Object.entries(answers).map(([qId, answer], i) => (
            <GlowCard key={qId} glowColor="cyan" className="p-3">
              <p className="text-cyan-400 text-xs font-bold mb-1">Question {i + 1}</p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{answer}</p>
            </GlowCard>
          ))}
        </div>

        {/* Action Buttons */}
        {selected.status === 'pending' && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <GamingButton variant="primary" size="sm" icon={CheckCircle}
              onClick={() => updateStatus(selected.id, 'approved')} disabled={processing}>
              Approve
            </GamingButton>
            <GamingButton variant="outline" size="sm" icon={XCircle}
              onClick={() => setActionModal({ type: 'reject', appId: selected.id })} disabled={processing}>
              Reject
            </GamingButton>
          </div>
        )}
        {selected.status === 'approved' && (
          <GamingButton variant="primary" size="md" className="w-full mb-3" icon={Users}
            onClick={() => setActionModal({ type: 'interview', appId: selected.id })} disabled={processing}>
            Schedule Interview
          </GamingButton>
        )}
        {selected.status === 'interview' && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <GamingButton variant="primary" size="sm" icon={Shield}
              onClick={() => updateStatus(selected.id, 'selected')} disabled={processing}>
              Select Candidate
            </GamingButton>
            <GamingButton variant="outline" size="sm" icon={XCircle}
              onClick={() => setActionModal({ type: 'reject', appId: selected.id })} disabled={processing}>
              Reject After Interview
            </GamingButton>
          </div>
        )}
        {selected.status === 'selected' && (
          <GlowCard glowColor="gold" className="p-4 mb-3">
            <p className="text-yellow-400 font-bold mb-2">Grant Role (Bearing)</p>
            <p className="text-slate-400 text-xs mb-3">
              This will assign the <strong className="text-white">{selected.role_title}</strong> role to <strong className="text-white">{selected.user_name}</strong> and send them a notification.
            </p>
            <GamingButton variant="gold" size="md" className="w-full" icon={Shield}
              onClick={() => grantRole(selected)} disabled={processing}>
              {processing ? 'Granting Role…' : '🎖️ Grant Role (Bearing)'}
            </GamingButton>
          </GlowCard>
        )}
        {selected.status === 'bearing' && (
          <GlowCard glowColor="gold" className="p-4 mb-3">
            <p className="text-yellow-400 font-bold flex items-center gap-1"><AppEmoji name="shield" size={16}/> Role Successfully Granted</p>
            <p className="text-slate-400 text-xs mt-1">Granted on: {selected.role_granted_at ? new Date(selected.role_granted_at).toLocaleDateString('en-IN') : 'N/A'}</p>
          </GlowCard>
        )}

        {/* Interview note display */}
        {selected.interview_note && (
          <GlowCard glowColor="cyan" className="p-3 mt-2">
            <p className="text-cyan-400 text-xs font-bold">Interview Note:</p>
            <p className="text-slate-300 text-sm">{selected.interview_note}</p>
          </GlowCard>
        )}
        {selected.reject_reason && (
          <GlowCard glowColor="red" className="p-3 mt-2">
            <p className="text-red-400 text-xs font-bold">Rejection Reason:</p>
            <p className="text-slate-300 text-sm">{selected.reject_reason}</p>
          </GlowCard>
        )}

        {/* Action Modal */}
        <AnimatePresence>
          {actionModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
              onClick={() => setActionModal(null)}>
              <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
                transition={{type:'spring',damping:25}}
                className="w-full bg-slate-900 rounded-t-3xl p-6 border-t border-slate-700"
                onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold text-lg mb-4">
                  {actionModal.type === 'reject' ? 'Reject Application' : 'Schedule Interview'}
                </h3>
                <label className="text-slate-400 text-sm block mb-2">
                  {actionModal.type === 'reject' ? 'Reason for rejection (shown to user)' : 'Interview details / instructions'}
                </label>
                <textarea
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  rows={3}
                  placeholder={actionModal.type === 'reject' ? 'e.g. Not enough experience…' : 'e.g. Join our Telegram group, interview on Sunday 8PM…'}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-cyan-500/60 mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => setActionModal(null)} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400">Cancel</button>
                  <GamingButton
                    variant={actionModal.type === 'reject' ? 'outline' : 'primary'}
                    size="md" className="flex-1"
                    onClick={() => {
                      if (actionModal.type === 'reject') {
                        updateStatus(actionModal.appId, 'rejected', { reject_reason: actionNote });
                        setSelected(prev => ({...prev, status:'rejected', reject_reason: actionNote}));
                      } else {
                        updateStatus(actionModal.appId, 'interview', { interview_note: actionNote });
                        setSelected(prev => ({...prev, status:'interview', interview_note: actionNote}));
                      }
                    }}
                    disabled={processing || !actionNote.trim()}>
                    {processing ? '…' : actionModal.type === 'reject' ? 'Reject' : 'Schedule'}
                  </GamingButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────────────
  const counts = {};
  applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  return (
    <div className="min-h-screen bg-slate-950 pb-10 px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
          <ChevronLeft className="w-6 h-6"/>
        </button>
        <div className="flex-1">
          <NeonText color="cyan" size="2xl" className="block">
            <AppEmoji name="forms" size={20} className="inline-block mr-2 align-middle"/>
            Forms Manager
          </NeonText>
          <p className="text-slate-400 text-xs">{applications.length} total applications</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { key: 'pending', label: 'Pending', color: 'text-yellow-400' },
          { key: 'interview', label: 'Interview', color: 'text-cyan-400' },
          { key: 'bearing', label: 'Granted', color: 'text-green-400' },
        ].map(s => (
          <GlowCard key={s.key} glowColor="cyan" className="p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{counts[s.key] || 0}</p>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </GlowCard>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
        <input
          type="text"
          placeholder="Search by name, email, role…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/60 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-cyan-500/60 placeholder-slate-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
        {['all', 'pending', 'approved', 'interview', 'selected', 'rejected', 'bearing'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === s
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
            {s === 'all' ? `All (${applications.length})` : `${STATUS_COLORS[s]?.label} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <GlowCard glowColor="cyan" className="p-8 text-center">
          <AppEmoji name="forms" size={40} className="mx-auto mb-3"/>
          <p className="text-slate-400">No applications found</p>
        </GlowCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => {
            const cfg = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
            const emoji = ROLE_EMOJI_MAP[app.role_id] || 'forms';
            return (
              <motion.div key={app.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                <GlowCard glowColor="cyan" className="p-4 cursor-pointer hover:border-cyan-500/40 transition-all" onClick={() => setSelected(app)}>
                  <div className="flex items-center gap-3">
                    <AppEmoji name={emoji} size={32}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{app.user_name}</p>
                      <p className="text-slate-500 text-xs truncate">{app.role_title}</p>
                      <p className="text-slate-600 text-xs">{new Date(app.applied_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className={`px-2 py-0.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</div>
                      <Eye className="w-4 h-4 text-slate-500"/>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
