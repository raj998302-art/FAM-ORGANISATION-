import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, AlertTriangle, Shield, Ban, CheckCircle,
  Trash2, Eye, Plus, Search, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const WARNING_REASONS = [
  'Cheating / Hacking',
  'Abusive language in chat',
  'Harassment of other players',
  'Sharing fake payment proofs',
  'Account sharing',
  'Leaving tournament matches',
  'Spreading misinformation',
  'Spamming the support chat',
  'Attempting to scam players',
  'Breaking tournament rules',
  'Other (specify in details)',
];

const WARNING_COLORS = {
  1: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40', label: '1st Warning', glow: 'gold' },
  2: { color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40', label: '2nd Warning', glow: 'orange' },
  3: { color: 'text-red-400',    bg: 'bg-red-500/20 border-red-500/40',       label: '3rd Warning (AUTO-BAN)', glow: 'red' },
};

const WARN_REMOVAL_COST = 500; // coins to remove a warning

export default function AdminWarnings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [showIssue, setShowIssue] = useState(false);
  const [viewWarning, setViewWarning] = useState(null);
  const [confirmBan, setConfirmBan] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [form, setForm] = useState({ user_email: '', reason: '', details: '', proof_url: '' });

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const user = await apiClient.auth.me();
      if (!user.panels?.includes('master_panel') && !user.panels?.includes('moderation_panel')) {
        navigate(createPageUrl('AdminDashboard'));
        return;
      }
      await loadWarnings();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadWarnings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.UserWarning.list('-created_date', 200).catch(() => []);
      setWarnings(Array.isArray(data) ? data : []);
    } catch { setWarnings([]); }
    finally { setLoading(false); }
  };

  const issueWarning = async () => {
    if (!form.user_email || !form.reason) {
      toast.error('User email and reason are required');
      return;
    }
    setIssuing(true);
    try {
      // Check existing warnings for this user
      const existing = warnings.filter(w => w.user_email === form.user_email.toLowerCase() && w.status === 'active');
      const warningCount = existing.length + 1;

      // Create warning entity
      await apiClient.entities.UserWarning.create({
        user_email: form.user_email.toLowerCase().trim(),
        reason: form.reason,
        details: form.details,
        proof_url: form.proof_url,
        warning_number: warningCount,
        status: 'active',
        issued_by: (await apiClient.auth.me()).email,
        issued_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });

      // Send notification to user
      await apiClient.entities.Notification.create({
        user_email: form.user_email.toLowerCase().trim(),
        title: `Warning #${warningCount} Issued`,
        message: `You have received Warning #${warningCount} for: ${form.reason}. ${warningCount === 3 ? 'This is your final warning — your account may be banned.' : `You have ${3 - warningCount} warning(s) remaining before auto-ban.`} You can remove a warning by spending ${WARN_REMOVAL_COST} coins or by submitting an appeal.`,
        type: 'system',
        is_read: false,
        created_date: new Date().toISOString(),
      });

      // Auto-ban if 3rd warning
      if (warningCount >= 3) {
        const profiles = await apiClient.entities.UserProfile.filter({ user_email: form.user_email.toLowerCase() }).catch(() => []);
        if (profiles[0]) {
          await apiClient.entities.UserProfile.update(profiles[0].id, {
            is_banned: true,
            ban_reason: `3 warnings accumulated: Latest — ${form.reason}`,
            banned_at: new Date().toISOString(),
          });
          await apiClient.entities.Notification.create({
            user_email: form.user_email.toLowerCase().trim(),
            title: 'Account Banned',
            message: `Your account has been banned after receiving 3 warnings. You may submit an appeal through Support.`,
            type: 'system', is_read: false, created_date: new Date().toISOString(),
          });
          toast.error(`User has been AUTO-BANNED after 3rd warning!`);
        }
      } else {
        toast.success(`Warning #${warningCount} issued to ${form.user_email}`);
      }

      setShowIssue(false);
      setForm({ user_email: '', reason: '', details: '', proof_url: '' });
      await loadWarnings();
    } catch (e) {
      toast.error(e.message || 'Failed to issue warning');
    } finally { setIssuing(false); }
  };

  const revokeWarning = async (warning) => {
    try {
      await apiClient.entities.UserWarning.update(warning.id, { status: 'revoked', revoked_at: new Date().toISOString() });
      await apiClient.entities.Notification.create({
        user_email: warning.user_email,
        title: 'Warning Revoked',
        message: `Your Warning #${warning.warning_number} (${warning.reason}) has been revoked by admin.`,
        type: 'reward', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Warning revoked');
      await loadWarnings();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = warnings.filter(w => !searchEmail || w.user_email?.includes(searchEmail.toLowerCase()));
  const activeWarnings = filtered.filter(w => w.status === 'active');
  const revokedWarnings = filtered.filter(w => w.status === 'revoked' || w.status === 'removed');

  // Group active warnings by user
  const byUser = {};
  activeWarnings.forEach(w => {
    if (!byUser[w.user_email]) byUser[w.user_email] = [];
    byUser[w.user_email].push(w);
  });

  if (loading) return <LoadingScreen message="Loading warnings..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="red" size="2xl" className="flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-400" /> WARNINGS
          </NeonText>
        </div>
        <GamingButton variant="danger" size="sm" icon={Plus} onClick={() => setShowIssue(true)}>Issue</GamingButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <GlowCard glowColor="red" className="p-3 text-center">
          <p className="text-2xl font-black text-red-400">{activeWarnings.length}</p>
          <p className="text-xs text-slate-400">Active</p>
        </GlowCard>
        <GlowCard glowColor="orange" className="p-3 text-center">
          <p className="text-2xl font-black text-orange-400">{Object.keys(byUser).length}</p>
          <p className="text-xs text-slate-400">Users Warned</p>
        </GlowCard>
        <GlowCard glowColor="green" className="p-3 text-center">
          <p className="text-2xl font-black text-green-400">{revokedWarnings.length}</p>
          <p className="text-xs text-slate-400">Revoked</p>
        </GlowCard>
      </div>

      {/* System info */}
      <GlowCard glowColor="yellow" className="p-4 mb-5">
        <p className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Warning System Rules
        </p>
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />Warning 1: Yellow alert — user notified</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />Warning 2: Orange alert — final chance notification</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />Warning 3: <strong className="text-red-400">AUTO-BAN triggered instantly</strong></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />Users can spend {WARN_REMOVAL_COST} coins to remove 1 warning, or submit a free daily appeal</div>
        </div>
      </GlowCard>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white pl-9"
          placeholder="Search by email..."
        />
      </div>

      {/* Users with warnings grouped */}
      {Object.keys(byUser).length > 0 && (
        <div className="mb-6">
          <p className="text-slate-400 text-xs font-bold uppercase mb-3">Active Warnings by User</p>
          <div className="space-y-4">
            {Object.entries(byUser).map(([email, userWarns]) => {
              const count = userWarns.length;
              const cfg = WARNING_COLORS[count] || WARNING_COLORS[3];
              return (
                <GlowCard key={email} glowColor={count >= 3 ? 'red' : count === 2 ? 'orange' : 'gold'} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-bold text-sm">{email}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(n => (
                        <div key={n} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${n <= count ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-500'}`}>{n}</div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {userWarns.map(w => (
                      <div key={w.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-xs font-semibold truncate">{w.reason}</p>
                          {w.details && <p className="text-slate-500 text-xs truncate mt-0.5">{w.details}</p>}
                          <p className="text-slate-600 text-xs mt-0.5">{w.issued_at ? new Date(w.issued_at).toLocaleDateString('en-IN') : '—'} by {w.issued_by}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setViewWarning(w)} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600"><Eye className="w-3.5 h-3.5 text-cyan-400" /></button>
                          <button onClick={() => revokeWarning(w)} className="p-1.5 bg-slate-700 rounded-lg hover:bg-green-500/20"><CheckCircle className="w-3.5 h-3.5 text-green-400" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlowCard>
              );
            })}
          </div>
        </div>
      )}

      {activeWarnings.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No active warnings</p>
        </div>
      )}

      {/* Issue Warning Dialog */}
      <Dialog open={showIssue} onOpenChange={setShowIssue}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Issue Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">User Email *</Label>
              <Input value={form.user_email} onChange={e => setForm({...form, user_email: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="user@email.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Reason *</Label>
              <Select value={form.reason} onValueChange={v => setForm({...form, reason: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {WARNING_REASONS.map(r => <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Details / Evidence Description</Label>
              <Textarea value={form.details} onChange={e => setForm({...form, details: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                placeholder="Describe exactly what happened and why this warning is being issued..." />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Proof URL (screenshot link)</Label>
              <Input value={form.proof_url} onChange={e => setForm({...form, proof_url: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="https://imgur.com/..." />
              {form.proof_url && (
                <img src={form.proof_url} alt="Proof" className="rounded-lg max-h-32 object-contain border border-slate-700"
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              Warning 3 will automatically ban the user. Make sure this action is justified.
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowIssue(false)}>Cancel</GamingButton>
            <GamingButton variant="danger" className="flex-1" loading={issuing} icon={AlertTriangle} onClick={issueWarning}>Issue Warning</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Warning Dialog */}
      <Dialog open={!!viewWarning} onOpenChange={() => setViewWarning(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Warning Details</DialogTitle>
          </DialogHeader>
          {viewWarning && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded text-xs font-bold ${WARNING_COLORS[viewWarning.warning_number]?.bg} ${WARNING_COLORS[viewWarning.warning_number]?.color}`}>
                  Warning #{viewWarning.warning_number}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${viewWarning.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {viewWarning.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">User:</span> <span className="text-white font-bold">{viewWarning.user_email}</span></p>
                <p><span className="text-slate-400">Reason:</span> <span className="text-white">{viewWarning.reason}</span></p>
                {viewWarning.details && <p><span className="text-slate-400">Details:</span> <span className="text-slate-300">{viewWarning.details}</span></p>}
                <p><span className="text-slate-400">Issued by:</span> <span className="text-cyan-400">{viewWarning.issued_by}</span></p>
                <p><span className="text-slate-400">Date:</span> <span className="text-white">{viewWarning.issued_at ? new Date(viewWarning.issued_at).toLocaleString('en-IN') : '—'}</span></p>
              </div>
              {viewWarning.proof_url && (
                <div>
                  <p className="text-slate-400 text-xs mb-2">Proof:</p>
                  <img src={viewWarning.proof_url} alt="Proof" className="rounded-lg w-full max-h-48 object-contain border border-slate-700"
                    onError={e => { e.target.style.display = 'none'; }} />
                  <a href={viewWarning.proof_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs mt-1 block">Open full image</a>
                </div>
              )}
              {viewWarning.status === 'active' && (
                <GamingButton variant="green" size="sm" icon={CheckCircle} className="w-full" onClick={() => { revokeWarning(viewWarning); setViewWarning(null); }}>
                  Revoke this Warning
                </GamingButton>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
