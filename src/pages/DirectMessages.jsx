import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import GamingButton from '../components/ui/GamingButton';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import RoleBadge from '../components/ui/RoleBadge';
import { toast } from 'sonner';

export default function DirectMessages() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);
  const [allUsersData, setAllUsersData] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

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

      const allProfs = await apiClient.entities.UserProfile.list();
      setAllProfiles(allProfs.filter(p => p.user_email !== currentUser.email));
      
      const usersResponse = await apiClient.entities.User.list();
      setAllUsersData(usersResponse || []);

      await loadConversations(currentUser);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (currentUser) => {
    try {
      const dms = await apiClient.entities.DirectMessage.list('-created_date', 100);
      const uniqueUsers = new Map();

      dms.forEach(dm => {
        const otherUserId = dm.sender_email === currentUser.email ? dm.receiver_id : dm.sender_id;
        const otherUserEmail = dm.sender_email === currentUser.email ? dm.receiver_email : dm.sender_email;
        const otherUsername = dm.sender_email === currentUser.email ? dm.receiver_username : dm.sender_username;

        if (!uniqueUsers.has(otherUserId)) {
          uniqueUsers.set(otherUserId, {
            user_id: otherUserId,
            user_email: otherUserEmail,
            username: otherUsername,
            lastMessage: dm.message,
            lastMessageTime: dm.created_date,
            unread: dm.receiver_email === currentUser.email && !dm.is_read
          });
        }
      });

      setConversations(Array.from(uniqueUsers.values()));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser || !user) return;

    try {
      const dms = await apiClient.entities.DirectMessage.list('-created_date', 200);
      const filtered = dms.filter(dm => 
        (dm.sender_email === user.email && dm.receiver_email === selectedUser.user_email) ||
        (dm.receiver_email === user.email && dm.sender_email === selectedUser.user_email)
      );
      setMessages(filtered.reverse());

      // Mark as read
      const unread = filtered.filter(dm => dm.receiver_email === user.email && !dm.is_read);
      for (const dm of unread) {
        await apiClient.entities.DirectMessage.update(dm.id, { is_read: true });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedUser) return;

    setSending(true);
    try {
      await apiClient.entities.DirectMessage.create({
        sender_id: user.id,
        sender_email: user.email,
        sender_username: profile?.username || 'Player',
        receiver_id: selectedUser.user_id,
        receiver_email: selectedUser.user_email,
        receiver_username: selectedUser.username,
        message: newMessage.trim(),
        is_read: false
      });

      setNewMessage('');
      await loadMessages();
      await loadConversations(user); // refresh recent messages list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startConversation = (userProfile) => {
    setSelectedUser({
      user_id: userProfile.user_id,
      user_email: userProfile.user_email,
      username: userProfile.username
    });
    setSearchQuery('');
  };

  const filteredUsers = allProfiles.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.ff_uid?.includes(searchQuery)
  );

  const getUserRole = (userEmail) => {
    const userRecord = allUsersData.find(u => u.email === userEmail);
    if (!userRecord) return 'player';
    if (userRecord.roles && Array.isArray(userRecord.roles) && userRecord.roles.length > 0) return userRecord.roles[0];
    if (userRecord.role) return userRecord.role;
    return 'player';
  };

  if (loading) {
    return <LoadingScreen message="Loading messages..." />;
  }

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-slate-950 pb-24 pt-20">
        <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <NeonText color="purple" size="xl" className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-6 h-6" />
            DIRECT MESSAGES
          </NeonText>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-slate-800 border-slate-700 text-white"
            icon={Search}
          />
        </div>

        <div className="p-4 space-y-2">
          {searchQuery ? (
            <>
              <p className="text-slate-400 text-sm mb-2">Search Results</p>
              {filteredUsers.map(u => (
                <motion.div
                  key={u.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => startConversation(u)}
                  className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-cyan-400">{u.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="font-semibold text-white">{u.username}</p>
                         {getUserRole(u.user_email) !== 'player' && (
                            <RoleBadge role={getUserRole(u.user_email)} size="xs" />
                         )}
                      </div>
                      <p className="text-xs text-slate-400">Level {u.level || 1} • UID: {u.ff_uid || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-2">Recent Conversations</p>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No conversations yet</p>
                  <p className="text-slate-500 text-sm">Search for users to start chatting</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <motion.div
                    key={conv.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedUser(conv)}
                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-400">{conv.username?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{conv.username}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{conv.lastMessage}</p>
                        </div>
                      </div>
                      {conv.unread && (
                        <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 pt-20 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center gap-3">
        <button onClick={() => { setSelectedUser(null); loadConversations(user); }}>
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <p className="font-bold text-white">{selectedUser.username}</p>
          <p className="text-xs text-slate-400">Direct Message</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_email === user.email;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%]`}>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className={`text-xs text-slate-600 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
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