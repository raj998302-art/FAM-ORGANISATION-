import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v, f = 'MMM d, h:mm a') => {
  try { const d = new Date(v); if (!v || isNaN(d.getTime())) return '—'; return format(d, f); } catch { return '—'; }
};
import {
  Bell, Trophy, Wallet, Gift, CheckCircle,
  Megaphone, Clock, CheckCheck, ChevronLeft, Trash2
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const TYPE_ICON = {
  tournament: <Trophy className="w-5 h-5 text-yellow-400" />,
  result:     <CheckCircle className="w-5 h-5 text-green-400" />,
  reward:     <Gift className="w-5 h-5 text-purple-400" />,
  withdrawal: <Wallet className="w-5 h-5 text-blue-400" />,
  deposit:    <Wallet className="w-5 h-5 text-green-400" />,
  broadcast:  <Megaphone className="w-5 h-5 text-orange-400" />,
  reminder:   <Clock className="w-5 h-5 text-cyan-400" />,
  welcome:    <Gift className="w-5 h-5 text-pink-400" />,
  event:      <AppEmoji name="event" size={20} />,
  system:     <Bell className="w-5 h-5 text-slate-400" />,
};

const GLOW = {
  tournament: 'gold', result: 'green', reward: 'purple',
  withdrawal: 'cyan', deposit: 'green', broadcast: 'orange',
  event: 'purple', default: 'cyan',
};

export default function Notifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | broadcast

  const loadData = useCallback(async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      // Load user-specific notifications (includes broadcasts sent to user_email)
      const userNotifs = await apiClient.entities.Notification.filter(
        { user_email: currentUser.email }, '-created_date', 80
      ).catch(() => []);

      setNotifications(Array.isArray(userNotifs) ? userNotifs : []);
    } catch (error) {
      console.error('Notification load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll every 30s for new notifications
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const markAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await apiClient.entities.Notification.update(notif.id, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map(n =>
        apiClient.entities.Notification.update(n.id, { is_read: true }).catch(() => {})
      ));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read!');
    } catch {}
  };

  const deleteNotif = async (notif, e) => {
    e.stopPropagation();
    try {
      await apiClient.entities.Notification.delete(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'broadcast') return n.type === 'broadcast';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <LoadingScreen message="Loading notifications..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
              <Bell className="w-6 h-6" /> NOTIFICATIONS
            </NeonText>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <GamingButton variant="outline" size="sm" icon={CheckCheck} onClick={markAllAsRead}>
            All read
          </GamingButton>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {[['all', 'All'], ['unread', 'Unread'], ['broadcast', 'Broadcasts']].map(([f, l]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              filter === f
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {l}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-cyan-500 text-white text-xs font-black rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlowCard glowColor="cyan" className="p-10 text-center">
                <Bell className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <NeonText color="cyan" size="lg" className="block mb-2">
                  {filter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
                </NeonText>
                <p className="text-slate-400 text-sm">
                  {filter === 'unread' ? 'No unread notifications.' : 'Notifications from admin and tournaments will appear here.'}
                </p>
              </GlowCard>
            </motion.div>
          ) : filtered.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => markAsRead(notif)}
            >
              <GlowCard
                glowColor={GLOW[notif.type] || GLOW.default}
                className={`p-4 cursor-pointer ${!notif.is_read ? 'ring-1 ring-cyan-500/40' : ''}`}
                animated
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    notif.type === 'broadcast' ? 'bg-orange-500/20' :
                    notif.type === 'tournament' ? 'bg-yellow-500/20' :
                    notif.type === 'event' ? 'bg-purple-500/20' :
                    'bg-slate-800/50'
                  }`}>
                    {TYPE_ICON[notif.type] || TYPE_ICON.system}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {notif.type === 'broadcast' && (
                          <span className="text-orange-400 text-xs font-bold uppercase tracking-wider block mb-0.5">
                            Admin Broadcast
                          </span>
                        )}
                        <h3 className={`font-semibold text-sm leading-snug ${notif.is_read ? 'text-slate-300' : 'text-white'}`}>
                          {notif.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.is_read && <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]" />}
                        <button
                          onClick={(e) => deleteNotif(notif, e)}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${notif.is_read ? 'text-slate-500' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5">
                      {safeFormat(notif.created_date || notif.createdAt)}
                    </p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
