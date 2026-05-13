import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function LevelProgress({ level, xp }) {
  const xpPerLevel = 1000;
  const currentLevelXp = xp % xpPerLevel;
  const progress = (currentLevelXp / xpPerLevel) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-lg font-black text-cyan-400">{level}</span>
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-white">Level {level}</p>
            <p className="text-xs text-slate-400">Player Rank</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-400">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{currentLevelXp}</span>
            <span className="text-slate-500">/ {xpPerLevel}</span>
          </div>
          <p className="text-xs text-slate-400">XP to next level</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}