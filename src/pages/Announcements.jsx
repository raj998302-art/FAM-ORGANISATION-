import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Megaphone, Star, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { format } from 'date-fns';

const safeFormat = (v, f = 'MMM d, yyyy') => {
  try { const d = new Date(v); if (!v || isNaN(d.getTime())) return ''; return format(d, f); } catch { return ''; }
};

const TYPE_CONFIG = {
  announcement: { label: 'Announcement', color: 'cyan',   glow: 'cyan',   icon: Megaphone },
  tournament:   { label: 'Tournament',   color: 'gold',   glow: 'gold',   icon: Star },
  update:       { label: 'Update',       color: 'green',  glow: 'green',  icon: RefreshCw },
  event:        { label: 'Event',        color: 'purple', glow: 'purple', icon: Calendar },
  urgent:       { label: 'Urgent',       color: 'red',    glow: 'red',    icon: Megaphone },
};

export default function Announcements() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await apiClient.entities.Announcement.list('-created_date', 50).catch(() => []);
      setPosts(Array.isArray(data) ? data : []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);
  const pinned = filtered.filter(p => p.is_pinned);
  const regular = filtered.filter(p => !p.is_pinned);

  if (loading) return <LoadingScreen message="Loading announcements..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> ANNOUNCEMENTS
        </NeonText>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain',msOverflowStyle:'none',scrollbarWidth:'none'}}>
        {[['all', 'All'], ['announcement', 'News'], ['tournament', 'Tournaments'], ['event', 'Events'], ['update', 'Updates'], ['urgent', 'Urgent']].map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border flex-shrink-0 transition-all ${
              filter === f ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* Pinned posts */}
      {pinned.length > 0 && (
        <div className="mb-5">
          <p className="text-slate-400 text-xs font-bold uppercase mb-3 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" /> Pinned
          </p>
          <div className="space-y-3">
            {pinned.map((post, i) => <AnnouncementCard key={post.id} post={post} index={i} pinned />)}
          </div>
        </div>
      )}

      {/* Regular posts */}
      <div className="space-y-4">
        {regular.length === 0 && pinned.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No announcements yet</p>
          </div>
        ) : regular.map((post, i) => <AnnouncementCard key={post.id} post={post} index={i} />)}
      </div>
    </div>
  );
}

function AnnouncementCard({ post, index, pinned }) {
  const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.announcement;
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <GlowCard glowColor={cfg.glow} className="overflow-hidden">
        {/* Banner image */}
        {post.image_url && (
          <div className="relative h-36 overflow-hidden">
            <img src={post.image_url} alt={post.title}
              className="w-full h-full object-cover"
              onError={e => { e.target.parentElement.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded bg-${cfg.color}-500/20 text-${cfg.color}-400 border border-${cfg.color}-500/30 flex items-center gap-1`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
                {pinned && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Pinned
                  </span>
                )}
                {post.is_urgent && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">URGENT</span>
                )}
              </div>
              <h3 className="text-white font-bold text-base leading-tight">{post.title}</h3>
            </div>
          </div>

          {post.content && (
            <p className="text-slate-400 text-sm leading-relaxed mb-3">{post.content}</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-slate-600 text-xs">
              {safeFormat(post.created_date)} · {post.author || 'FAM Admin'}
            </p>
            {post.cta_url && (
              <a href={post.cta_url} target="_blank" rel="noopener noreferrer"
                className="text-cyan-400 text-xs font-bold flex items-center gap-1 hover:text-cyan-300">
                {post.cta_label || 'View More'} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}
