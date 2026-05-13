import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Scale, Clock, CheckCircle, XCircle, Send, Plus } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DISPUTE_TYPES = [
  'Incorrect match result',
  'Room credentials not shared',
  'Disconnected during match',
  'Opponent cheating/hacking',
  'Prize not received',
  'Wrong kill/position recorded',
  'Kicked unfairly from tournament',
  'Other',
];

const STATUS_CFG = {
  open:       { color: 'text-yellow-400', glow: 'gold',   label: 'Open',         icon: Clock },
  reviewing:  { color: 'text-cyan-400',   glow: 'cyan',   label: 'Under Review', icon: Clock },
  resolved:   { color: 'text-green-400',  glow: 'green',  label: 'Resolved',     icon: CheckCircle },
  rejected:   { color: 'text-red-400',    glow: 'red',    label: 'Dismissed',    icon: XCircle },
};

export default function DisputeResolution() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myDisputes, setMyDisputes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: '', tournament_id: '', tournament_name: '',
    description: '', evidence_url: '', against_user: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      const disputes = await apiClient.entities.Dispute.filter({ user_email: cu.email }, '-created_date', 30).catch(() => []);
      setMyDisputes(Array.isArray(disputes) ? disputes : []);
    } catch {}
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!form.type || !form.description.trim()) {
      toast.error('Select dispute type and describe the issue');
      return;
    }
    if (form.description.trim().length < 30) {
      toast.error('Please describe the issue in at least 30 characters');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.entities.Dispute.create({
        user_email: user.email,
        username: user.full_name || user.email.split('@')[0],
        type: form.type,
        tournament_id: form.tournament_id || null,
        tournament_name: form.tournament_name || null,
        description: form.description.trim(),
        evidence_url: form.evidence_url?.trim() || null,
        against_user: form.against_user?.trim() || null,
        status: 'open',
        created_date: new Date().toISOString(),
      });
      // Notify admin
      await apiClient.entities.Notification.create({
        user_email: 'raj998302@gmail.com',
        title: 'New Dispute Raised',
        message: `${user.email} raised a dispute: ${form.type}`,
        type: 'system', is_read: false, created_date: new Date().toISOString(),
      });
      toast.success('Dispute submitted! We will review within 24 hours.');
      setShowForm(false);
      setForm({ type: '', tournament_id: '', tournament_name: '', description: '', evidence_url: '', against_user: '' });
      await load();
    } catch (e) {
      toast.error(e.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen message="Loading disputes..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
          <NeonText color="purple" size="2xl" className="flex items-center gap-2">
            <Scale className="w-6 h-6" /> DISPUTES
          </NeonText>
        </div>
        <GamingButton variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>Raise</GamingButton>
      </div>

      {/* Info card */}
      <GlowCard glowColor="purple" className="p-4 mb-5">
        <p className="text-purple-400 font-bold text-sm mb-2">Dispute Policy</p>
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex items-start gap-2"><span className="text-purple-400 flex-shrink-0">•</span>Disputes are reviewed within 24 hours by senior staff</div>
          <div className="flex items-start gap-2"><span className="text-purple-400 flex-shrink-0">•</span>Provide screenshot evidence for faster resolution</div>
          <div className="flex items-start gap-2"><span className="text-purple-400 flex-shrink-0">•</span>False disputes may result in a warning</div>
          <div className="flex items-start gap-2"><span className="text-purple-400 flex-shrink-0">•</span>Admin decision is final after review</div>
        </div>
      </GlowCard>

      {/* My disputes list */}
      <div className="space-y-4">
        {myDisputes.length === 0 ? (
          <div className="text-center py-14">
            <Scale className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No disputes raised yet</p>
            <p className="text-slate-600 text-sm mt-1">If you have an issue, raise a dispute above</p>
          </div>
        ) : myDisputes.map((d, i) => {
          const cfg = STATUS_CFG[d.status] || STATUS_CFG.open;
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlowCard glowColor={cfg.glow} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.color} bg-slate-800`}>{cfg.label}</span>
                      <span className="text-slate-500 text-xs">{d.type}</span>
                    </div>
                    {d.tournament_name && <p className="text-slate-400 text-xs">Tournament: {d.tournament_name}</p>}
                    <p className="text-white text-sm font-semibold mt-1 leading-snug">{d.description?.slice(0, 120)}{d.description?.length > 120 ? '...' : ''}</p>
                  </div>
                  <cfg.icon className={`w-5 h-5 ${cfg.color} flex-shrink-0 ml-2`} />
                </div>
                {d.admin_note && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-bold mb-1">Admin Response:</p>
                    <p className="text-slate-300 text-sm">{d.admin_note}</p>
                  </div>
                )}
                <p className="text-slate-600 text-xs mt-2">
                  {d.created_date ? new Date(d.created_date).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                </p>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {/* Submit Dispute Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" /> Raise a Dispute
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Issue Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select issue..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {DISPUTE_TYPES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Tournament Name (if applicable)</Label>
              <Input value={form.tournament_name} onChange={e => setForm({...form, tournament_name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="Tournament name..." />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Against User (email or username, if applicable)</Label>
              <Input value={form.against_user} onChange={e => setForm({...form, against_user: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="Opponent email or username..." />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Describe the Issue * (min 30 chars)</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                placeholder="Describe exactly what happened, when it happened, and what you expect admin to do..." />
              <p className="text-slate-600 text-xs">{form.description.length}/30 minimum</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Evidence Screenshot URL (optional)</Label>
              <Input value={form.evidence_url} onChange={e => setForm({...form, evidence_url: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="https://imgur.com/..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GamingButton>
            <GamingButton variant="purple" className="flex-1" loading={submitting} icon={Send} onClick={submit}>Submit Dispute</GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
