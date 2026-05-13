import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function GlowCard({ 
  children, 
  className, 
  glowColor = 'cyan',
  intensity = 'medium',
  animated = false,
  onClick,
  ...props 
}) {
  const glowColors = {
    cyan: 'shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:shadow-[0_0_50px_rgba(0,255,255,0.5)]',
    blue: 'shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)]',
    purple: 'shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]',
    green: 'shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)]',
    gold: 'shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)]',
    red: 'shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)]',
    orange: 'shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)]',
  };

  const borderColors = {
    cyan: 'border-cyan-500/30 hover:border-cyan-400/60',
    blue: 'border-blue-500/30 hover:border-blue-400/60',
    purple: 'border-purple-500/30 hover:border-purple-400/60',
    green: 'border-green-500/30 hover:border-green-400/60',
    gold: 'border-yellow-500/30 hover:border-yellow-400/60',
    red: 'border-red-500/30 hover:border-red-400/60',
    orange: 'border-orange-500/30 hover:border-orange-400/60',
  };

  return (
    <motion.div
      whileHover={animated ? { scale: 1.02, y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl transition-all duration-500',
        glowColors[glowColor],
        borderColors[glowColor],
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}