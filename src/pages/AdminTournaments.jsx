import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { 
  Trophy, 
  Plus, 
  Edit3, 
  Trash2, 
  Users,
  ChevronLeft,
  Clock,
  Coins,
  MapPin,
  Upload,
  Check,
  Flame,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import AppEmoji from '../components/ui/AppEmoji';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function AdminTournaments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    mode: 'solo',
    entry_fee: 10,
    prize_pool: 100,
    max_slots: 48,
    match_time: '',
    map: 'bermuda',
    rules: '',
    room_id: '',
    room_password: '',
    status: 'upcoming',
    prize_1st: 50,
    prize_2nd: 30,
    prize_3rd: 20,
    thumbnail_url: '',
    youtube_url: '',
    tags: ''
  });

  const [results, setResults] = useState([]);

  useEffect(() => {
    checkAdmin();
    loadTournaments();
  }, []);

  const checkAdmin = async () => {
    const user = await apiClient.auth.me();
    if (!user.panels.includes('tournament_panel') && !user.panels.includes('vip_tournament_panel') && !user.panels.includes('master_panel')) {
      navigate(createPageUrl('RolePanel'));
    }
  };

  const loadTournaments = async () => {
    try {
      const data = await apiClient.entities.Tournament.list('-created_date', 100);
      setTournaments(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.match_time) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: formData.title,
        mode: formData.mode,
        entry_fee: parseFloat(formData.entry_fee),
        prize_pool: parseFloat(formData.prize_pool),
        max_slots: parseInt(formData.max_slots),
        match_time: formData.match_time,
        map: formData.map,
        rules: formData.rules,
        room_id: formData.room_id,
        room_password: formData.room_password,
        status: formData.status,
        thumbnail_url: formData.thumbnail_url,
        youtube_url: formData.youtube_url,
        tags: formData.tags,
        prize_distribution: [
          { position: 1, prize: parseFloat(formData.prize_1st) || 0 },
          { position: 2, prize: parseFloat(formData.prize_2nd) || 0 },
          { position: 3, prize: parseFloat(formData.prize_3rd) || 0 }
        ]
      };

      if (selectedTournament) {
        await apiClient.entities.Tournament.update(selectedTournament.id, data);
        toast.success('Tournament updated!');
      } else {
        await apiClient.entities.Tournament.create(data);
        toast.success('Tournament created!');
      }

      setShowForm(false);
      setSelectedTournament(null);
      resetForm();
      loadTournaments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tournament) => {
    try {
      // Refund all participants
      for (const participant of tournament.participants || []) {
        const wallets = await apiClient.entities.Wallet.filter({ user_email: participant.user_email });
        if (wallets.length > 0) {
          await apiClient.entities.Wallet.update(wallets[0].id, {
            balance: wallets[0].balance + tournament.entry_fee
          });
          
          await apiClient.entities.Transaction.create({
            user_id: participant.user_id,
            user_email: participant.user_email,
            type: 'refund',
            amount: tournament.entry_fee,
            status: 'completed',
            description: `Refund for cancelled tournament: ${tournament.title}`
          });

          await apiClient.entities.Notification.create({
            user_id: participant.user_id,
            user_email: participant.user_email,
            title: 'Tournament Cancelled',
            message: `${tournament.title} has been cancelled. ₹${tournament.entry_fee} has been refunded to your wallet.`,
            type: 'system'
          });
        }
      }

      await apiClient.entities.Tournament.delete(tournament.id);
      toast.success('Tournament deleted and participants refunded');
      setDeleteConfirm(null);
      loadTournaments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete');
    }
  };

  const handleUploadResults = async () => {
    if (!selectedTournament || results.length === 0) return;

    setSaving(true);
    try {
      // Distribute prizes
      for (const result of results) {
        if (result.prize_won > 0) {
          const wallets = await apiClient.entities.Wallet.filter({ user_email: result.user_email });
          if (wallets.length > 0) {
            await apiClient.entities.Wallet.update(wallets[0].id, {
              balance: wallets[0].balance + result.prize_won,
              total_won: (wallets[0].total_won || 0) + result.prize_won
            });

            await apiClient.entities.Transaction.create({
              user_id: result.user_id,
              user_email: result.user_email,
              type: 'prize_win',
              amount: result.prize_won,
              status: 'completed',
              description: `Prize for ${selectedTournament.title} - Position #${result.position}`,
              tournament_id: selectedTournament.id
            });

            // Update user profile
            const profiles = await apiClient.entities.UserProfile.filter({ user_email: result.user_email });
            if (profiles.length > 0) {
              await apiClient.entities.UserProfile.update(profiles[0].id, {
                tournaments_won: (profiles[0].tournaments_won || 0) + (result.position === 1 ? 1 : 0),
                total_kills: (profiles[0].total_kills || 0) + (result.kills || 0),
                total_earnings: (profiles[0].total_earnings || 0) + result.prize_won,
                xp: (profiles[0].xp || 0) + (result.position * 100)
              });
            }

            await apiClient.entities.Notification.create({
              user_id: result.user_id,
              user_email: result.user_email,
              title: 'Congratulations! You Won!',
              message: `You won ₹${result.prize_won} in ${selectedTournament.title}! Position: #${result.position}`,
              type: 'result'
            });
          }
        }
      }

      // Update tournament
      await apiClient.entities.Tournament.update(selectedTournament.id, {
        results,
        results_approved: true,
        status: 'completed'
      });

      toast.success('Results uploaded and prizes distributed!');
      setShowResults(false);
      setSelectedTournament(null);
      setResults([]);
      loadTournaments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload results');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      mode: 'solo',
      entry_fee: 10,
      prize_pool: 100,
      max_slots: 48,
      match_time: '',
      map: 'bermuda',
      rules: '',
      room_id: '',
      room_password: '',
      status: 'upcoming',
      prize_1st: 50,
      prize_2nd: 30,
      prize_3rd: 20,
      thumbnail_url: '',
      youtube_url: '',
      tags: ''
    });
  };

  const openEdit = (tournament) => {
    setSelectedTournament(tournament);
    const dist = tournament.prize_distribution || [];
    setFormData({
      title: tournament.title || '',
      mode: tournament.mode || 'solo',
      entry_fee: tournament.entry_fee || 10,
      prize_pool: tournament.prize_pool || 100,
      max_slots: tournament.max_slots || 48,
      match_time: tournament.match_time ? tournament.match_time.slice(0, 16) : '',
      map: tournament.map || 'bermuda',
      rules: tournament.rules || '',
      room_id: tournament.room_id || '',
      room_password: tournament.room_password || '',
      status: tournament.status || 'upcoming',
      prize_1st: dist[0]?.prize ?? Math.floor((tournament.prize_pool || 0) * 0.5),
      prize_2nd: dist[1]?.prize ?? Math.floor((tournament.prize_pool || 0) * 0.3),
      prize_3rd: dist[2]?.prize ?? Math.floor((tournament.prize_pool || 0) * 0.2),
      thumbnail_url: tournament.thumbnail_url || '',
      youtube_url: tournament.youtube_url || '',
      tags: tournament.tags || ''
    });
    setShowForm(true);
  };

  const openResults = (tournament) => {
    setSelectedTournament(tournament);
    const initialResults = (tournament.participants || []).map((p, i) => ({
      position: i + 1,
      user_id: p.user_id,
      user_email: p.user_email,
      username: p.username,
      kills: 0,
      prize_won: i < 3 ? tournament.prize_distribution?.[i]?.prize || 0 : 0
    }));
    setResults(initialResults);
    setShowResults(true);
  };

  if (loading) {
    return <LoadingScreen message="Loading tournaments..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="gold" size="2xl" className="flex items-center gap-2">
            <Trophy className="w-7 h-7" />
            TOURNAMENTS
          </NeonText>
        </div>
        <GamingButton
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            resetForm();
            setSelectedTournament(null);
            setShowForm(true);
          }}
        >
          Create
        </GamingButton>
      </div>

      {/* Tournaments List */}
      <div className="space-y-4">
        {tournaments.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlowCard 
              glowColor={
                tournament.status === 'live' ? 'red' :
                tournament.status === 'completed' ? 'green' :
                'cyan'
              } 
              className="p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      tournament.status === 'live' ? 'bg-red-500/20 text-red-400' :
                      tournament.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      tournament.status === 'registration_open' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tournament.status === 'live' && <Flame className="w-3 h-3 inline mr-1" />}
                      {tournament.status}
                    </span>
                    <span className="text-xs text-slate-500 uppercase">
                      {tournament.mode}
                    </span>
                  </div>
                  <h3 className="font-bold text-white">{tournament.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(tournament)}
                    className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50"
                  >
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(tournament)}
                    className="p-2 bg-slate-800/50 rounded-lg hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Coins className="w-3 h-3 text-yellow-400 mx-auto mb-1" />
                  <span className="text-slate-300">₹{tournament.entry_fee}</span>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Trophy className="w-3 h-3 text-green-400 mx-auto mb-1" />
                  <span className="text-slate-300">₹{tournament.prize_pool}</span>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Users className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
                  <span className="text-slate-300">{tournament.filled_slots || 0}/{tournament.max_slots}</span>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <MapPin className="w-3 h-3 text-purple-400 mx-auto mb-1" />
                  <span className="text-slate-300 capitalize">{tournament.map}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {safeFormat(tournament.match_time, 'MMM d, h:mm a')}
                </span>
                {tournament.status === 'live' && !tournament.results_approved && (
                  <GamingButton
                    variant="success"
                    size="sm"
                    icon={Upload}
                    onClick={() => openResults(tournament)}
                  >
                    Upload Results
                  </GamingButton>
                )}
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {selectedTournament ? 'Edit Tournament' : 'Create Tournament'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Tournament title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Mode</Label>
                <Select value={formData.mode} onValueChange={(v) => setFormData({...formData, mode: v, max_slots: v === 'solo' ? 48 : v === 'duo' ? 24 : 12})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="solo">Solo (48)</SelectItem>
                    <SelectItem value="duo">Duo (24)</SelectItem>
                    <SelectItem value="squad">Squad (12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Map</Label>
                <Select value={formData.map} onValueChange={(v) => setFormData({...formData, map: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="bermuda">Bermuda</SelectItem>
                    <SelectItem value="purgatory">Purgatory</SelectItem>
                    <SelectItem value="kalahari">Kalahari</SelectItem>
                    <SelectItem value="alpine">Alpine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Entry Fee (₹)</Label>
                <Input
                  type="number"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Prize Pool (₹)</Label>
                <Input
                  type="number"
                  value={formData.prize_pool}
                  onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Match Time *</Label>
              <Input
                type="datetime-local"
                value={formData.match_time}
                onChange={(e) => setFormData({...formData, match_time: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="registration_open">Registration Open</SelectItem>
                  <SelectItem value="registration_closed">Registration Closed</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Room ID</Label>
                <Input
                  value={formData.room_id}
                  onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., 123456"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Room Password</Label>
                <Input
                  value={formData.room_password}
                  onChange={(e) => setFormData({...formData, room_password: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., abc123"
                />
              </div>
            </div>

            {/* Prize Distribution */}
            <div className="space-y-2">
              <Label className="text-slate-300">Prize Distribution (₹)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-yellow-400 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded bg-yellow-500 text-slate-900 font-black text-xs flex items-center justify-center">1</span>
                    1st Place
                  </p>
                  <Input
                    type="number"
                    value={formData.prize_1st}
                    onChange={(e) => setFormData({...formData, prize_1st: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded bg-slate-400 text-slate-900 font-black text-xs flex items-center justify-center">2</span>
                    2nd Place
                  </p>
                  <Input
                    type="number"
                    value={formData.prize_2nd}
                    onChange={(e) => setFormData({...formData, prize_2nd: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                    <span className="w-5 h-5 rounded bg-orange-500 text-white font-black text-xs flex items-center justify-center">3</span>
                    3rd Place
                  </p>
                  <Input
                    type="number"
                    value={formData.prize_3rd}
                    onChange={(e) => setFormData({...formData, prize_3rd: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Thumbnail & Media */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Tournament Thumbnail URL
              </Label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://i.imgur.com/example.jpg"
              />
              {formData.thumbnail_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-32">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-xs text-white font-semibold">Preview</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">YouTube Stream URL (optional)</Label>
              <Input
                value={formData.youtube_url}
                onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="e.g. solo, free fire, ranked"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Rules</Label>
              <Textarea
                value={formData.rules}
                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                placeholder="Tournament rules..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="primary" 
              className="flex-1"
              loading={saving}
              onClick={handleSave}
              icon={Save}
            >
              Save
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Upload Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Upload Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-400">
              Arrange participants by position and enter kills. Top 3 will receive prizes.
            </p>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-slate-900' :
                    index === 1 ? 'bg-slate-400 text-slate-900' :
                    index === 2 ? 'bg-amber-600 text-slate-900' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{result.username}</p>
                  </div>
                  <Input
                    type="number"
                    value={result.kills}
                    onChange={(e) => {
                      const newResults = [...results];
                      newResults[index].kills = parseInt(e.target.value) || 0;
                      setResults(newResults);
                    }}
                    className="w-20 bg-slate-700 border-slate-600 text-white text-center"
                    placeholder="Kills"
                  />
                  {index < 3 && (
                    <span className="text-green-400 font-bold text-sm">
                      ₹{result.prize_won}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowResults(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="success" 
              className="flex-1"
              loading={saving}
              onClick={handleUploadResults}
              icon={Check}
            >
              Confirm & Distribute
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Tournament?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will delete the tournament and refund all participants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDelete(deleteConfirm)}
            >
              Delete & Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}