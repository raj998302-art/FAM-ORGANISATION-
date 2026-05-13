import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Users, Swords, RefreshCw } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { createPageUrl } from '@/utils';

// Bracket round labels
const ROUND_LABELS = ['Round 1', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];

function BracketMatch({ match, index, roundIndex }) {
  const isWinner = (slot) => match.winner && match.winner === slot?.uid;
  const isPending = !match.winner;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 + roundIndex * 0.1 }}
      className="relative"
    >
      <div className={`rounded-xl border overflow-hidden ${
        isPending ? 'border-slate-700/60 bg-slate-800/40' :
        'border-cyan-500/40 bg-slate-800/60'
      }`}>
        {/* Match number */}
        <div className="px-3 py-1 bg-slate-900/50 border-b border-slate-700/40">
          <span className="text-slate-500 text-xs">Match {index + 1}</span>
        </div>
        {/* Players */}
        {[match.player1, match.player2].map((slot, si) => {
          const won = isWinner(slot);
          const lost = match.winner && !won && slot?.uid;
          return (
            <div key={si} className={`flex items-center gap-3 px-3 py-2.5 ${
              si === 0 ? 'border-b border-slate-700/30' : ''
            } ${won ? 'bg-cyan-500/10' : lost ? 'opacity-50' : ''}`}>
              {slot ? (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    won ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {slot.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${won ? 'text-cyan-400' : 'text-white'}`}>
                      {slot.username || 'Player'}
                    </p>
                    {slot.score !== undefined && (
                      <p className="text-xs text-slate-500">{slot.score} pts</p>
                    )}
                  </div>
                  {won && <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                </>
              ) : (
                <p className="text-slate-600 text-sm italic">TBD</p>
              )}
            </div>
          );
        })}
      </div>
      {/* Connector lines */}
      <div className="absolute right-0 top-1/2 w-4 h-0.5 bg-slate-700" style={{ transform: 'translateX(100%) translateY(-50%)' }} />
    </motion.div>
  );
}

export default function TournamentBracket() {
  const navigate = useNavigate();
  const location = useLocation();
  const tournamentId = new URLSearchParams(location.search).get('id');
  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bracket'); // bracket | participants | results

  useEffect(() => {
    if (tournamentId) load();
    // Poll every 30s for live updates
    const interval = setInterval(() => { if (tournamentId) load(); }, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const load = async () => {
    try {
      const t = await apiClient.entities.Tournament.get(tournamentId);
      setTournament(t);
      // Load bracket data
      const brackets = await apiClient.entities.TournamentBracket.filter({ tournament_id: tournamentId }).catch(() => []);
      if (brackets.length > 0) setBracket(brackets[0]);
    } catch {}
    finally { setLoading(false); }
  };

  const generateDraw = async () => {
    try {
      // Load participants
      const parts = await apiClient.entities.TournamentParticipant.filter({ tournament_id: tournamentId }).catch(() => []);
      if (parts.length < 2) { return; }
      // Shuffle participants randomly
      const shuffled = [...parts].sort(() => Math.random() - 0.5);
      // Create round 1 matches
      const matches = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({
          match_number: Math.floor(i / 2) + 1,
          round: 1,
          player1: shuffled[i] ? { uid: shuffled[i].user_uid || shuffled[i].user_email, username: shuffled[i].username } : null,
          player2: shuffled[i + 1] ? { uid: shuffled[i + 1].user_uid || shuffled[i + 1].user_email, username: shuffled[i + 1].username } : null,
          winner: null,
          status: 'pending',
        });
      }
      const bracketData = {
        tournament_id: tournamentId,
        rounds: [{ round: 1, label: 'Round 1', matches }],
        total_rounds: Math.ceil(Math.log2(shuffled.length)),
        total_participants: shuffled.length,
        generated_at: new Date().toISOString(),
        status: 'active',
      };
      if (bracket?.id) {
        await apiClient.entities.TournamentBracket.update(bracket.id, bracketData);
      } else {
        await apiClient.entities.TournamentBracket.create(bracketData);
      }
      await load();
    } catch (e) { console.error(e); }
  };

  if (loading) return <LoadingScreen message="Loading bracket..." />;
  if (!tournament) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">Tournament not found</p>
    </div>
  );

  const rounds = bracket?.rounds || [];
  const participants = tournament.participants || [];
  const results = tournament.results || [];

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <NeonText color="cyan" size="lg">BRACKET</NeonText>
          <p className="text-slate-400 text-xs truncate">{tournament.title}</p>
        </div>
        <button onClick={load} className="p-2 bg-slate-800/50 rounded-xl">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Tournament info pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-full">
          {tournament.mode?.toUpperCase()}
        </span>
        <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">
          {tournament.current_players || 0}/{tournament.max_slots} players
        </span>
        <span className="px-3 py-1 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-full">
          Prize: ₹{tournament.prize_pool}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['bracket', 'Bracket'], ['participants', 'Players'], ['results', 'Results']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              tab === t ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>{l}</button>
        ))}
      </div>

      {/* Bracket Tab */}
      {tab === 'bracket' && (
        <div>
          {!bracket ? (
            <GlowCard glowColor="cyan" className="p-8 text-center">
              <AppEmoji name="trophy" size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-white font-bold mb-1">Draw Not Generated Yet</p>
              <p className="text-slate-400 text-sm mb-4">The tournament bracket will be revealed when admin generates the draw.</p>
            </GlowCard>
          ) : (
            <div className="overflow-x-auto pb-4 no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
              <div className="flex gap-8 min-w-max">
                {rounds.map((round, ri) => (
                  <div key={ri} className="w-56">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-3 text-center">
                      {round.label || `Round ${round.round}`}
                    </p>
                    <div className="space-y-4">
                      {(round.matches || []).map((match, mi) => (
                        <BracketMatch key={mi} match={match} index={mi} roundIndex={ri} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {rounds.length === 0 && (
                <p className="text-slate-400 text-center py-8">No rounds in bracket yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {tab === 'participants' && (
        <div className="space-y-3">
          {participants.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No participants yet</div>
          ) : participants.map((p, i) => (
            <GlowCard key={i} glowColor="cyan" className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center font-black text-cyan-400 text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{p.username || p.ign || 'Player'}</p>
                  {p.ff_uid && <p className="text-slate-500 text-xs">UID: {p.ff_uid}</p>}
                </div>
                {p.registered_at && (
                  <p className="text-slate-600 text-xs">{new Date(p.registered_at).toLocaleDateString('en-IN')}</p>
                )}
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      {/* Results Tab */}
      {tab === 'results' && (
        <div>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <AppEmoji name="trophy" size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-slate-400">Results not uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.sort((a, b) => a.position - b.position).map((r, i) => (
                <GlowCard key={i} glowColor={i === 0 ? 'gold' : i === 1 ? 'cyan' : 'purple'} className="p-4">
                  <div className="flex items-center gap-4">
                    <AppEmoji name={i === 0 ? 'gold1st' : i === 1 ? 'silver2nd' : i === 2 ? 'bronze3rd' : 'medal'} size={32} />
                    <div className="flex-1">
                      <p className="text-white font-bold">{r.username || r.ign}</p>
                      {r.kills !== undefined && <p className="text-slate-400 text-xs">{r.kills} kills</p>}
                    </div>
                    {r.prize_won > 0 && (
                      <div className="text-right">
                        <p className="text-green-400 font-black text-lg">₹{r.prize_won}</p>
                        <p className="text-slate-500 text-xs">Prize</p>
                      </div>
                    )}
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
