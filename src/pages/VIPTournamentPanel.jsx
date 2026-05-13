import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Crown, Trophy, Plus, ChevronLeft, RefreshCw,
  Edit3, Trash2, Users, Coins, Eye, Clock, CheckCircle, Star
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';

const DEFAULT_FORM = {
  title: '', description: '', game: 'Free Fire MAX',
  entry_fee: 0, prize_pool: '', max_players: 12,
  date: '', time: '', map: 'Bermuda', mode: 'Squad',
  status: 'registration_open', is_vip: true, vip_only: true,
  required_role: 'vip', tournament_type: 'vip_squad',
  prize_distribution: '1st: 60%, 2nd: 30%, 3rd: 10%',
  rules: '', room_id: '', room_password: ''
};

export default function VIPTournamentPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('MANAGE_VIP_TOURNAMENTS') && !perms.includes('MANAGE_TOURNAMENTS') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const all = await apiClient.entities.Tournament.filter({}, '-createdAt', 200);
      const vip = (all || []).filter(t => t.is_vip || t.vip_only || t.tournament_type?.includes('vip'));
      setTournaments(vip);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setForm(DEFAULT_FORM); setShowDialog(true); };
  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({ ...DEFAULT_FORM, ...t });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const data = {
        ...form, is_vip: true, vip_only: true,
        created_by: user.email,
        created_at: editingId ? form.created_at : new Date().toISOString(),
        filled_slots: editingId ? form.filled_slots : 0,
        participants: editingId ? form.participants : []
      };

      if (editingId) {
        await apiClient.entities.Tournament.update(editingId, data);
        toast.success('VIP Tournament updated!');
      } else {
        await apiClient.entities.Tournament.create(data);
        toast.success('VIP Tournament created!');
      }

      // Broadcast notification about new VIP tournament
      if (!editingId) {
        await apiClient.entities.Broadcast.create({
          title: `New VIP Tournament: ${form.title}`,
          message: `A new exclusive VIP tournament is now open! Entry fee: ₹${form.entry_fee} • Prize pool: ₹${form.prize_pool}`,
          type: 'tournament', priority: 'high',
          sent_by: user.email, sent_at: new Date().toISOString(), status: 'sent'
        }).catch(() => {});
      }

      setShowDialog(false);
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await apiClient.entities.Tournament.delete(id);
      toast.success('Tournament deleted');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiClient.entities.Tournament.update(id, { status });
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading VIP Tournament Panel..." />;

  const STATUS_COLORS = {
    registration_open: 'green', upcoming: 'cyan', ongoing: 'yellow',
    completed: 'purple', cancelled: 'red'
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="gold" size="xl">VIP TOURNAMENT PANEL</NeonText>
            <p className="text-slate-400 text-xs">Create & manage VIP-only events</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-yellow-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <GlowCard glowColor="gold" className="p-3 text-center">
            <p className="text-xl font-black text-yellow-400">{tournaments.length}</p>
            <p className="text-xs text-slate-400">VIP Events</p>
          </GlowCard>
          <GlowCard glowColor="green" className="p-3 text-center">
            <p className="text-xl font-black text-green-400">{tournaments.filter(t => t.status === 'registration_open').length}</p>
            <p className="text-xs text-slate-400">Open</p>
          </GlowCard>
          <GlowCard glowColor="cyan" className="p-3 text-center">
            <p className="text-xl font-black text-cyan-400">{tournaments.filter(t => t.status === 'ongoing').length}</p>
            <p className="text-xs text-slate-400">Live</p>
          </GlowCard>
        </div>

        <GamingButton variant="primary" className="w-full" icon={Plus} onClick={openCreate}>
          Create VIP Tournament
        </GamingButton>
      </motion.div>

      <div className="space-y-3">
        {tournaments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No VIP tournaments yet</div>
        ) : (
          tournaments.map((t, i) => (
            <motion.div key={t.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <GlowCard glowColor="gold" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <p className="text-white font-bold truncate">{t.title}</p>
                      <Badge className={`text-xs bg-${STATUS_COLORS[t.status] || 'cyan'}-500/20 text-${STATUS_COLORS[t.status] || 'cyan'}-400 border border-${STATUS_COLORS[t.status] || 'cyan'}-500/30`}>
                        {t.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{t.date} {t.time} • {t.mode} • {t.map}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-yellow-400">₹{t.entry_fee} entry</span>
                      <span className="text-xs text-green-400">₹{t.prize_pool} pool</span>
                      <span className="text-xs text-slate-400">{t.filled_slots || 0}/{t.max_players} slots</span>
                    </div>
                    {t.room_id && (
                      <p className="text-xs text-cyan-400 font-mono mt-1">Room: {t.room_id} • Pass: {t.room_password}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/40 transition-all">
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button onClick={() => handleDelete(t.id, t.title)} className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 transition-all">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Quick Status Change */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50 overflow-x-auto no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
                  {['registration_open', 'ongoing', 'completed', 'cancelled'].map(s => (
                    <button key={s} onClick={() => handleStatusChange(t.id, s)}
                      className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg border transition-all ${t.status === s ? `bg-${STATUS_COLORS[s]}-500/30 text-${STATUS_COLORS[s]}-400 border-${STATUS_COLORS[s]}-500/50` : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border border-yellow-500/30 text-white max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              {editingId ? 'Edit VIP Tournament' : 'Create VIP Tournament'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Tournament Title *" className="bg-slate-800 border-slate-700 text-white" />
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description..." className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} />

            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" />
              <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Entry Fee (₹)</label>
                <Input type="number" value={form.entry_fee} onChange={e => setForm(f => ({ ...f, entry_fee: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Prize Pool (₹)</label>
                <Input value={form.prize_pool} onChange={e => setForm(f => ({ ...f, prize_pool: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['Solo', 'Duo', 'Squad'].map(m => <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.map} onValueChange={v => setForm(f => ({ ...f, map: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'].map(m => <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={form.required_role} onValueChange={v => setForm(f => ({ ...f, required_role: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['vip', 'vip_plus', 'vip_elite'].map(r => <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Players</label>
                <Input type="number" value={form.max_players} onChange={e => setForm(f => ({ ...f, max_players: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>

            <Input value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}
              placeholder="Room ID" className="bg-slate-800 border-slate-700 text-white font-mono" />
            <Input value={form.room_password} onChange={e => setForm(f => ({ ...f, room_password: e.target.value }))}
              placeholder="Room Password" className="bg-slate-800 border-slate-700 text-white font-mono" />

            <Input value={form.prize_distribution} onChange={e => setForm(f => ({ ...f, prize_distribution: e.target.value }))}
              placeholder="Prize distribution..." className="bg-slate-800 border-slate-700 text-white" />

            <Textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
              placeholder="Tournament rules..." className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} />

            <GamingButton variant="primary" className="w-full" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : editingId ? 'Update Tournament' : 'Create Tournament'}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
