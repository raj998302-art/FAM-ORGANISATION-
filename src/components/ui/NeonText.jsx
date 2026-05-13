import React from 'react';
import { cn } from '@/lib/utils';

export default function NeonText({ 
  children, 
  color = 'cyan', 
  size = 'md',
  className,
  glow = true,
  ...props 
}) {
  const colors = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    gold: 'text-yellow-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    white: 'text-white',
  };

  const glowStyles = {
    cyan: '[text-shadow:0_0_10px_rgba(0,255,255,0.8),0_0_20px_rgba(0,255,255,0.6),0_0_30px_rgba(0,255,255,0.4)]',
    blue: '[text-shadow:0_0_10px_rgba(59,130,246,0.8),0_0_20px_rgba(59,130,246,0.6),0_0_30px_rgba(59,130,246,0.4)]',
    purple: '[text-shadow:0_0_10px_rgba(168,85,247,0.8),0_0_20px_rgba(168,85,247,0.6),0_0_30px_rgba(168,85,247,0.4)]',
    green: '[text-shadow:0_0_10px_rgba(34,197,94,0.8),0_0_20px_rgba(34,197,94,0.6),0_0_30px_rgba(34,197,94,0.4)]',
    gold: '[text-shadow:0_0_10px_rgba(234,179,8,0.8),0_0_20px_rgba(234,179,8,0.6),0_0_30px_rgba(234,179,8,0.4)]',
    red: '[text-shadow:0_0_10px_rgba(239,68,68,0.8),0_0_20px_rgba(239,68,68,0.6),0_0_30px_rgba(239,68,68,0.4)]',
    orange: '[text-shadow:0_0_10px_rgba(249,115,22,0.8),0_0_20px_rgba(249,115,22,0.6),0_0_30px_rgba(249,115,22,0.4)]',
    white: '[text-shadow:0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(255,255,255,0.6),0_0_30px_rgba(255,255,255,0.4)]',
  };

  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  };

  return (
    <span
      className={cn(
        colors[color],
        sizes[size],
        glow && glowStyles[color],
        'font-display font-bold tracking-widest uppercase',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}