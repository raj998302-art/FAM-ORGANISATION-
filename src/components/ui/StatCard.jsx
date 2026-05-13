import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import GlowCard from './GlowCard';

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendUp = true,
  color = 'cyan',
  delay = 0 
}) {
  const iconColors = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    green: 'text-green-400 bg-green-500/10',
    gold: 'text-yellow-400 bg-yellow-500/10',
    red: 'text-red-400 bg-red-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlowCard glowColor={color} className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-3 rounded-xl', iconColors[color])}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              trendUp ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            )}>
              {trendUp ? '+' : ''}{trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-display font-bold text-white tracking-wider">{value}</p>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest text-[10px]">{label}</p>
        </div>
      </GlowCard>
    </motion.div>
  );
}