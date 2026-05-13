import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Send, Loader2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import GamingButton from '../components/ui/GamingButton';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';

export default function PublicChat() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const userEmailRef = React.useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user) return;
    userEmailRef.current = user.email;
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      const profiles = await apiClient.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }

      await loadMessages();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const allMessages = await apiClient.entities.ChatMessage.filter(
        { is_admin_reply: false },
        '-created_date',
        50
      );
      setMessages(allMessages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await apiClient.entities.ChatMessage.create({
        user_id: user.id,
        user_email: user.email,
        username: profile?.username || 'Player',
        message: newMessage.trim(),
        is_admin_reply: false,
        read_by_admin: false
      });

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading chat..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 pt-20 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <NeonText color="cyan" size="xl" className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          PUBLIC LOBBY
        </NeonText>
        <p className="text-slate-400 text-sm mt-1">Chat with all players</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.user_email === user.email;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <p className="text-xs text-slate-500 mb-1">{msg.username}</p>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {new Date(msg.created_date).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="bg-slate-800 border-slate-700 text-white flex-1"
          />
          <GamingButton
            variant="primary"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            icon={sending ? Loader2 : Send}
          >
            Send
          </GamingButton>
        </div>
      </div>
    </div>
  );
}