import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Shield } from 'lucide-react';
import NeonText from '../components/ui/NeonText';
import GlowCard from '../components/ui/GlowCard';

export default function ChatsHub() {
  const chatOptions = [
    {
      title: 'Public Lobby',
      description: 'Chat with all players in real-time',
      icon: Users,
      color: 'cyan',
      path: 'PublicChat'
    },
    {
      title: 'Direct Messages',
      description: 'Private conversations with friends',
      icon: MessageCircle,
      color: 'purple',
      path: 'DirectMessages'
    },
    {
      title: 'Support Chat',
      description: 'Get help from community admins',
      icon: Shield,
      color: 'green',
      path: 'Chat'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="cyan" size="2xl" className="mb-2">
          CHAT ROOMS
        </NeonText>
        <p className="text-slate-400">Choose a chat room to connect</p>
      </motion.div>

      <div className="space-y-4">
        {chatOptions.map((option, index) => (
          <motion.div
            key={option.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={createPageUrl(option.path)}>
              <GlowCard glowColor={option.color} className="p-6" animated>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-${option.color}-500/20 border border-${option.color}-500/30 flex items-center justify-center`}>
                    <option.icon className={`w-7 h-7 text-${option.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{option.title}</h3>
                    <p className="text-slate-400 text-sm">{option.description}</p>
                  </div>
                </div>
              </GlowCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}