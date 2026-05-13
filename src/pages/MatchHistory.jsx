import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { 
  History, 
  Trophy, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Award,
  Flame
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import StatCard from '../components/ui/StatCard';
import LoadingScreen from '../components/ui/LoadingScreen';
import { cn } from '@/lib/utils';

export default function MatchHistory() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    top3: 0,
    totalKills: 0,
    winRate: 0,
    avgPosition: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await apiClient.auth.me();
      
      const history = await apiClient.entities.MatchHistory.filter(
        { user_email: user.email },
        '-match_date',
        50
      );
      setMatches(history);

      // Calculate stats
      const totalMatches = history.length;
      const wins = history.filter(m => m.position === 1).length;
      const top3 = history.filter(m => m.position <= 3).length;
      const totalKills = history.reduce((sum, m) => sum + (m.kills || 0), 0);
      const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;
      const avgPosition = totalMatches > 0 ? (history.reduce((sum, m) => sum + (m.position || 0), 0) / totalMatches).toFixed(1) : 0;

      setStats({ totalMatches, wins, top3, totalKills, winRate, avgPosition });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result) => {
    if (result === 'win') return 'green';
    if (result === 'top3') return 'yellow';
    if (result === 'top10') return 'blue';
    return 'slate';
  };

  const getResultIcon = (result) => {
    if (result === 'win') return <Trophy className="w-4 h-4" />;
    if (result === 'top3') return <Award className="w-4 h-4" />;
    if (result === 'top10') return <Flame className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const getResultLabel = (result) => {
    if (result === 'win') return 'VICTORY';
    if (result === 'top3') return 'TOP 3';
    if (result === 'top10') return 'TOP 10';
    return 'PARTICIPATED';
  };

  if (loading) {
    return <LoadingScreen message="Loading history..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
          <History className="w-7 h-7" />
          MATCH HISTORY
        </NeonText>
        <p className="text-slate-400 mt-1">Your tournament performance</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <StatCard
          icon={Trophy}
          label="Wins"
          value={stats.wins}
          color="gold"
        />
        <StatCard
          icon={Target}
          label="Total Kills"
          value={stats.totalKills}
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Win Rate"
          value={`${stats.winRate}%`}
          color="green"
        />
      </motion.div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlowCard glowColor="purple" className="p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-400">{stats.totalMatches}</p>
              <p className="text-xs text-slate-400">Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.top3}</p>
              <p className="text-xs text-slate-400">Top 3</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">#{stats.avgPosition}</p>
              <p className="text-xs text-slate-400">Avg Position</p>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Match List */}
      <div className="space-y-3">
        {matches.length === 0 ? (
          <GlowCard glowColor="cyan" className="p-8 text-center">
            <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <NeonText color="cyan" size="lg" className="block mb-2">No Matches Yet</NeonText>
            <p className="text-slate-400">Join tournaments to build your match history</p>
          </GlowCard>
        ) : (
          matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <GlowCard glowColor={getResultColor(match.match_result)} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold uppercase flex items-center gap-1",
                        match.match_result === 'win' && "bg-green-500/20 text-green-400",
                        match.match_result === 'top3' && "bg-yellow-500/20 text-yellow-400",
                        match.match_result === 'top10' && "bg-blue-500/20 text-blue-400",
                        match.match_result === 'participated' && "bg-slate-500/20 text-slate-400"
                      )}>
                        {getResultIcon(match.match_result)}
                        {getResultLabel(match.match_result)}
                      </span>
                      <span className="text-xs text-slate-500 uppercase">{match.mode}</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm">{match.tournament_title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {safeFormat(match.match_date, 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Position</p>
                    <p className="text-lg font-bold text-white">#{match.position || '-'}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Kills</p>
                    <p className="text-lg font-bold text-red-400">{match.kills || 0}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Entry</p>
                    <p className="text-sm font-bold text-orange-400">₹{match.entry_fee}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">Prize</p>
                    <p className={cn(
                      "text-sm font-bold",
                      match.prize_won > 0 ? "text-green-400" : "text-slate-500"
                    )}>
                      {match.prize_won > 0 ? `+₹${match.prize_won}` : '-'}
                    </p>
                  </div>
                </div>

                {/* Net Result */}
                {match.prize_won > 0 && (
                  <div className={cn(
                    "mt-3 p-2 rounded-lg text-center text-sm font-semibold",
                    match.prize_won > match.entry_fee 
                      ? "bg-green-500/10 text-green-400" 
                      : "bg-red-500/10 text-red-400"
                  )}>
                    {match.prize_won > match.entry_fee ? (
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Profit: ₹{match.prize_won - match.entry_fee}
                      </div>
                    ) : match.prize_won === match.entry_fee ? (
                      <div className="flex items-center justify-center gap-1">
                        <Minus className="w-4 h-4" />
                        Break Even
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        Loss: ₹{match.entry_fee - match.prize_won}
                      </div>
                    )}
                  </div>
                )}
              </GlowCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}