import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Filter, 
  Search, 
  Flame,
  History,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import TournamentCard from '../components/tournament/TournamentCard';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await apiClient.entities.Tournament.list('-match_time', 50);
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    // Status filter
    if (filter === 'live' && tournament.status !== 'live') return false;
    if (filter === 'upcoming' && !['upcoming', 'registration_open'].includes(tournament.status)) return false;
    if (filter === 'completed' && tournament.status !== 'completed') return false;

    // Mode filter
    if (modeFilter !== 'all' && tournament.mode !== modeFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return tournament.title?.toLowerCase().includes(query) || 
             tournament.map?.toLowerCase().includes(query);
    }

    return true;
  });

  const statusCounts = {
    live: tournaments.filter(t => t.status === 'live').length,
    upcoming: tournaments.filter(t => ['upcoming', 'registration_open'].includes(t.status)).length,
    completed: tournaments.filter(t => t.status === 'completed').length,
  };

  if (loading) {
    return <LoadingScreen message="Loading tournaments..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
            <Trophy className="w-7 h-7" />
            TOURNAMENTS
          </NeonText>
          <p className="text-slate-400 mt-1">Find and join exciting matches</p>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12 rounded-xl"
          />
        </div>
      </motion.div>

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full bg-slate-900/50 border border-slate-700 p-1 h-auto grid grid-cols-4">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 py-2"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-400 py-2 relative"
            >
              <Flame className="w-4 h-4 mr-1 inline" />
              Live
              {statusCounts.live > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  {statusCounts.live}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-slate-400 py-2"
            >
              Open
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-slate-500/20 data-[state=active]:text-slate-300 text-slate-400 py-2"
            >
              <History className="w-4 h-4 mr-1 inline" />
              Past
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Mode Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-slate-400 text-sm mb-3"
        >
          <Filter className="w-4 h-4" />
          Filter by mode
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-2">
                {['all', 'solo', 'duo', 'squad'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setModeFilter(mode)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      modeFilter === mode
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Live Tournaments */}
      {filter !== 'completed' && filteredTournaments.filter(t => t.status === 'live').length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <NeonText color="red" size="sm">LIVE NOW</NeonText>
          </div>
          <div className="space-y-4">
            {filteredTournaments
              .filter(t => t.status === 'live')
              .map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} delay={index * 0.05} />
              ))}
          </div>
        </div>
      )}

      {/* Other Tournaments */}
      <div className="space-y-4">
        {filteredTournaments
          .filter(t => filter === 'completed' ? t.status === 'completed' : t.status !== 'live')
          .map((tournament, index) => (
            <TournamentCard key={tournament.id} tournament={tournament} delay={index * 0.05} />
          ))}
      </div>

      {/* Empty State */}
      {filteredTournaments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GlowCard glowColor="cyan" className="p-8 text-center">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <NeonText color="cyan" size="lg" className="block mb-2">No Tournaments Found</NeonText>
            <p className="text-slate-400">
              {searchQuery 
                ? `No tournaments match "${searchQuery}"`
                : 'Check back soon for new tournaments!'
              }
            </p>
          </GlowCard>
        </motion.div>
      )}
    </div>
  );
}