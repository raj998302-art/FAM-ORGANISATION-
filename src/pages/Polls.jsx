import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, BarChart2, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';

export default function Polls() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [myVotes, setMyVotes] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      const data = await apiClient.entities.Poll.filter({ is_active: true }, '-created_date', 20).catch(() => []);
      const activePollsList = (Array.isArray(data) ? data : []).filter(p => {
        if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
        return true;
      });
      setPolls(activePollsList);
      // Load my votes
      const votes = await apiClient.entities.PollVote.filter({ user_email: cu.email }, '-created_date', 100).catch(() => []);
      const voteMap = {};
      (Array.isArray(votes) ? votes : []).forEach(v => { voteMap[v.poll_id] = v.option_index; });
      setMyVotes(voteMap);
    } catch {}
    finally { setLoading(false); }
  };

  const vote = async (poll, optionIndex) => {
    if (myVotes[poll.id] !== undefined) { toast.error('You have already voted in this poll'); return; }
    setVoting(poll.id + '_' + optionIndex);
    try {
      // Create vote record
      await apiClient.entities.PollVote.create({
        user_email: user.email,
        poll_id: poll.id,
        option_index: optionIndex,
        voted_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });
      // Update poll vote count
      const updatedOptions = poll.options.map((opt, i) => ({
        ...opt,
        votes: (opt.votes || 0) + (i === optionIndex ? 1 : 0),
      }));
      await apiClient.entities.Poll.update(poll.id, {
        options: updatedOptions,
        total_votes: (poll.total_votes || 0) + 1,
      });
      setMyVotes(prev => ({ ...prev, [poll.id]: optionIndex }));
      setPolls(prev => prev.map(p => p.id === poll.id ? {
        ...p, options: updatedOptions, total_votes: (p.total_votes || 0) + 1,
      } : p));
      toast.success('Vote recorded!');
    } catch (e) {
      toast.error(e.message || 'Failed to vote');
    } finally { setVoting(null); }
  };

  if (loading) return <LoadingScreen message="Loading polls..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
          <BarChart2 className="w-6 h-6" /> COMMUNITY POLLS
        </NeonText>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 className="w-14 h-14 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No active polls right now</p>
          <p className="text-slate-500 text-sm mt-1">Check back later for new community polls!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {polls.map((poll, i) => {
            const voted = myVotes[poll.id] !== undefined;
            const myVoteIdx = myVotes[poll.id];
            const totalVotes = poll.total_votes || 0;
            return (
              <motion.div key={poll.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlowCard glowColor="cyan" className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-white font-bold text-base leading-snug flex-1 pr-3">{poll.question}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {voted ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-yellow-400" />}
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {(poll.options || []).map((opt, oi) => {
                      const text = opt.text || opt;
                      const optVotes = opt.votes || 0;
                      const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                      const isMyVote = voted && myVoteIdx === oi;
                      const isVotingThis = voting === poll.id + '_' + oi;

                      return (
                        <motion.button
                          key={oi}
                          onClick={() => !voted && vote(poll, oi)}
                          disabled={voted || !!voting}
                          className={`w-full text-left rounded-xl border transition-all overflow-hidden relative ${
                            isMyVote ? 'border-cyan-500/60' :
                            voted ? 'border-slate-700/40 opacity-70' :
                            'border-slate-700/60 hover:border-cyan-500/40 hover:bg-slate-800/50 active:scale-98'
                          }`}
                          whileTap={{ scale: voted ? 1 : 0.98 }}
                        >
                          {/* Background fill for percentage */}
                          {voted && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className={`absolute inset-0 ${isMyVote ? 'bg-cyan-500/20' : 'bg-slate-700/30'}`}
                            />
                          )}
                          <div className="relative flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isMyVote && <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                              <span className={`text-sm font-medium ${isMyVote ? 'text-cyan-400' : 'text-slate-300'}`}>{text}</span>
                            </div>
                            {voted && (
                              <div className="text-right flex-shrink-0 ml-3">
                                <span className={`text-sm font-black ${isMyVote ? 'text-cyan-400' : 'text-slate-400'}`}>{pct}%</span>
                                <span className="text-slate-500 text-xs ml-1">({optVotes})</span>
                              </div>
                            )}
                            {!voted && (
                              <span className="text-slate-500 text-xs">Tap to vote</span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                    {poll.expires_at && <span>Ends {new Date(poll.expires_at).toLocaleDateString('en-IN')}</span>}
                    {voted && <span className="text-green-400 font-bold">✓ Voted</span>}
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
