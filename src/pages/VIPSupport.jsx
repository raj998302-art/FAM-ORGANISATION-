import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Headphones, Send, ChevronLeft, Clock, CheckCheck, Check, RefreshCw, X, Paperclip } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getUserRoles } from '@/lib/permissions';

const VIP_ACCESS = ['vip_elite','vip_plus','vip','owner','co_owner','fam_manager'];

const TIER_INFO = {
  vip_elite: { label: 'Elite Support',    color: 'text-yellow-400', badge: '👑', rt: '< 1 hour',  bg: 'from-yellow-500 to-orange-500' },
  vip_plus:  { label: 'Priority Support', color: 'text-purple-400', badge: '⚡', rt: '< 4 hours', bg: 'from-purple-500 to-pink-500' },
  vip:       { label: 'VIP Support',      color: 'text-cyan-400',   badge: '⭐', rt: '< 12 hours',bg: 'from-cyan-500 to-blue-500' },
};

const QUICK_ISSUES = [
  '💰 Payment not credited', '🏆 Tournament result dispute',
  '🔄 Withdrawal delay',    '🎮 Room code issue',
  '👤 Profile/badge issue', '🔐 Account problem', '❓ Other issue',
];

const AUTO_REPLIES = {
  payment: `Hi! 👋 For payment issues:\n1. Check wallet — coins credit within 5 minutes\n2. Share your Razorpay Payment ID if still missing\n3. We'll manually credit within 1 hour\n\nTicket ID: `,
  withdrawal: `Hi! For withdrawal queries:\n• Withdrawals process within 24 hours\n• Large amounts (₹5000+) need admin approval\n• Ensure your payment details are correct\n\nTicket ID: `,
  tournament: `Hi! For tournament disputes:\n• Share your match screenshots\n• Include your Free Fire UID\n• Results reviewed within 2 hours\n\nTicket ID: `,
};

export default function VIPSupport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [tier, setTier] = useState('vip');
  const [ticketId] = useState(() => `TKT-${Math.random().toString(36).slice(2,8).toUpperCase()}`);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { loadData(); return () => clearInterval(pollRef.current); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadData = async () => {
    try {
      const cu = await apiClient.auth.me();
      const roles = getUserRoles(cu);
      if (!roles.some(r => VIP_ACCESS.includes(r))) { navigate(createPageUrl('VIPPlans')); return; }
      setUser(cu);
      setTier(['vip_elite','vip_plus','vip'].find(r => roles.includes(r)) || 'vip');
      await fetchMsgs(cu.email);
      pollRef.current = setInterval(() => fetchMsgs(cu.email), 6000);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMsgs = async (email) => {
    try {
      const msgs = await apiClient.entities.SupportTicket.filter({ user_email: email }, '-createdAt', 50);
      setMessages((msgs || []).reverse());
    } catch(e) {}
  };

  const getAutoReply = (text) => {
    const t = text.toLowerCase();
    if (t.includes('payment') || t.includes('coin') || t.includes('deposit')) return AUTO_REPLIES.payment;
    if (t.includes('withdrawal') || t.includes('withdraw')) return AUTO_REPLIES.withdrawal;
    if (t.includes('tournament') || t.includes('result') || t.includes('match')) return AUTO_REPLIES.tournament;
    return null;
  };

  const sendMessage = async (text) => {
    const msgText = (text || newMsg).trim();
    if (!msgText || !user) return;
    setSending(true); setShowQuick(false);
    try {
      const msg = await apiClient.entities.SupportTicket.create({
        user_email: user.email, username: user.full_name || user.email,
        tier, ticket_id: ticketId, message: msgText,
        is_staff: false, is_read: false, created_date: new Date().toISOString(),
      });
      setMessages(p => [...p, msg]);
      setNewMsg('');
      const autoText = getAutoReply(msgText);
      if (autoText) {
        setTimeout(async () => {
          const auto = await apiClient.entities.SupportTicket.create({
            user_email: user.email, username: 'FAM Support Bot 🤖', tier: 'staff',
            ticket_id: ticketId, message: autoText + ticketId,
            is_staff: true, is_read: true, created_date: new Date().toISOString(),
          });
          setMessages(p => [...p, auto]);
        }, 1800);
      }
    } catch(e) { toast.error('Could not send'); }
    finally { setSending(false); }
  };

  if (loading) return <LoadingScreen message="Connecting to Support…" />;

  const ti = TIER_INFO[tier] || TIER_INFO.vip;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center gap-3 px-4 py-3 pt-safe">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ti.bg} flex items-center justify-center flex-shrink-0`}>
            <Headphones className="w-5 h-5 text-white"/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-sm">{ti.label}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 ${ti.color}`}>{ti.badge}</span>
            </div>
            <p className="text-xs text-slate-500">Avg response: {ti.rt} · #{ticketId}</p>
          </div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/><span className="text-green-400 text-xs">Live</span></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 space-y-3">
        {/* Welcome */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="flex justify-start">
          <div className="max-w-xs">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm p-3.5">
              <p className="text-purple-400 text-xs font-bold mb-1">FAM Support Bot 🤖</p>
              <p className="text-white text-sm">👋 Welcome to {ti.label}!</p>
              <p className="text-slate-300 text-sm mt-1">Hi <span className="text-cyan-400 font-semibold">{user?.full_name || 'there'}</span>! Ticket: <span className="text-cyan-400 font-mono font-bold">{ticketId}</span>. How can I help?</p>
              <p className="text-slate-500 text-xs mt-2 text-right">Just now</p>
            </div>
          </div>
        </motion.div>

        {/* Quick issues */}
        <AnimatePresence>
          {showQuick && messages.length === 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-2">
              <p className="text-slate-500 text-xs text-center">Select your issue or type below:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ISSUES.map(iss => (
                  <button key={iss} onClick={() => sendMessage(iss)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:border-cyan-500/50 hover:text-cyan-400 transition-all active:scale-95">{iss}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list */}
        <AnimatePresence>
          {messages.map((msg, i) => {
            const isOwn = !msg.is_staff;
            return (
              <motion.div key={msg.id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] ${isOwn?'items-end':'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl p-3 text-sm ${isOwn
                    ? `bg-gradient-to-br ${ti.bg} bg-opacity-20 border ${tier==='vip_elite'?'border-yellow-500/30':tier==='vip_plus'?'border-purple-500/30':'border-cyan-500/30'} rounded-br-sm`
                    : 'bg-slate-800/80 border border-slate-700/50 rounded-bl-sm'}`}>
                    {msg.is_staff && <p className="text-purple-400 text-xs font-bold mb-1">{msg.username||'FAM Support'}</p>}
                    <p className="text-white whitespace-pre-wrap">{msg.message}</p>
                    <div className={`flex items-center gap-1 mt-1.5 ${isOwn?'justify-end':'justify-start'}`}>
                      <p className="text-slate-500 text-xs">{msg.created_date ? new Date(msg.created_date).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : 'now'}</p>
                      {isOwn && (msg.is_read ? <CheckCheck className="w-3 h-3 text-cyan-400"/> : <Check className="w-3 h-3 text-slate-500"/>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="fixed bottom-16 inset-x-0 z-30 px-4 pb-3 bg-slate-950/95 border-t border-slate-800/50">
        <div className="flex items-center gap-2 pt-3">
          <Input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
            placeholder="Describe your issue…"
            className="flex-1 bg-slate-800 border-slate-700 text-white focus:border-cyan-500 rounded-xl"/>
          <button onClick={()=>sendMessage()} disabled={!newMsg.trim()||sending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newMsg.trim()&&!sending?'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]':'bg-slate-700'}`}>
            {sending ? <RefreshCw className="w-4 h-4 text-white animate-spin"/> : <Send className="w-4 h-4 text-white"/>}
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-1 text-center"><Clock className="w-3 h-3 inline mr-1"/>Avg response: {ti.rt}</p>
      </div>
    </div>
  );
}
