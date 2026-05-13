import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Crown, Send, ChevronLeft, RefreshCw, Star, Zap,
  Lock, MessageCircle, Smile, Mic, MicOff
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import RoleBadge from '../components/ui/RoleBadge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getUserRoles } from '@/lib/permissions';

const VIP_ROLES = ['vip_elite', 'vip_plus', 'vip', 'owner', 'co_owner', 'fam_manager'];

const EMOJIS = ['🔥', '💀', '🏆', '⚡', '🎯', '💎', '👑', '🎮', '😈', '🚀'];

const TIER_COLORS = {
  vip_elite: { bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: Crown },
  vip_plus:  { bg: 'from-purple-500/20 to-pink-500/20',  border: 'border-purple-500/30', text: 'text-purple-400', icon: Zap },
  vip:       { bg: 'from-cyan-500/20 to-blue-500/20',    border: 'border-cyan-500/30',   text: 'text-cyan-400',   icon: Star },
  owner:     { bg: 'from-red-500/20 to-pink-500/20',     border: 'border-red-500/30',    text: 'text-red-400',    icon: Crown },
  default:   { bg: 'from-slate-700/20 to-slate-800/20',  border: 'border-slate-700/30',  text: 'text-slate-400',  icon: Star },
};

function getHighestVIPRole(roles) {
  for (const r of ['vip_elite', 'vip_plus', 'vip', 'owner', 'co_owner', 'fam_manager']) {
    if (roles.includes(r)) return r;
  }
  return 'default';
}

export default function VIPChat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadData();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const roles = getUserRoles(currentUser);
      const hasAccess = roles.some(r => VIP_ROLES.includes(r));

      if (!hasAccess) {
        navigate(createPageUrl('VIPPlans'));
        return;
      }

      setUser(currentUser);

      const [profiles, msgs] = await Promise.all([
        apiClient.entities.UserProfile.filter({ user_email: currentUser.email }),
        apiClient.entities.VIPChatMessage.filter({}, '-createdAt', 100).catch(() => []),
      ]);

      if (profiles.length > 0) setUserProfile(profiles[0]);
      setMessages((msgs || []).reverse());

      // Random online count for fun
      setOnlineCount(Math.floor(Math.random() * 20) + 5);

      // Poll every 5 seconds
      pollRef.current = setInterval(async () => {
        try {
          const newMsgs = await apiClient.entities.VIPChatMessage.filter({}, '-createdAt', 100).catch(() => []);
          setMessages((newMsgs || []).reverse());
        } catch (e) {}
      }, 5000);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    const msgText = newMsg.trim();
    setSending(true);
    setNewMsg('');

    const roles = getUserRoles(user);
    const primaryRole = getHighestVIPRole(roles);

    try {
      const msg = await apiClient.entities.VIPChatMessage.create({
        user_email: user.email,
        username: userProfile?.ign || userProfile?.username || user.full_name || 'VIP Player',
        message: msgText,
        roles: roles,
        primary_role: primaryRole,
        avatar_url: userProfile?.avatar_url || '',
        timestamp: new Date().toISOString()
      });

      setMessages(prev => [...prev, msg]);
    } catch (e) { toast.error('Failed to send message'); setNewMsg(msgText); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return <LoadingScreen message="Entering VIP Chat..." />;

  const myRoles = getUserRoles(user);
  const myPrimaryRole = getHighestVIPRole(myRoles);
  const myConfig = TIER_COLORS[myPrimaryRole] || TIER_COLORS.default;

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('VIPPanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <NeonText color="gold" size="lg">VIP EXCLUSIVE CHAT</NeonText>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">{onlineCount}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> VIP members only
            </p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-4 h-4 text-yellow-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Crown className="w-12 h-12 text-yellow-400/30 mb-4" />
            <p className="text-slate-500 text-sm">No messages yet. Be the first VIP to speak!</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => {
            const isMe = msg.user_email === user?.email;
            const msgRole = msg.primary_role || 'default';
            const config = TIER_COLORS[msgRole] || TIER_COLORS.default;
            const MsgIcon = config.icon;

            return (
              <motion.div key={msg.id || i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${config.bg} border ${config.border}`}>
                  {msg.avatar_url ? (
                    <img src={msg.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <MsgIcon className={`w-4 h-4 ${config.text}`} />
                  )}
                </div>

                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {/* Username + role */}
                  <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-xs font-bold ${config.text}`}>{msg.username || 'VIP'}</span>
                    <RoleBadge role={msg.primary_role || 'vip'} size="xs" />
                  </div>

                  {/* Bubble */}
                  <div className={`px-3 py-2 rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} ${isMe ? 'rounded-tr-md' : 'rounded-tl-md'}`}>
                    <p className="text-white text-sm break-words">{msg.message}</p>
                  </div>

                  <span className="text-xs text-slate-500">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 pb-24 pt-3 bg-slate-950 border-t border-slate-800">
        {/* Emoji row */}
        <AnimatePresence>
          {showEmojis && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { setNewMsg(m => m + e); setShowEmojis(false); inputRef.current?.focus(); }}
                  className="text-xl p-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all flex-shrink-0">
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r ${myConfig.bg} border ${myConfig.border}`}>
          <button onClick={() => setShowEmojis(v => !v)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <Smile className="w-5 h-5 text-slate-400" />
          </button>
          <input
            ref={inputRef}
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message VIP chat..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!newMsg.trim() || sending}
            className={`p-2 rounded-xl transition-all ${newMsg.trim() ? `bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]` : 'bg-slate-700 text-slate-500'}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">VIP exclusive • Be respectful to all members</p>
      </div>
    </div>
  );
}
