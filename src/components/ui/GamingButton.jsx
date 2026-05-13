import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function GamingButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  onClick,
  ...props 
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 text-slate-900 font-bold shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
    secondary: 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]',
    success: 'bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 text-slate-900 font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]',
    danger: 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]',
    gold: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-slate-900 font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]',
    outline: 'bg-transparent border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400',
    ghost: 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 border border-slate-600/50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl',
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.03, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden font-display uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5" />
      ) : null}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}