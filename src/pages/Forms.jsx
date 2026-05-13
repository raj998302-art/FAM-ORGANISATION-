import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, CheckCircle, Clock, XCircle, AlertCircle, FileText, Users, Shield, ArrowUp, Lock } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import RoleBadge from '../components/ui/RoleBadge';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { STAFF_HIERARCHY, PROTECTED_ROLES, getPromotionTarget, getRoleLabel } from '../lib/staffHierarchy';

// ─── IMPORTANT RULES ──────────────────────────────────────────────────────────
// • ONLY Tournament Manager can be applied for (entry-level)
// • Sr. TM, Head TM: Promotion only (via PromotionTasks page)
// • FAM Manager, Co-Owner, Owner: OWNER-ASSIGNED ONLY — cannot apply
// • Other ops roles (Moderator, Payment, Community, Technical) can apply


// ─── Role Definitions ─────────────────────────────────────────────────────────
const APPLY_ROLES = [
  {
    id: 'moderator',
    title: 'Moderator',
    emoji: 'target',
    color: 'cyan',
    description: 'Moderate community chats, enforce rules, handle reports.',
    requirements: ['Active FAM member for 30+ days', 'Good communication skills', 'Available 2+ hours/day'],
    questions: [
      { id: 'q1', label: 'What is your IGN (In-Game Name) and Free Fire UID?', type: 'text', placeholder: 'IGN: [name], UID: [number]' },
      { id: 'q2', label: 'How many hours per day can you dedicate to moderation?', type: 'select', options: ['1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'] },
      { id: 'q3', label: 'Have you moderated any Discord server, Telegram group, or gaming community before? Describe your experience.', type: 'textarea', placeholder: 'Yes/No + details...' },
      { id: 'q4', label: 'How would you handle a toxic player harassing others in public chat?', type: 'textarea', placeholder: 'Describe your approach...' },
      { id: 'q5', label: 'Why do you want to join as a Moderator in FAM?', type: 'textarea', placeholder: 'Your motivation...' },
    ]
  },
  {
    id: 'tournament_manager',
    title: 'Tournament Manager',
    emoji: 'trophy',
    color: 'gold',
    description: 'Create and manage tournaments, verify results, resolve disputes.',
    requirements: ['100+ tournament matches played', 'Understanding of Free Fire MAX rules', 'Available during match timings'],
    questions: [
      { id: 'q1', label: 'What is your IGN and Free Fire UID?', type: 'text', placeholder: 'IGN: [name], UID: [number]' },
      { id: 'q2', label: 'How many FAM tournaments have you participated in?', type: 'select', options: ['1-5', '6-15', '16-30', '30+'] },
      { id: 'q3', label: 'Do you have experience organizing or managing gaming tournaments? Describe.', type: 'textarea', placeholder: 'Your experience...' },
      { id: 'q4', label: 'How would you resolve a dispute between two players about match results?', type: 'textarea', placeholder: 'Describe your process...' },
      { id: 'q5', label: 'What time slots are you available for managing tournaments?', type: 'text', placeholder: 'e.g. 6PM-10PM IST daily' },
      { id: 'q6', label: 'Why should FAM choose you as Tournament Manager?', type: 'textarea', placeholder: 'Your pitch...' },
    ]
  },
  {
    id: 'payment_manager',
    title: 'Payment Manager',
    emoji: 'coins',
    color: 'green',
    description: 'Process deposit verifications, handle withdrawal approvals.',
    requirements: ['Trusted member 60+ days', 'Responsible and detail-oriented', 'Available during payment hours'],
    questions: [
      { id: 'q1', label: 'What is your IGN and Free Fire UID?', type: 'text', placeholder: 'IGN: [name], UID: [number]' },
      { id: 'q2', label: 'Do you have any prior experience handling financial transactions or payments online?', type: 'textarea', placeholder: 'Yes/No + details...' },
      { id: 'q3', label: 'How many hours per day can you be available for processing payments?', type: 'select', options: ['1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'] },
      { id: 'q4', label: 'What would you do if you notice a suspicious or duplicate deposit request?', type: 'textarea', placeholder: 'Describe your action...' },
      { id: 'q5', label: 'Why do you want to be a Payment Manager in FAM?', type: 'textarea', placeholder: 'Your reason...' },
    ]
  },
  {
    id: 'community_manager',
    title: 'Community Manager',
    emoji: 'team',
    color: 'purple',
    description: 'Grow and engage the FAM community, organize events, manage social channels.',
    requirements: ['Strong social skills', 'Creative and proactive', 'Active on social media'],
    questions: [
      { id: 'q1', label: 'What is your IGN and Free Fire UID?', type: 'text', placeholder: 'IGN: [name], UID: [number]' },
      { id: 'q2', label: 'What social media platforms are you active on and how many followers do you have?', type: 'text', placeholder: 'Instagram: 500, YouTube: 200...' },
      { id: 'q3', label: 'Do you have experience managing any community, group, or clan? Describe.', type: 'textarea', placeholder: 'Your experience...' },
      { id: 'q4', label: 'Give one creative idea to grow the FAM community.', type: 'textarea', placeholder: 'Your idea...' },
      { id: 'q5', label: 'What is your preferred language for communication?', type: 'select', options: ['Hindi', 'English', 'Hindi + English', 'Regional language'] },
      { id: 'q6', label: 'Why should FAM choose you as Community Manager?', type: 'textarea', placeholder: 'Your pitch...' },
    ]
  },
  {
    id: 'technical_manager',
    title: 'Technical Manager',
    emoji: 'stats',
    color: 'cyan',
    description: 'Handle app bugs, technical support, assist in platform improvements.',
    requirements: ['Basic technical knowledge', 'Problem solver', 'Patient with users'],
    questions: [
      { id: 'q1', label: 'What is your IGN and Free Fire UID?', type: 'text', placeholder: 'IGN: [name], UID: [number]' },
      { id: 'q2', label: 'Do you have any technical background (coding, IT, networking, etc.)?', type: 'textarea', placeholder: 'Yes/No + details...' },
      { id: 'q3', label: 'Have you ever reported a bug or helped solve a technical issue on any platform?', type: 'textarea', placeholder: 'Describe the issue and solution...' },
      { id: 'q4', label: 'A user reports they cannot login after OTP. Walk us through your troubleshooting steps.', type: 'textarea', placeholder: 'Step by step...' },
      { id: 'q5', label: 'Why do you want to be in the Technical Team?', type: 'textarea', placeholder: 'Your reason...' },
    ]
  },
  {
    id: 'vip_tournament_manager',
    title: 'VIP Tournament Manager',
    emoji: 'crown',
    color: 'gold',
    description: 'Manage exclusive VIP-only tournaments and VIP player experience.',
    requirements: ['Must be VIP member', 'Prior tournament experience', 'Excellent service attitude'],
    questions: [
      { id: 'q1', label: 'What is your IGN, UID, and current VIP tier?', type: 'text', placeholder: 'IGN: [name], UID: [number], VIP: [tier]' },
      { id: 'q2', label: 'How many VIP tournaments have you participated in?', type: 'select', options: ['1-5', '6-15', '16-30', '30+'] },
      { id: 'q3', label: 'What makes VIP tournaments different from regular ones, and how would you manage that difference?', type: 'textarea', placeholder: 'Your understanding...' },
      { id: 'q4', label: 'Describe a time you provided excellent service or support to someone.', type: 'textarea', placeholder: 'Your experience...' },
      { id: 'q5', label: 'Why should FAM choose you for the VIP Tournament Manager role?', type: 'textarea', placeholder: 'Your pitch...' },
    ]
  },
];

const STATUS_CONFIG = {
  pending:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Clock,        label: 'Under Review' },
  approved:  { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',   icon: CheckCircle,  label: 'Approved' },
  rejected:  { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',        icon: XCircle,      label: 'Rejected' },
  interview: { color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30',      icon: Users,        label: 'Interview Scheduled' },
  selected:  { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30',  icon: Shield,       label: 'Selected!' },
  bearing:   { color: 'text-gold-400 text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Shield, label: 'Role Granted 🎉' },
};

export default function Forms() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | apply | status
  const [selectedRole, setSelectedRole] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await apiClient.auth.me();
      setUser(u);
      const apps = await apiClient.entities.RoleApplication.filter({ user_email: u.email }).catch(() => []);
      setMyApplications(apps || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startApply = (role) => {
    // Check if already applied for this role
    const existing = myApplications.find(a => a.role_id === role.id && ['pending','approved','interview','selected','bearing'].includes(a.status));
    if (existing) {
      toast.error(`You already have an active application for ${role.title}`);
      return;
    }
    setSelectedRole(role);
    setAnswers({});
    setView('apply');
  };

  const submitApplication = async () => {
    // Validate all questions answered
    for (const q of selectedRole.questions) {
      if (!answers[q.id]?.trim()) {
        toast.error(`Please answer: "${q.label.substring(0, 40)}..."`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await apiClient.entities.RoleApplication.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role_id: selectedRole.id,
        role_title: selectedRole.title,
        answers: JSON.stringify(answers),
        status: 'pending',
        applied_at: new Date().toISOString(),
      });
      toast.success(`Application for ${selectedRole.title} submitted! We'll review within 48 hours.`);
      await loadData();
      setView('list');
    } catch (e) {
      toast.error(e.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading Forms…"/>;

  // ─── Apply View ──────────────────────────────────────────────────────────────
  if (view === 'apply' && selectedRole) {
    return (
      <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-white p-1">
            <ChevronLeft className="w-6 h-6"/>
          </button>
          <div className="flex-1">
            <NeonText color="cyan" size="xl" className="block">Apply: {selectedRole.title}</NeonText>
            <p className="text-slate-400 text-xs">Fill all fields carefully — incomplete forms are rejected</p>
          </div>
          <AppEmoji name={selectedRole.emoji} size={32}/>
        </div>

        {/* Role Info */}
        <GlowCard glowColor={selectedRole.color} className="p-4 mb-4">
          <p className="text-slate-300 text-sm mb-3">{selectedRole.description}</p>
          <div className="space-y-1">
            {selectedRole.requirements.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0"/>
                <span className="text-slate-400 text-xs">{r}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {selectedRole.questions.map((q, i) => (
            <motion.div key={q.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
              <GlowCard glowColor="cyan" className="p-4">
                <label className="block text-white text-sm font-semibold mb-2">
                  <span className="text-cyan-400 mr-1">Q{i+1}.</span> {q.label}
                </label>
                {q.type === 'textarea' ? (
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                    placeholder={q.placeholder}
                    rows={3}
                    className="w-full bg-slate-800/60 border border-slate-700/60 text-white text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-cyan-500/60 placeholder-slate-500"
                  />
                ) : q.type === 'select' ? (
                  <select
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                    className="w-full bg-slate-800/60 border border-slate-700/60 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500/60"
                  >
                    <option value="">— Select one —</option>
                    {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                    placeholder={q.placeholder}
                    className="w-full bg-slate-800/60 border border-slate-700/60 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500/60 placeholder-slate-500"
                  />
                )}
              </GlowCard>
            </motion.div>
          ))}
        </div>

        <GamingButton variant="primary" size="lg" className="w-full" icon={Send} onClick={submitApplication} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Application'}
        </GamingButton>
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
          <ChevronLeft className="w-6 h-6"/>
        </button>
        <div className="flex-1">
          <NeonText color="cyan" size="2xl" className="block">
            <AppEmoji name="forms" size={22} className="inline-block mr-2 align-middle"/>
            Staff Applications
          </NeonText>
          <p className="text-slate-400 text-xs">Apply for a staff role in FAM Organisation</p>
        </div>
      </div>

      {/* My Applications */}
      {myApplications.length > 0 && (
        <section className="mb-6">
          <NeonText color="cyan" size="sm" className="block mb-2">My Applications</NeonText>
          <div className="space-y-2">
            {myApplications.map(app => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const roleInfo = APPLY_ROLES.find(r => r.id === app.role_id);
              return (
                <GlowCard key={app.id} glowColor={app.status === 'bearing' ? 'gold' : 'cyan'} className={`p-3 border ${cfg.bg}`}>
                  <div className="flex items-center gap-3">
                    {roleInfo && <AppEmoji name={roleInfo.emoji} size={28}/>}
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{app.role_title}</p>
                      <p className="text-slate-500 text-xs">{new Date(app.applied_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5"/>
                      {cfg.label}
                    </div>
                  </div>
                  {app.status === 'rejected' && app.reject_reason && (
                    <p className="text-red-400 text-xs mt-2 pl-1">Reason: {app.reject_reason}</p>
                  )}
                  {app.status === 'interview' && app.interview_note && (
                    <div className="mt-2 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-cyan-300 text-xs font-semibold">Interview Note:</p>
                      <p className="text-slate-300 text-xs">{app.interview_note}</p>
                    </div>
                  )}
                  {app.status === 'bearing' && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-green-400 text-xs font-bold">Congratulations! You have been granted the {app.role_title} role.</p>
                    </div>
                  )}
                </GlowCard>
              );
            })}
          </div>
        </section>
      )}

      {/* Hierarchy Info Banner */}
      <GlowCard glowColor="purple" className="p-4 mb-4">
        <p className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2">
          <AppEmoji name="shield" size={16} /> Staff Hierarchy & Rules
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
            Apply below for: Tournament Manager, Moderator, Payment Manager, Community Manager, Technical Manager
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            Sr. Tournament Manager & Head TM: Promotion only (via Promotion Tasks — after 30+ days as TM)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3 h-3 flex-shrink-0 text-red-400" />
            FAM Manager, Co-Owner & Owner: <strong className="text-red-400 ml-1">Owner-assigned only. Cannot apply.</strong>
          </div>
        </div>
        <div className="mt-3 border-t border-slate-700 pt-3 flex items-center gap-2">
          <AppEmoji name="trophy" size={14} />
          <p className="text-xs text-slate-400">
            Already a Tournament Manager?{' '}
            <Link to={createPageUrl('PromotionTasks')} className="text-gold-400 text-yellow-400 font-bold underline">
              View your Promotion Tasks →
            </Link>
          </p>
        </div>
      </GlowCard>

      {/* Available Roles */}
      <NeonText color="cyan" size="sm" className="block mb-3">Available Positions</NeonText>
      <div className="space-y-3">
        {APPLY_ROLES.map((role, i) => {
          const existing = myApplications.find(a => a.role_id === role.id && ['pending','approved','interview','selected','bearing'].includes(a.status));
          return (
            <motion.div key={role.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}>
              <GlowCard glowColor={role.color} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AppEmoji name={role.emoji} size={36}/>
                  <div className="flex-1">
                    <p className="text-white font-black text-base">{role.title}</p>
                    <p className="text-slate-400 text-xs">{role.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">{role.questions.length} questions</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {role.requirements.map((r, ri) => (
                    <span key={ri} className="text-xs px-2 py-0.5 bg-slate-700/60 text-slate-400 rounded-full">{r}</span>
                  ))}
                </div>
                {existing ? (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${STATUS_CONFIG[existing.status]?.bg || ''} ${STATUS_CONFIG[existing.status]?.color || ''}`}>
                    <AlertCircle className="w-4 h-4"/>
                    Already applied — Status: {STATUS_CONFIG[existing.status]?.label || existing.status}
                  </div>
                ) : (
                  <GamingButton variant={role.color === 'gold' ? 'gold' : 'primary'} size="sm" className="w-full" icon={FileText} onClick={() => startApply(role)}>
                    Apply Now
                  </GamingButton>
                )}
              </GlowCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
