import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { MessageCircle, ChevronLeft, Send, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';

import { checkPermission, PERMISSIONS } from '@/lib/permissions';

export default function AdminChats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
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
    if (selectedEmail) {
      loadMessages(selectedEmail);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(selectedEmail), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const init = async () => {
    try {
      const user = await apiClient.auth.me();
      if (!checkPermission(user, PERMISSIONS.VIEW_SUPPORT_CHATS)) {
        navigate(createPageUrl('Home'));
        return;
      }
      setCurrentUser(user);
      await loadChatList();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChatList = async () => {
    try {
      const allMessages = await apiClient.entities.ChatMessage.list('-created_date', 500);
      const map = {};
      allMessages.forEach(msg => {
        const key = msg.user_email;
        if (!map[key]) {
          map[key] = { email: key, username: msg.username, lastMessage: msg.message, lastTime: msg.created_date, unread: 0 };
        }
        if (!msg.is_admin_reply && !msg.read_by_admin) map[key].unread++;
      });
      const list = Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setChatList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (email) => {
    try {
      const msgs = await apiClient.entities.ChatMessage.filter({ user_email: email }, 'created_date', 100);
      setMessages(msgs);
      const unread = msgs.filter(m => !m.is_admin_reply && !m.read_by_admin);
      for (const m of unread) {
        await apiClient.entities.ChatMessage.update(m.id, { read_by_admin: true });
      }
      if (unread.length > 0) loadChatList();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedEmail || sending) return;
    setSending(true);
    try {
      const chat = chatList.find(c => c.email === selectedEmail);
      const userMsg = messages.find(m => !m.is_admin_reply);
      await apiClient.entities.ChatMessage.create({
        user_id: userMsg?.user_id || '',
        user_email: selectedEmail,
        username: chat?.username || 'User',
        message: newMessage.trim(),
        is_admin_reply: true,
        admin_email: currentUser.email,
        read_by_user: false
      });
      setNewMessage('');
      await loadMessages(selectedEmail);
    } catch (e) {
      console.error(e);
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading chats..." />;

  // Mobile: show conversation list OR chat window
  if (!selectedEmail) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="purple" size="xl" className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            SUPPORT CHATS
          </NeonText>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <MessageCircle className="w-12 h-12 mb-3 text-slate-600" />
              <p>No support chats yet</p>
            </div>
          ) : (
            chatList.map(chat => (
              <button
                key={chat.email}
                onClick={() => setSelectedEmail(chat.email)}
                className="w-full p-4 text-left border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{chat.username || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{chat.lastMessage}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    {chat.unread > 0 && (
                      <span className="w-5 h-5 bg-purple-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                        {chat.unread}
                      </span>
                    )}
                    <p className="text-xs text-slate-500">
                      {chat.lastTime && safeFormat(chat.lastTime, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  const chat = chatList.find(c => c.email === selectedEmail);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl">
        <button onClick={() => setSelectedEmail(null)} className="p-2">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="font-semibold text-white">{chat?.username || 'User'}</p>
          <p className="text-xs text-slate-400">{selectedEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
        {messages.length === 0 && (
          <p className="text-center text-slate-500 py-8">No messages yet</p>
        )}
        {messages.map(msg => {
          const isAdmin = msg.is_admin_reply;
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                isAdmin
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-800 text-slate-200'
              }`}>
                {!isAdmin && <p className="text-xs text-slate-400 mb-1 font-semibold">{msg.username}</p>}
                {msg.attachment_url && (
                  <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full mb-1" />
                )}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-60 mt-1 text-right">
                  {safeFormat(msg.created_date, 'h:mm a')}
                </p>
              </div>
            </div>
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
            placeholder="Type reply to user..."
            className="flex-1 bg-slate-800 border-slate-700 text-white h-12 rounded-xl"
            disabled={sending}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className={`p-3 rounded-xl transition-all ${
              newMessage.trim()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
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