import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import LoadingScreen from '../components/ui/LoadingScreen';
import NeonText from '../components/ui/NeonText';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };

// Team chat uses DirectMessage entity but with team_id stored as receiver_id for group chat
// Actually we use a simpler approach: ChatMessage with team_id field for team-based filtering

export default function TeamChat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const init = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      const profiles = await apiClient.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) setProfile(profiles[0]);

      const teams = await apiClient.entities.Team.list();
      const myTeam = teams.find(t =>
        t.captain_email === currentUser.email ||
        t.members?.some(m => m.user_email === currentUser.email)
      );

      if (!myTeam) {
        toast.error('You are not in a team');
        navigate(createPageUrl('Teams'));
        return;
      }

      setTeam(myTeam);
      await loadMessages(myTeam.id);
      pollRef.current = setInterval(() => loadMessages(myTeam.id), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (teamId) => {
    try {
      // Use DirectMessage with receiver_id = teamId to simulate group chat
      const allDMs = await apiClient.entities.DirectMessage.list('created_date', 200);
      const teamMsgs = allDMs.filter(dm => dm.receiver_id === teamId);
      setMessages(teamMsgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !team) return;
    setSending(true);
    try {
      await apiClient.entities.DirectMessage.create({
        sender_id: user.id,
        sender_email: user.email,
        sender_username: profile?.username || 'Player',
        receiver_id: team.id,  // team ID as group identifier
        receiver_email: `team_${team.id}@team.internal`,
        receiver_username: team.team_name,
        message: newMessage.trim(),
        is_read: true
      });
      setNewMessage('');
      await loadMessages(team.id);
    } catch (e) {
      console.error(e);
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading team chat..." />;

  if (!team) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl pt-20">
        <button onClick={() => navigate(createPageUrl('Teams'))} className="p-2">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          {team.logo_url ? (
            <img src={team.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <Users className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <div>
          <NeonText color="cyan">{team.team_name}</NeonText>
          <p className="text-xs text-slate-400">{team.members?.length || 0} members • Team Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <MessageCircle className="w-12 h-12 mb-3 text-slate-600" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_email === user.email;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%]`}>
                {!isOwn && (
                  <p className="text-xs text-cyan-400 font-semibold mb-1 ml-1">{msg.sender_username}</p>
                )}
                <div className={`px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className={`text-xs text-slate-600 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                  {safeFormat(msg.created_date, 'h:mm a')}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800">
        <div className="flex items-center gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message your team..."
            className="flex-1 bg-slate-800 border-slate-700 text-white h-12 rounded-xl"
            disabled={sending}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className={`p-3 rounded-xl transition-all ${
              newMessage.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}