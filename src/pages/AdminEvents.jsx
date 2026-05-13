import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Plus, Edit3, Trash2, Star, Save,
  Upload, Users, Clock, Gift, Eye, EyeOff, Image
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
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const EVENT_TYPES = ['seasonal', 'community', 'special', 'challenge', 'celebration', 'tournament'];
const EVENT_STATUSES = ['upcoming', 'active', 'completed', 'cancelled'];

const STATUS_COLORS = {
  upcoming: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  completed: 'bg-slate-500/20 text-slate-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const TYPE_COLORS = {
  seasonal: 'orange',
  community: 'cyan',
  special: 'purple',
  challenge: 'green',
  celebration: 'gold',
  tournament: 'red',
};

const emptyForm = {
  title: '',
  description: '',
  event_type: 'special',
  status: 'upcoming',
  start_date: '',
  end_date: '',
  thumbnail_url: '',
  banner_url: '',
  youtube_url: '',
  max_participants: '',
  prize_pool: '',
  entry_fee: 0,
  rules: '',
  is_featured: false,
  rewards: [{ position: 1, reward_description: '' }],
};

export default function AdminEvents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    checkAccess();
    loadEvents();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await apiClient.auth.me();
      const allowed = ['master_panel', 'community_panel', 'admin_panel'];
      if (!user.panels?.some(p => allowed.includes(p))) {
        navigate(createPageUrl('AdminDashboard'));
      }
    } catch {
      navigate(createPageUrl('Home'));
    }
  };

  const loadEvents = async () => {
    try {
      const data = await apiClient.entities.Event.list('-created_date', 100);
      setEvents(data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.start_date) {
      toast.error('Title and start date are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        prize_pool: formData.prize_pool ? parseFloat(formData.prize_pool) : 0,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        rewards: formData.rewards.filter(r => r.reward_description),
        created_date: selectedEvent ? selectedEvent.created_date : new Date().toISOString(),
      };
      if (selectedEvent) {
        await apiClient.entities.Event.update(selectedEvent.id, data);
        toast.success('Event updated!');
      } else {
        await apiClient.entities.Event.create(data);
        toast.success('Event created!');
      }
      setShowForm(false);
      setSelectedEvent(null);
      setFormData(emptyForm);
      loadEvents();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    try {
      await apiClient.entities.Event.delete(event.id);
      toast.success('Event deleted');
      setDeleteConfirm(null);
      loadEvents();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || 'special',
      status: event.status || 'upcoming',
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      thumbnail_url: event.thumbnail_url || event.image_url || '',
      banner_url: event.banner_url || '',
      youtube_url: event.youtube_url || '',
      max_participants: event.max_participants || '',
      prize_pool: event.prize_pool || '',
      entry_fee: event.entry_fee || 0,
      rules: event.rules || '',
      is_featured: event.is_featured || false,
      rewards: event.rewards?.length ? event.rewards : [{ position: 1, reward_description: '' }],
    });
    setShowForm(true);
  };

  const addReward = () => {
    setFormData(f => ({
      ...f,
      rewards: [...f.rewards, { position: f.rewards.length + 1, reward_description: '' }]
    }));
  };

  const updateReward = (idx, val) => {
    setFormData(f => ({
      ...f,
      rewards: f.rewards.map((r, i) => i === idx ? { ...r, reward_description: val } : r)
    }));
  };

  const removeReward = (idx) => {
    setFormData(f => ({
      ...f,
      rewards: f.rewards.filter((_, i) => i !== idx).map((r, i) => ({ ...r, position: i + 1 }))
    }));
  };

  if (loading) return <LoadingScreen message="Loading events..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="purple" size="2xl" className="flex items-center gap-2">
            <AppEmoji name="event" size={28} />
            EVENTS
          </NeonText>
        </div>
        <GamingButton
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setFormData(emptyForm);
            setSelectedEvent(null);
            setShowForm(true);
          }}
        >
          Create
        </GamingButton>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: events.length, color: 'text-cyan-400' },
          { label: 'Active', value: events.filter(e => e.status === 'active').length, color: 'text-green-400' },
          { label: 'Featured', value: events.filter(e => e.is_featured).length, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <AppEmoji name="event" size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-slate-400">No events yet. Create one!</p>
          </div>
        ) : events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <GlowCard glowColor={TYPE_COLORS[event.event_type] || 'purple'} className="overflow-hidden">
              {/* Thumbnail banner */}
              {(event.thumbnail_url || event.image_url) && (
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={event.thumbnail_url || event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  {event.is_featured && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      FEATURED
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${STATUS_COLORS[event.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {event.status}
                      </span>
                      <span className="text-xs text-slate-500 uppercase">{event.event_type}</span>
                      {event.is_featured && !(event.thumbnail_url || event.image_url) && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 rounded">FEATURED</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white truncate">{event.title}</h3>
                    {event.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(event)}
                      className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50"
                    >
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(event)}
                      className="p-2 bg-slate-800/50 rounded-lg hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN') : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.current_participants || 0}/{event.max_participants || '∞'}
                  </span>
                  {event.prize_pool > 0 && (
                    <span className="flex items-center gap-1 text-green-400">
                      <Gift className="w-3 h-3" />
                      ₹{event.prize_pool}
                    </span>
                  )}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <AppEmoji name="event" size={24} />
              {selectedEvent ? 'Edit Event' : 'Create Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-slate-300">Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Event title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                placeholder="Describe this event..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select value={formData.event_type} onValueChange={v => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {EVENT_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-400" />
                Thumbnail URL
              </Label>
              <Input
                value={formData.thumbnail_url}
                onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://i.imgur.com/example.jpg"
              />
              {formData.thumbnail_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-28">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-xs text-white font-semibold">Preview</span>
                </div>
              )}
            </div>

            {/* Banner URL */}
            <div className="space-y-2">
              <Label className="text-slate-300">Banner/Cover URL (optional)</Label>
              <Input
                value={formData.banner_url}
                onChange={e => setFormData({ ...formData, banner_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Wide banner image URL..."
              />
            </div>

            {/* YouTube */}
            <div className="space-y-2">
              <Label className="text-slate-300">YouTube URL (optional)</Label>
              <Input
                value={formData.youtube_url}
                onChange={e => setFormData({ ...formData, youtube_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Max Participants</Label>
                <Input
                  type="number"
                  value={formData.max_participants}
                  onChange={e => setFormData({ ...formData, max_participants: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Leave blank = unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Prize Pool (₹)</Label>
                <Input
                  type="number"
                  value={formData.prize_pool}
                  onChange={e => setFormData({ ...formData, prize_pool: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div>
                <p className="text-white font-medium text-sm">Featured Event</p>
                <p className="text-slate-400 text-xs">Show this prominently on events page</p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={v => setFormData({ ...formData, is_featured: v })}
              />
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <Label className="text-slate-300">Rules / Description</Label>
              <Textarea
                value={formData.rules}
                onChange={e => setFormData({ ...formData, rules: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                placeholder="Event rules..."
              />
            </div>

            {/* Rewards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Rewards / Prizes</Label>
                <button
                  onClick={addReward}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.rewards.map((reward, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      idx === 0 ? 'bg-yellow-500 text-slate-900' :
                      idx === 1 ? 'bg-slate-400 text-slate-900' :
                      idx === 2 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>{idx + 1}</span>
                    <Input
                      value={reward.reward_description}
                      onChange={e => updateReward(idx, e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white flex-1"
                      placeholder={`Position ${idx + 1} reward (e.g. ₹500 + Trophy)`}
                    />
                    {formData.rewards.length > 1 && (
                      <button onClick={() => removeReward(idx)} className="p-1.5 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GamingButton>
            <GamingButton variant="primary" className="flex-1" loading={saving} onClick={handleSave} icon={Save}>Save Event</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Event?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete "{deleteConfirm?.title}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(deleteConfirm)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
