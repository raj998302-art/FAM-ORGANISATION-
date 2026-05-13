import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Coins, Calendar, TrendingUp } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { format } from 'date-fns';

const safeFormat = (v, f = 'MMM d, yyyy') => {
  try { const d = new Date(v); if (!v || isNaN(d.getTime())) return '—'; return format(d, f); } catch { return '—'; }
};

export default function PrizeHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0, best: 0 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      const [txns, matches] = await Promise.all([
        apiClient.entities.Transaction.filter({ user_email: cu.email, type: 'prize' }, '-created_date', 50).catch(() => []),
        apiClient.entities.MatchHistory.filter({ user_email: cu.email }, '-match_date', 50).catch(() => []),
      ]);
      // Combine prize transactions and match history
      const prizeTxns = (Array.isArray(txns) ? txns : []).map(t => ({
        id: t.id,
        tournament_name: t.description || t.tournament_name || 'Tournament',
        amount: t.amount || 0,
        date: t.created_date,
        position: t.position || null,
        kills: t.kills || null,
        source: 'transaction',
      }));
      const matchPrizes = (Array.isArray(matches) ? matches : [])
        .filter(m => m.prize_won > 0)
        .map(m => ({
          id: 'match_' + m.id,
          tournament_name: m.tournament_name || 'Tournament',
          amount: m.prize_won,
          date: m.match_date,
          position: m.position,
          kills: m.kills,
          source: 'match',
        }));
      const all = [...prizeTxns, ...matchPrizes]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const unique = all.filter((v, i, self) =>
        self.findIndex(t => t.tournament_name === v.tournament_name && t.date?.slice(0, 10) === v.date?.slice(0, 10)) === i
      );

      setPrizes(unique);
      const total = unique.reduce((s, p) => s + (p.amount || 0), 0);
      setStats({ total, count: unique.length, best: Math.max(...unique.map(p => p.amount || 0), 0) });
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen message="Loading prize history..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
        <NeonText color="gold" size="2xl" className="flex items-center gap-2">
          <AppEmoji name="coins" size={26} /> PRIZE HISTORY
        </NeonText>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <GlowCard glowColor="gold" className="p-4 text-center">
          <p className="text-2xl font-black text-yellow-400">₹{stats.total.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400">Total Earned</p>
        </GlowCard>
        <GlowCard glowColor="cyan" className="p-4 text-center">
          <p className="text-2xl font-black text-cyan-400">{stats.count}</p>
          <p className="text-xs text-slate-400">Prizes Won</p>
        </GlowCard>
        <GlowCard glowColor="green" className="p-4 text-center">
          <p className="text-2xl font-black text-green-400">₹{stats.best}</p>
          <p className="text-xs text-slate-400">Best Win</p>
        </GlowCard>
      </div>

      {/* Prize list */}
      {prizes.length === 0 ? (
        <div className="text-center py-16">
          <AppEmoji name="trophy" size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-slate-400 font-bold">No prizes won yet</p>
          <p className="text-slate-500 text-sm mt-1">Join tournaments and win to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prizes.map((prize, i) => (
            <motion.div key={prize.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard glowColor={i === 0 ? 'gold' : 'cyan'} className="p-4">
                <div className="flex items-center gap-4">
                  <AppEmoji name={prize.position === 1 ? 'gold1st' : prize.position === 2 ? 'silver2nd' : prize.position === 3 ? 'bronze3rd' : 'trophy'} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{prize.tournament_name}</p>
                    <div className="flex gap-3 mt-0.5">
                      {prize.position && <p className="text-slate-400 text-xs">#{prize.position} place</p>}
                      {prize.kills !== undefined && prize.kills !== null && <p className="text-slate-400 text-xs">{prize.kills} kills</p>}
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5">{safeFormat(prize.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-400 font-black text-xl">+₹{prize.amount}</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
