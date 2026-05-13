import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Share2, ChevronLeft, Link, Trophy, Clock, CheckCircle2, TrendingUp, Gift, Medal } from 'lucide-react';
import AppEmoji from '../components/ui/AppEmoji';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';

const TABS = ['Overview', 'History', 'Leaderboard'];

export default function ReferralHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [code, setCode] = useState('');
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [user, ref] = await Promise.all([
        apiClient.auth.me(),
        apiClient.integrations.Referral.getStats().catch(() => null),
      ]);
      setCurrentUser(user);
      const refCode = ref?.referral_code || user?.referral_code || 'FAM' + Math.random().toString(36).slice(2, 6).toUpperCase();
      setCode(refCode);
      setStats(ref);

      apiClient.integrations.Referral.getHistory().then(h => setHistory(h || [])).catch(() => {});
      apiClient.integrations.Referral.getLeaderboard().then(lb => {
        setLeaderboard(lb || []);
        const myUsername = user?.full_name?.split(' ')[0] || '';
        const rank = lb?.findIndex(r => r.username === myUsername);
        if (rank >= 0) setMyRank(rank + 1);
      }).catch(() => {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const copyCode = () => { navigator.clipboard.writeText(code); toast.success('Code copied!'); };
  const copyLink = () => {
    const link = `${window.location.origin}/Signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };
  const share = async () => {
    const text = `🔥 Join Fire Arena MAX — India's #1 Free Fire tournament platform!\nUse my referral code: ${code}\nWe both get ₹10 bonus when you deposit!\nSign up: ${window.location.origin}/Signup?ref=${code}`;
    if (navigator.share) { try { await navigator.share({ title: 'Fire Arena MAX', text, url: `${window.location.origin}/Signup?ref=${code}` }); } catch (e) {} }
    else { navigator.clipboard.writeText(text); toast.success('Share text copied!'); }
  };

  if (loading) return <LoadingScreen message="Loading Referrals…" />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <NeonText color="green" size="xl" className="block">👥 Refer & Earn</NeonText>
          <p className="text-slate-400 text-xs">Invite friends · Get ₹10 on their first deposit!</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4 pb-3">
        {[
          { val: stats?.total_referred || 0, label: 'Total Referred', color: 'text-cyan-400', icon: <Users className="w-4 h-4" /> },
          { val: `₹${stats?.earnings || 0}`, label: 'Total Earned', color: 'text-green-400', icon: <Gift className="w-4 h-4" /> },
          { val: stats?.pending || 0, label: 'Pending', color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
        ].map(({ val, label, color, icon }) => (
          <GlowCard key={label} glowColor="cyan" className="p-3 text-center">
            <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
            <p className={`text-lg font-black ${color}`}>{val}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </GlowCard>
        ))}
      </div>

      {/* Referral Code Card */}
      <div className="px-4 pb-4">
        <GlowCard glowColor="green" className="p-4">
          <p className="text-slate-300 font-semibold text-sm mb-3 text-center">Your Referral Code</p>
          <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3 mb-3 border border-green-500/30">
            <span className="text-green-400 font-black text-2xl tracking-widest">{code}</span>
            <button onClick={copyCode} className="text-slate-400 hover:text-white p-1 active:scale-90 transition-transform">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <GamingButton variant="outline" size="md" icon={Link} onClick={copyLink}>Copy Link</GamingButton>
            <GamingButton variant="primary" size="md" icon={Share2} onClick={share}>Share Now</GamingButton>
          </div>
        </GlowCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'Overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 space-y-4">
            <GlowCard glowColor="cyan" className="p-5">
              <p className="text-cyan-400 font-bold mb-4 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> How It Works
              </p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Share your link', desc: 'Send your referral link to friends. Your code is automatically applied!', color: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/20' },
                  { step: '2', title: 'Friend signs up', desc: 'They create an account on Fire Arena MAX using your referral link.', color: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20' },
                  { step: '3', title: 'First ₹100 deposit', desc: 'Once they make their first deposit of ₹100 or more, the bonus triggers.', color: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/20' },
                  { step: '4', title: '₹10 Bonus for you!', desc: 'You instantly receive ₹10 bonus coins in your wallet. No cap on referrals!', color: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20' },
                ].map(({ step, title, desc, color, border }) => (
                  <div key={step} className={`flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r ${color} border ${border}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-white">{step}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>

            {/* Referral Link Preview */}
            <GlowCard glowColor="purple" className="p-4">
              <p className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
                <Link className="w-4 h-4 text-purple-400" /> Your Referral Link
              </p>
              <div className="bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700 mb-2">
                <p className="text-purple-400 text-xs font-mono break-all">{window.location.origin}/Signup?ref={code}</p>
              </div>
              <p className="text-slate-500 text-xs">Share this link — your code is auto-applied when friends sign up!</p>
            </GlowCard>

            {/* VIP Boost */}
            <GlowCard glowColor="gold" className="p-4 cursor-pointer" animated onClick={() => navigate('/VIPPlans')}>
              <div className="flex items-center gap-3">
                <AppEmoji name="crown" size={32} />
                <div className="flex-1">
                  <p className="text-yellow-400 font-black">VIP Referral Boost!</p>
                  <p className="text-slate-400 text-xs">VIP members earn ₹25 per referral instead of ₹10</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'History' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4">
            {history.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-semibold">No referrals yet</p>
                <p className="text-slate-500 text-sm mt-1">Share your code to start earning!</p>
                <div className="flex justify-center mt-4">
                  <GamingButton variant="primary" size="md" icon={Share2} onClick={share}>Share Now</GamingButton>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlowCard glowColor={item.status === 'completed' ? 'green' : 'cyan'} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <span className="text-sm font-black text-cyan-400">{item.username?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{item.username}</p>
                            <p className="text-xs text-slate-500">
                              Joined {item.joined_date ? new Date(item.joined_date).toLocaleDateString('en-IN') : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {item.status === 'completed' ? (
                            <>
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs font-bold">+₹10</span>
                              </div>
                              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Earned</span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold">Pending</span>
                              </div>
                              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Awaiting deposit</span>
                            </>
                          )}
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 flex justify-between text-sm mt-2">
                  <span className="text-slate-400">Total: {history.length} referrals</span>
                  <span className="text-green-400 font-bold">Earned: ₹{history.filter(h => h.status === 'completed').length * 10}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {activeTab === 'Leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 space-y-3">
            {myRank && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-cyan-400 text-sm font-bold">🏆 Your Rank</span>
                <span className="text-white font-black text-lg">#{myRank}</span>
              </div>
            )}

            {leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Leaderboard is empty</p>
                <p className="text-slate-500 text-sm mt-1">Be the first to refer friends!</p>
              </div>
            ) : (
              leaderboard.map((item, i) => {
                const medalColors = ['text-yellow-400', 'text-slate-300', 'text-orange-400'];
                const bgColors = ['from-yellow-500/10 to-orange-500/10 border-yellow-500/20', 'from-slate-500/10 to-slate-400/10 border-slate-600/20', 'from-orange-500/10 to-red-500/10 border-orange-500/20'];
                const isTop3 = i < 3;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 rounded-xl border ${isTop3 ? `bg-gradient-to-r ${bgColors[i]}` : 'bg-slate-900/50 border-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 ${isTop3 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                        {i === 0 ? <Trophy className={`w-5 h-5 ${medalColors[0]}`} />
                          : i === 1 ? <Medal className={`w-5 h-5 ${medalColors[1]}`} />
                          : i === 2 ? <Medal className={`w-5 h-5 ${medalColors[2]}`} />
                          : <span className="text-slate-400 text-sm">#{item.rank}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${isTop3 ? 'text-white' : 'text-slate-300'}`}>{item.username}</p>
                          {i === 0 && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">👑 Top</span>}
                        </div>
                        <p className="text-xs text-slate-500">{item.total_referred} friends referred</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-black text-sm">₹{item.referral_earnings || item.total_referred * 10}</p>
                        <p className="text-xs text-slate-500">earned</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
