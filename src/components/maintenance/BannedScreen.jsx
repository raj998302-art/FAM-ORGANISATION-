import React from 'react';
import { motion } from 'framer-motion';
import { ShieldBan, AlertOctagon, Mail } from 'lucide-react';
import GamingButton from '../ui/GamingButton';
import { apiClient } from '@/api/apiClient';

export default function BannedScreen({ reason, bannedAt }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 p-6">
      {/* Red gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-slate-950 to-slate-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <motion.div
          className="mx-auto mb-8 w-32 h-32 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/30 flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 30px rgba(239,68,68,0.2)',
              '0 0 60px rgba(239,68,68,0.4)',
              '0 0 30px rgba(239,68,68,0.2)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldBan className="w-16 h-16 text-red-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-4"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ACCOUNT SUSPENDED
        </motion.h1>

        {/* Alert */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Access Denied</span>
        </div>

        {/* Message */}
        <p className="text-slate-400 mb-6 leading-relaxed">
          Your account has been suspended due to violation of our community guidelines or terms of service.
        </p>

        {/* Reason Box */}
        {reason && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm font-medium mb-1">Reason:</p>
            <p className="text-slate-300">{reason}</p>
          </div>
        )}

        {/* Ban Date */}
        {bannedAt && (
          <p className="text-slate-500 text-sm mb-8">
            Suspended on: {new Date(bannedAt).toLocaleDateString()}
          </p>
        )}

        {/* Contact Support */}
        <GamingButton
          variant="outline"
          icon={Mail}
          onClick={() => window.open('mailto:support@firearena.com', '_blank')}
        >
          Contact Support
        </GamingButton>

        {/* Logout */}
        <button
          onClick={() => apiClient.auth.logout()}
          className="mt-4 text-slate-500 hover:text-slate-400 text-sm underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}