import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Crown, Award, Star, Shield, Gem, Flame, Sparkles } from 'lucide-react';

export default function RankBadge({ rank, size = 'md' }) {
  const rankConfig = {
    bronze: {
      icon: Shield,
      color: 'from-amber-700 to-amber-500',
      textColor: 'text-amber-500',
      glow: 'shadow-[0_0_15px_rgba(180,83,9,0.5)]',
      label: 'Bronze'
    },
    silver: {
      icon: Award,
      color: 'from-slate-400 to-slate-300',
      textColor: 'text-slate-300',
      glow: 'shadow-[0_0_15px_rgba(203,213,225,0.5)]',
      label: 'Silver'
    },
    gold: {
      icon: Star,
      color: 'from-yellow-500 to-amber-400',
      textColor: 'text-yellow-400',
      glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      label: 'Gold'
    },
    platinum: {
      icon: Gem,
      color: 'from-cyan-400 to-teal-300',
      textColor: 'text-cyan-300',
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]',
      label: 'Platinum'
    },
    diamond: {
      icon: Sparkles,
      color: 'from-blue-400 to-purple-400',
      textColor: 'text-blue-300',
      glow: 'shadow-[0_0_15px_rgba(147,51,234,0.5)]',
      label: 'Diamond'
    },
    heroic: {
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      textColor: 'text-orange-400',
      glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
      label: 'Heroic'
    },
    master: {
      icon: Crown,
      color: 'from-red-500 via-purple-500 to-blue-500',
      textColor: 'text-purple-400',
      glow: 'shadow-[0_0_18px_rgba(168,85,247,0.6)]',
      label: 'Master'
    },
    grandmaster: {
      icon: Crown,
      color: 'from-purple-500 via-pink-500 to-red-500',
      textColor: 'text-pink-400',
      glow: 'shadow-[0_0_20px_rgba(236,72,153,0.6)]',
      label: 'Grandmaster'
    }
  };

  const config = rankConfig[rank] || rankConfig.bronze;
  const Icon = config.icon;

  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-[10px]' },
    md: { container: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-xs' },
    lg: { container: 'w-28 h-28', icon: 'w-12 h-12', text: 'text-sm' },
  };

  const sizeConfig = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl',
        sizeConfig.container
      )}
    >
      {/* Background */}
      <div className={cn(
        'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20',
        config.color
      )} />

      {/* Border glow */}
      <div className={cn(
        'absolute inset-0 rounded-2xl border-2 border-white/10',
        config.glow
      )} />

      {/* Content */}
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Icon className={cn(sizeConfig.icon, config.textColor)} />
      </motion.div>
      <span className={cn(
        'font-display font-bold uppercase tracking-widest mt-1',
        sizeConfig.text,
        config.textColor
      )}>
        {config.label}
      </span>
    </motion.div>
  );
}