import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award,
  TrendingUp,
  Target,
  Zap,
  Flame
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import AppEmoji from '../components/ui/AppEmoji';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('wins');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await apiClient.auth.me();
      setCurrentUser(user);

      const allProfiles = await apiClient.entities.UserProfile.list();
      setProfiles(allProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedProfiles = () => {
    const sorted = [...profiles].sort((a, b) => {
      if (filter === 'wins') return (b.tournaments_won || 0) - (a.tournaments_won || 0);
      if (filter === 'kills') return (b.total_kills || 0) - (a.total_kills || 0);
      if (filter === 'earnings') return (b.total_earnings || 0) - (a.total_earnings || 0);
      if (filter === 'level') return (b.level || 1) - (a.level || 1);
      return 0;
    });
    return sorted.slice(0, 100);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <AppEmoji name="gold1st" size={28} />;
    if (index === 1) return <AppEmoji name="silver2nd" size={28} />;
    if (index === 2) return <AppEmoji name="bronze3rd" size={28} />;
    return null;
  };

  const getStatValue = (profile) => {
    if (filter === 'wins') return profile.tournaments_won || 0;
    if (filter === 'kills') return profile.total_kills || 0;
    if (filter === 'earnings') return `₹${profile.total_earnings || 0}`;
    if (filter === 'level') return `Level ${profile.level || 1}`;
    return 0;
  };

  const sortedProfiles = getSortedProfiles();
  const currentUserRank = sortedProfiles.findIndex(p => p.user_email === currentUser?.email) + 1;

  if (loading) {
    return <LoadingScreen message="Loading leaderboard..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="gold" size="2xl" className="flex items-center gap-2 mb-2">
          <Trophy className="w-7 h-7" />
          LEADERBOARD
        </NeonText>
        <p className="text-slate-400">Top players competing for glory</p>
      </motion.div>

      {/* Your Rank */}
      {currentUserRank > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard glowColor="cyan" className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-widest text-[10px]">Your Rank</p>
                  <p className="text-3xl font-display font-bold text-white">#{currentUserRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 uppercase tracking-widest text-[10px]">Score</p>
                <p className="text-2xl font-display font-bold text-cyan-400">
                  {getStatValue(sortedProfiles[currentUserRank - 1])}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full bg-slate-900/50 border border-slate-700 p-1 h-auto grid grid-cols-4">
            <TabsTrigger 
              value="wins" 
              className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-yellow-400 text-slate-400 py-2"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Wins
            </TabsTrigger>
            <TabsTrigger 
              value="kills" 
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-400 py-2"
            >
              <Target className="w-4 h-4 mr-1" />
              Kills
            </TabsTrigger>
            <TabsTrigger 
              value="earnings" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-slate-400 py-2"
            >
              <Zap className="w-4 h-4 mr-1" />
              Earnings
            </TabsTrigger>
            <TabsTrigger 
              value="level" 
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-slate-400 py-2"
            >
              <Flame className="w-4 h-4 mr-1" />
              Level
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Top 3 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((index) => {
            const profile = sortedProfiles[index];
            if (!profile) return null;
            
            return (
              <GlowCard 
                key={index}
                glowColor={index === 0 ? 'gold' : index === 1 ? 'cyan' : 'orange'}
                className={cn(
                  "p-3 text-center",
                  index === 0 && "order-2 scale-105"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center",
                  index === 0 ? "bg-yellow-500/20 border-2 border-yellow-400" :
                  index === 1 ? "bg-slate-400/20 border-2 border-slate-300" :
                  "bg-amber-600/20 border-2 border-amber-500"
                )}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getRankIcon(index)
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate">{profile.username}</p>
                <p className={cn(
                  "text-xl font-display font-bold mt-1 tracking-wider",
                  index === 0 ? "text-yellow-400" :
                  index === 1 ? "text-slate-300" :
                  "text-amber-500"
                )}>
                  {getStatValue(profile)}
                </p>
              </GlowCard>
            );
          })}
        </div>
      </motion.div>

      {/* Rankings List */}
      <div className="space-y-2">
        {sortedProfiles.slice(3).map((profile, index) => {
          const actualRank = index + 4;
          const isCurrentUser = profile.user_email === currentUser?.email;
          
          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.02 }}
            >
              <GlowCard 
                glowColor={isCurrentUser ? 'cyan' : 'slate'}
                className={cn(
                  "p-3",
                  isCurrentUser && "border-cyan-500/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                      actualRank <= 10 ? "bg-slate-700 text-slate-200" : "bg-slate-800 text-slate-500"
                    )}>
                      {actualRank}
                    </span>
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="" 
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-400 font-bold">
                          {profile.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className={cn(
                        "font-medium",
                        isCurrentUser ? "text-cyan-400" : "text-white"
                      )}>
                        {profile.username}
                        {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{profile.rank || 'bronze'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{getStatValue(profile)}</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}