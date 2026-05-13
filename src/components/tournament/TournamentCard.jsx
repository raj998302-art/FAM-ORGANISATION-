import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Users, 
  Trophy, 
  Clock, 
  MapPin, 
  Coins,
  ChevronRight,
  Flame,
  Swords
} from 'lucide-react';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import GlowCard from '../ui/GlowCard';
import GamingButton from '../ui/GamingButton';
import { cn } from '@/lib/utils';

export default function TournamentCard({ tournament, delay = 0 }) {
  const modeConfig = {
    solo: { label: 'SOLO', color: 'cyan', maxSlots: 48, icon: Users },
    duo: { label: 'DUO', color: 'purple', maxSlots: 24, icon: Users },
    squad: { label: 'SQUAD', color: 'gold', maxSlots: 12, icon: Users },
  };

  const statusConfig = {
    upcoming: { label: 'UPCOMING', color: 'blue', glow: 'blue' },
    registration_open: { label: 'JOIN NOW', color: 'green', glow: 'green' },
    registration_closed: { label: 'FULL', color: 'orange', glow: 'orange' },
    live: { label: 'LIVE', color: 'red', glow: 'red' },
    completed: { label: 'ENDED', color: 'slate', glow: 'cyan' },
    cancelled: { label: 'CANCELLED', color: 'red', glow: 'red' },
  };

  const mapImages = {
    bermuda: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
    purgatory: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=400&fit=crop',
    kalahari: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&h=400&fit=crop',
    alpine: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop',
  };

  const mode = modeConfig[tournament.mode] || modeConfig.solo;
  const status = statusConfig[tournament.status] || statusConfig.upcoming;
  const slotsLeft = tournament.max_slots - (tournament.filled_slots || 0);
  const slotPercentage = ((tournament.filled_slots || 0) / tournament.max_slots) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlowCard glowColor={status.glow} animated className="overflow-hidden">
        {/* Header Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={tournament.thumbnail_url || tournament.thumbnail || mapImages[tournament.map] || mapImages.bermuda}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          
          {/* Status Badge */}
          <div className={cn(
            'absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
            status.color === 'red' && 'bg-red-500/90 text-white animate-pulse',
            status.color === 'green' && 'bg-green-500/90 text-white',
            status.color === 'blue' && 'bg-blue-500/90 text-white',
            status.color === 'orange' && 'bg-orange-500/90 text-white',
            status.color === 'slate' && 'bg-slate-600/90 text-white',
          )}>
            {tournament.status === 'live' && <Flame className="w-3 h-3 inline mr-1 animate-pulse" />}
            {status.label}
          </div>

          {/* Mode Badge */}
          <div className={cn(
            'absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
            `bg-${mode.color}-500/20 text-${mode.color}-400 border border-${mode.color}-500/50`
          )}>
            <Swords className="w-3 h-3 inline mr-1" />
            {mode.label}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-display font-bold text-white mb-3 line-clamp-1 tracking-wide uppercase">
            {tournament.title}
          </h3>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{safeFormat(tournament.match_time, 'MMM d, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span className="capitalize">{tournament.map}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>₹{tournament.entry_fee} Entry</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Trophy className="w-4 h-4 text-green-400" />
              <span>₹{tournament.prize_pool} Prize</span>
            </div>
          </div>

          {/* Slots Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Slots</span>
              <span className="text-cyan-400 font-semibold">
                {tournament.filled_slots || 0}/{tournament.max_slots}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  slotPercentage >= 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                  slotPercentage >= 70 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                  'bg-gradient-to-r from-cyan-500 to-blue-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${slotPercentage}%` }}
                transition={{ duration: 1, delay: delay + 0.3 }}
              />
            </div>
            {slotsLeft <= 5 && slotsLeft > 0 && (
              <p className="text-orange-400 text-xs mt-1 animate-pulse">
                Only {slotsLeft} slots left!
              </p>
            )}
          </div>

          {/* Action Button */}
          <Link to={createPageUrl('TournamentDetails') + `?id=${tournament.id}`}>
            <GamingButton 
              variant={tournament.status === 'registration_open' ? 'primary' : 'outline'}
              className="w-full"
              icon={ChevronRight}
            >
              {tournament.status === 'registration_open' ? 'Join Tournament' : 'View Details'}
            </GamingButton>
          </Link>
        </div>
      </GlowCard>
    </motion.div>
  );
}