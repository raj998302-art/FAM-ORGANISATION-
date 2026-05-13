import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, ChevronLeft, RefreshCw, Plus, Search, Edit3,
  Trash2, Shield, Star, Crown, UserPlus, Settings,
  ChevronRight, Check, X
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';

export default function TeamPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '', description: '', logo_url: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('MANAGE_TEAMS') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
      const allTeams = await apiClient.entities.Team.filter({}, '-createdAt', 100).catch(() => []);
      setTeams(allTeams || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.tag) { toast.error('Name and tag required'); return; }
    setProcessing(true);
    try {
      await apiClient.entities.Team.create({
        ...form,
        tag: form.tag.toUpperCase().slice(0, 5),
        created_by: user.email,
        members: [],
        member_count: 0,
        wins: 0, losses: 0,
        created_at: new Date().toISOString(),
        status: 'active'
      });
      toast.success('Team created!');
      setShowCreateDialog(false);
      setForm({ name: '', tag: '', description: '', logo_url: '' });
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete team "${name}"?`)) return;
    try {
      await apiClient.entities.Team.delete(id);
      toast.success('Team deleted');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  const handleToggleStatus = async (team) => {
    try {
      const newStatus = team.status === 'active' ? 'disbanded' : 'active';
      await apiClient.entities.Team.update(team.id, { status: newStatus });
      toast.success(`Team ${newStatus}`);
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading Team Panel..." />;

  const filteredTeams = teams.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.tag?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="blue" size="xl">TEAM PANEL</NeonText>
            <p className="text-slate-400 text-xs">Manage all teams & rosters</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <GlowCard glowColor="cyan" className="p-3 text-center">
            <p className="text-xl font-black text-cyan-400">{teams.length}</p>
            <p className="text-xs text-slate-400">Total Teams</p>
          </GlowCard>
          <GlowCard glowColor="green" className="p-3 text-center">
            <p className="text-xl font-black text-green-400">{teams.filter(t => t.status === 'active').length}</p>
            <p className="text-xs text-slate-400">Active</p>
          </GlowCard>
          <GlowCard glowColor="red" className="p-3 text-center">
            <p className="text-xl font-black text-red-400">{teams.filter(t => t.status === 'disbanded').length}</p>
            <p className="text-xs text-slate-400">Disbanded</p>
          </GlowCard>
        </div>

        <GamingButton variant="primary" className="w-full mb-4" icon={Plus} onClick={() => setShowCreateDialog(true)}>
          Create New Team
        </GamingButton>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search teams..." className="pl-9 bg-slate-800 border-slate-700 text-white" />
        </div>
      </motion.div>

      <div className="space-y-3">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No teams found</div>
        ) : (
          filteredTeams.map((team, i) => (
            <motion.div key={team.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard glowColor={team.status === 'active' ? 'blue' : 'red'} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-blue-400 font-black text-sm">{team.tag}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold truncate">{team.name}</p>
                      <span className="text-xs text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded font-mono">[{team.tag}]</span>
                    </div>
                    <p className="text-xs text-slate-400">{team.member_count || 0} members • {team.wins || 0}W {team.losses || 0}L</p>
                    {team.description && <p className="text-xs text-slate-500 truncate">{team.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleStatus(team)}
                      className={`p-1.5 rounded-lg transition-all ${team.status === 'active' ? 'bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/40' : 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/40'}`}>
                      {team.status === 'active' ? <X className="w-4 h-4 text-orange-400" /> : <Check className="w-4 h-4 text-green-400" />}
                    </button>
                    <button onClick={() => handleDelete(team.id, team.name)}
                      className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 transition-all">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-blue-400 flex items-center gap-2"><Users className="w-5 h-5" /> Create Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Team Name *" className="bg-slate-800 border-slate-700 text-white" />
            <Input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value.toUpperCase().slice(0, 5) }))}
              placeholder="Team Tag (max 5 chars) *" className="bg-slate-800 border-slate-700 text-white font-mono" maxLength={5} />
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description..." className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} />
            <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
              placeholder="Logo URL (optional)" className="bg-slate-800 border-slate-700 text-white" />
            <GamingButton variant="primary" className="w-full" disabled={processing} onClick={handleCreate}>
              {processing ? 'Creating...' : 'Create Team'}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
