import React from 'react';
import { Crown, Shield, Star, Sparkles, User, Zap, Wrench, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/roles';

const getRoleConfig = (role) => {
  if (role === 'owner') return { icon: Crown, color: 'from-red-600 to-red-500', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.9)] border border-red-500/50' };
  if (role === 'co_owner') return { icon: Crown, color: 'from-orange-500 to-red-500', glow: 'shadow-[0_0_18px_rgba(249,115,22,0.6)]' };
  if (role === 'fam_manager') return { icon: Crown, color: 'from-pink-500 to-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.6)]' };

  if (role?.includes('payment')) return { icon: Zap, color: 'from-green-500 to-emerald-400', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.5)]' };
  if (role?.includes('technical')) return { icon: Wrench, color: 'from-blue-500 to-cyan-500', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]' };
  if (role?.includes('tournament') && role?.includes('vip')) return { icon: Trophy, color: 'from-yellow-500 to-amber-400', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.5)]' };
  if (role?.includes('tournament')) return { icon: Trophy, color: 'from-orange-500 to-amber-400', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]' };
  if (role?.includes('forms')) return { icon: Users, color: 'from-teal-500 to-cyan-400', glow: '' };
  if (role?.includes('team')) return { icon: Users, color: 'from-indigo-500 to-blue-400', glow: '' };
  if (role?.includes('achievements')) return { icon: Award, color: 'from-amber-500 to-yellow-400', glow: '' };
  if (role?.includes('vip_zone')) return { icon: Star, color: 'from-violet-500 to-purple-400', glow: '' };
  if (role?.includes('community')) return { icon: Users, color: 'from-pink-500 to-rose-400', glow: '' };
  if (role?.includes('moderator')) return { icon: Shield, color: 'from-blue-500 to-cyan-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]' };
  if (role?.includes('admin')) return { icon: Shield, color: 'from-purple-500 to-pink-500', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]' };

  if (role === 'vip_elite') return { icon: Crown, color: 'from-yellow-400 to-orange-400', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]' };
  if (role === 'vip_plus') return { icon: Sparkles, color: 'from-purple-500 to-pink-400', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]' };
  if (role === 'vip') return { icon: Star, color: 'from-cyan-500 to-blue-400', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.4)]' };

  return { icon: User, color: 'from-slate-600 to-slate-500', glow: '' };
};

// Dummy Trophy for import
function Trophy({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export default function RoleBadge({ role, size = 'sm', showLabel = true, className }) {
  const config = getRoleConfig(role);
  const Icon = config.icon;
  const label = getRoleLabel(role);

  const sizes = {
    xs: { icon: 'w-2.5 h-2.5', text: 'text-[9px]', padding: 'px-1.5 py-0.5 gap-0.5' },
    sm: { icon: 'w-3.5 h-3.5', text: 'text-[11px]', padding: 'px-2 py-0.5 gap-1' },
    md: { icon: 'w-4 h-4', text: 'text-xs', padding: 'px-2.5 py-1 gap-1.5' },
    lg: { icon: 'w-5 h-5', text: 'text-sm', padding: 'px-3 py-1.5 gap-2' }
  };

  const s = sizes[size] || sizes.sm;

  return (
    <div className={cn(
      'inline-flex items-center rounded-full bg-gradient-to-r font-bold text-white',
      config.color,
      config.glow,
      s.padding,
      className
    )}>
      <Icon className={s.icon} />
      {showLabel && <span className={s.text}>{label}</span>}
    </div>
  );
}