import React from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/apiClient';
import { ShieldX, LogOut, RefreshCw } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600/30 to-orange-600/20 border border-red-500/30 mb-6 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
        >
          <ShieldX className="w-12 h-12 text-red-400" />
        </motion.div>

        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-3">
          Access Restricted
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Your account is not registered for <span className="text-cyan-400 font-bold">FIRE ARENA MAX</span>. Please contact an admin to get access.
        </p>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 mb-6 text-left">
          <p className="text-slate-300 text-sm font-semibold mb-3">What you can do:</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Make sure you're using the correct account</li>
            <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Contact admin to get registered</li>
            <li className="flex items-center gap-2"><span className="text-cyan-400">✓</span> Try logging out and using a different account</li>
          </ul>
        </div>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => apiClient.auth.logout('/')}
            className="w-full py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            <LogOut className="w-5 h-5" />
            Logout & Try Another Account
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="w-full py-3 flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium rounded-2xl border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}