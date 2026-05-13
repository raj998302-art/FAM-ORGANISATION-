import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Upload, Image, CheckCircle, Clock, XCircle, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const PROOF_STATUS = {
  pending:  { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: Clock,        label: 'Under Review' },
  approved: { color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30',   icon: CheckCircle,  label: 'Verified' },
  rejected: { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',        icon: XCircle,      label: 'Rejected' },
  flagged:  { color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', icon: AlertTriangle, label: 'Flagged for Review' },
};

export default function MatchProofSubmission() {
  const navigate = useNavigate();
  const location = useLocation();
  const tournamentId = new URLSearchParams(location.search).get('id');

  const [user, setUser] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [myProof, setMyProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    screenshot_url: '',
    kills: '',
    position: '',
    notes: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      if (tournamentId) {
        const t = await apiClient.entities.Tournament.get(tournamentId).catch(() => null);
        setTournament(t);
        const proofs = await apiClient.entities.MatchProof.filter({
          user_email: cu.email,
          tournament_id: tournamentId,
        }).catch(() => []);
        if (proofs.length > 0) setMyProof(proofs[0]);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!form.screenshot_url?.trim()) {
      toast.error('Please provide your result screenshot URL (imgur link)');
      return;
    }
    if (!form.kills && !form.position) {
      toast.error('Please enter at least your kills or position');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.entities.MatchProof.create({
        user_email: user.email,
        tournament_id: tournamentId,
        tournament_name: tournament?.title,
        screenshot_url: form.screenshot_url.trim(),
        kills: parseInt(form.kills) || 0,
        position: parseInt(form.position) || null,
        notes: form.notes?.trim() || '',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });
      toast.success('Proof submitted! Admin will verify it soon.');
      await load();
    } catch (e) {
      toast.error(e.message || 'Failed to submit proof');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingScreen message="Loading..." />;

  const statusCfg = myProof ? (PROOF_STATUS[myProof.status] || PROOF_STATUS.pending) : null;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div>
          <NeonText color="cyan" size="xl">SUBMIT PROOF</NeonText>
          {tournament && <p className="text-slate-400 text-xs">{tournament.title}</p>}
        </div>
      </div>

      {/* Already submitted */}
      {myProof && (
        <GlowCard glowColor={myProof.status === 'approved' ? 'green' : myProof.status === 'rejected' ? 'red' : 'gold'} className="p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <statusCfg.icon className={`w-6 h-6 ${statusCfg.color}`} />
            <div>
              <p className={`font-bold ${statusCfg.color}`}>{statusCfg.label}</p>
              <p className="text-slate-400 text-xs">Submitted {myProof.submitted_at ? new Date(myProof.submitted_at).toLocaleString('en-IN') : '—'}</p>
            </div>
          </div>
          {myProof.screenshot_url && (
            <img src={myProof.screenshot_url} alt="Your proof" className="w-full rounded-xl max-h-48 object-contain border border-slate-700 mb-3"
              onError={e => { e.target.style.display='none'; }} />
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {myProof.kills !== undefined && <p className="text-slate-300">Kills: <strong className="text-white">{myProof.kills}</strong></p>}
            {myProof.position && <p className="text-slate-300">Position: <strong className="text-white">#{myProof.position}</strong></p>}
          </div>
          {myProof.status === 'rejected' && myProof.reject_reason && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-xs">Reason: {myProof.reject_reason}</p>
            </div>
          )}
          {myProof.status === 'flagged' && (
            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <p className="text-orange-400 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Your screenshot has been flagged for anti-cheat review.
              </p>
            </div>
          )}
        </GlowCard>
      )}

      {/* Submission Form */}
      {!myProof && (
        <div className="space-y-5">
          <GlowCard glowColor="cyan" className="p-4">
            <p className="text-cyan-400 font-bold text-sm mb-3 flex items-center gap-2">
              <Image className="w-4 h-4" /> How to submit your result
            </p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-start gap-2"><span className="text-cyan-400 font-bold flex-shrink-0">1.</span>Take a screenshot of your match end screen (showing kills, position, stats)</div>
              <div className="flex items-start gap-2"><span className="text-cyan-400 font-bold flex-shrink-0">2.</span>Upload to imgur.com (free) or any image hosting — copy the direct link</div>
              <div className="flex items-start gap-2"><span className="text-cyan-400 font-bold flex-shrink-0">3.</span>Paste the link below and fill your stats</div>
              <div className="flex items-start gap-2"><span className="text-red-400 font-bold flex-shrink-0">!</span>Fake/edited screenshots will result in permanent ban</div>
            </div>
          </GlowCard>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Screenshot URL * (imgur.com link)</Label>
              <Input value={form.screenshot_url} onChange={e => setForm({...form, screenshot_url: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="https://i.imgur.com/..." />
              {form.screenshot_url && (
                <img src={form.screenshot_url} alt="Preview" className="w-full rounded-xl max-h-40 object-contain border border-slate-700 mt-2"
                  onError={e => { e.target.style.display='none'; }} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Your Kills</Label>
                <Input type="number" value={form.kills} onChange={e => setForm({...form, kills: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="0" min="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Your Position</Label>
                <Input type="number" value={form.position} onChange={e => setForm({...form, position: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="#1" min="1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Notes (optional)</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white" placeholder="Any additional info for admin..." />
            </div>
            <GamingButton variant="primary" size="lg" className="w-full" loading={submitting} icon={Send} onClick={submit}>
              Submit Match Proof
            </GamingButton>
          </div>
        </div>
      )}
    </div>
  );
}
