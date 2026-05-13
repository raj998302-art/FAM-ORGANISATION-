import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Bell, Megaphone, ChevronLeft, RefreshCw, Send, Users,
  MessageCircle, Plus, Trash2, Eye, Clock, CheckCircle, Star
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';

export default function CommunityPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('broadcast');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [sending, setSending] = useState(false);

  const [broadcastForm, setBroadcastForm] = useState({
    title: '', message: '', type: 'general', priority: 'normal', audience: 'all'
  });
  const [eventForm, setEventForm] = useState({
    title: '', description: '', date: '', time: '', type: 'event',
    prize_pool: '', image_url: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('MODERATE_COMMUNITY') && !perms.includes('SEND_BROADCAST') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const [broads, evts] = await Promise.all([
        apiClient.entities.Broadcast.filter({}, '-createdAt', 50).catch(() => []),
        apiClient.entities.Event.filter({}, '-createdAt', 50).catch(() => []),
      ]);
      setBroadcasts(broads || []);
      setEvents(evts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) { toast.error('Fill all fields'); return; }
    setSending(true);
    try {
      await apiClient.entities.Broadcast.create({
        ...broadcastForm,
        sent_by: user.email,
        sent_by_name: user.full_name || user.email,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });
      toast.success('Broadcast sent!');
      setShowBroadcastDialog(false);
      setBroadcastForm({ title: '', message: '', type: 'general', priority: 'normal', audience: 'all' });
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const createEvent = async () => {
    if (!eventForm.title || !eventForm.date) { toast.error('Fill required fields'); return; }
    setSending(true);
    try {
      await apiClient.entities.Event.create({
        ...eventForm,
        created_by: user.email,
        status: 'upcoming',
        created_at: new Date().toISOString()
      });
      toast.success('Event created!');
      setShowEventDialog(false);
      setEventForm({ title: '', description: '', date: '', time: '', type: 'event', prize_pool: '', image_url: '' });
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const deleteBroadcast = async (id) => {
    try {
      await apiClient.entities.Broadcast.delete(id);
      toast.success('Broadcast deleted');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading Community Panel..." />;

  const BROADCAST_TYPES = ['general', 'tournament', 'maintenance', 'vip', 'urgent', 'celebration'];
  const PRIORITY_COLORS = { normal: 'cyan', high: 'orange', urgent: 'red' };

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="orange" size="xl">COMMUNITY PANEL</NeonText>
            <p className="text-slate-400 text-xs">Broadcasts & events management</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-orange-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <GlowCard glowColor="orange" className="p-3 text-center">
            <p className="text-xl font-black text-orange-400">{broadcasts.length}</p>
            <p className="text-xs text-slate-400">Broadcasts</p>
          </GlowCard>
          <GlowCard glowColor="cyan" className="p-3 text-center">
            <p className="text-xl font-black text-cyan-400">{events.length}</p>
            <p className="text-xs text-slate-400">Events</p>
          </GlowCard>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['broadcast', 'events'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'broadcast' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GamingButton variant="primary" className="w-full mb-4" icon={Plus}
            onClick={() => setShowBroadcastDialog(true)}>New Broadcast</GamingButton>
          <div className="space-y-3">
            {broadcasts.map((b, i) => (
              <GlowCard key={b.id || i} glowColor={PRIORITY_COLORS[b.priority] || 'cyan'} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <p className="text-white font-bold text-sm truncate">{b.title}</p>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{b.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : b.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{b.priority || 'normal'}</span>
                      <span className="text-xs text-slate-500">{b.sent_at ? new Date(b.sent_at).toLocaleDateString() : ''}</span>
                      <span className="text-xs text-slate-500">by {b.sent_by_name || b.sent_by}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteBroadcast(b.id)}
                    className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 transition-all flex-shrink-0">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'events' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GamingButton variant="primary" className="w-full mb-4" icon={Plus}
            onClick={() => setShowEventDialog(true)}>Create Event</GamingButton>
          <div className="space-y-3">
            {events.map((e, i) => (
              <GlowCard key={e.id || i} glowColor="cyan" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{e.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{e.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-cyan-400">{e.date} {e.time}</span>
                      {e.prize_pool && <span className="text-xs text-yellow-400">₹{e.prize_pool} pool</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${e.status === 'upcoming' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-green-500/20 text-green-400'}`}>
                    {e.status}
                  </span>
                </div>
              </GlowCard>
            ))}
          </div>
        </motion.div>
      )}

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-orange-400 flex items-center gap-2"><Megaphone className="w-5 h-5" /> New Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Broadcast Title" className="bg-slate-800 border-slate-700 text-white" />
            <Textarea value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Broadcast message..." className="bg-slate-800 border-slate-700 text-white resize-none" rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={broadcastForm.type} onValueChange={v => setBroadcastForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {BROADCAST_TYPES.map(t => <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={broadcastForm.priority} onValueChange={v => setBroadcastForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['normal', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="text-white capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <GamingButton variant="primary" className="w-full" icon={Send} disabled={sending} onClick={sendBroadcast}>
              {sending ? 'Sending...' : 'Send Broadcast'}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2"><Star className="w-5 h-5" /> Create Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Event Title *" className="bg-slate-800 border-slate-700 text-white" />
            <Textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description..." className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" />
              <Input type="time" value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Input value={eventForm.prize_pool} onChange={e => setEventForm(f => ({ ...f, prize_pool: e.target.value }))}
              placeholder="Prize Pool (₹)" className="bg-slate-800 border-slate-700 text-white" />
            <Input value={eventForm.image_url} onChange={e => setEventForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="Thumbnail URL (https://...)" className="bg-slate-800 border-slate-700 text-white" />
            {eventForm.image_url && (
              <div className="relative rounded-lg overflow-hidden h-24 border border-slate-700">
                <img src={eventForm.image_url} alt="Preview" className="w-full h-full object-cover"
                  onError={e => { e.target.parentElement.style.display='none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                <span className="absolute bottom-1 left-2 text-xs text-white">Preview</span>
              </div>
            )}
            <GamingButton variant="primary" className="w-full" disabled={sending} onClick={createEvent}>
              {sending ? 'Creating...' : 'Create Event'}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
