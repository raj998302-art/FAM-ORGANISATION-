import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Image as ImageIcon,
  Headphones,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import ChatBubble from '../components/chat/ChatBubble';
import { Input } from '@/components/ui/input';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const userEmailRef = React.useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user) return;
    userEmailRef.current = user.email;
    const interval = setInterval(() => loadMessages(userEmailRef.current), 4000);
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

      await loadMessages(currentUser.email);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (currentUserEmail) => {
    try {
      const email = currentUserEmail || user?.email;
      if (!email) return;
      const msgs = await apiClient.entities.ChatMessage.filter(
        { user_email: email },
        'created_date',
        200
      );
      setMessages(msgs);

      // Mark admin replies as read
      const unreadAdminReplies = msgs.filter(m => m.is_admin_reply && !m.read_by_user);
      for (const msg of unreadAdminReplies) {
        await apiClient.entities.ChatMessage.update(msg.id, { read_by_user: true });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await apiClient.entities.ChatMessage.create({
        user_id: user.id,
        user_email: user.email,
        username: profile?.username || user.full_name || 'User',
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSending(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile(file);
      
      await apiClient.entities.ChatMessage.create({
        user_id: user.id,
        user_email: user.email,
        username: profile?.username || user.full_name || 'User',
        message: '📷 Image',
        attachment_url: file_url,
        is_admin_reply: false,
        read_by_admin: false
      });

      await loadMessages();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send image');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading chat..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <NeonText color="purple" size="lg">24/7 SUPPORT</NeonText>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online • Usually replies in minutes
              </p>
            </div>
          </div>
          <button onClick={loadMessages} className="p-2">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-purple-400" />
            </div>
            <NeonText color="purple" size="lg" className="mb-2">Welcome to Support</NeonText>
            <p className="text-slate-400 text-sm max-w-xs">
              Our team is here to help you 24/7. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <ChatBubble 
                key={message.id} 
                message={message} 
                isCurrentUser={!message.is_admin_reply}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length === 0 && (
        <div className="px-4 py-2">
          <p className="text-xs text-slate-500 mb-2">Quick messages:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'How to join a tournament?',
              'Withdrawal issue',
              'Report a bug',
              'Add money to wallet'
            ].map((text) => (
              <button
                key={text}
                onClick={() => setNewMessage(text)}
                className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-slate-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="bg-slate-800/50 border-slate-700 text-white pr-12 h-12 rounded-xl"
              disabled={sending}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className={`p-3 rounded-xl transition-all ${
              newMessage.trim() 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                : 'bg-slate-800/50 text-slate-500 border border-slate-700'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}