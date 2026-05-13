import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Users, Swords, Target, Zap, Gift, Crown, Star,
  Coins, TrendingUp, Calendar, ShoppingBag, MessageCircle,
  ChevronRight, Bell, Gamepad2, Shield
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import StatCard from '../components/ui/StatCard';
import TournamentCard from '../components/tournament/TournamentCard';
import LoadingScreen from '../components/ui/LoadingScreen';
import RoleBadge from '../components/ui/RoleBadge';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';
import { getUserRoles } from '@/lib/permissions';
import confetti from 'canvas-confetti';

const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return d.toLocaleDateString('en-IN'); } catch { return '—'; } };

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [profile, setProfile]       = useState(null);
  const [wallet, setWallet]         = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState({ totalPlayers:0, activeTournaments:0, totalPrizes:0 });
  const [dailyStatus, setDailyStatus] = useState(null);
  const [flashSales, setFlashSales] = useState([]);
  const [claiming, setClaiming]     = useState(false);
  const [userRoles, setUserRoles]   = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setUserRoles(getUserRoles(currentUser));

      const [profiles, wallets, allTournaments, dailyS, sales] = await Promise.all([
        apiClient.entities.UserProfile.filter({ user_email: currentUser.email }),
        apiClient.entities.Wallet.filter({ user_email: currentUser.email }),
        apiClient.entities.Tournament.list('-created_date', 20),
        apiClient.integrations.DailyReward.getStatus().catch(() => null),
        apiClient.integrations.FlashSale.getActive().catch(() => []),
      ]);

      if (profiles[0]) setProfile(profiles[0]);
      if (wallets[0])  setWallet(wallets[0]);
      setDailyStatus(dailyS);
      setFlashSales((sales || []).slice(0, 2));

      const upcoming = (allTournaments || []).filter(t => ['upcoming','registration_open','live'].includes(t.status));
      setTournaments(upcoming.slice(0, 6));

      const allProfiles = await apiClient.entities.UserProfile.list().catch(() => []);
      setStats({
        totalPlayers: allProfiles.length,
        activeTournaments: upcoming.length,
        totalPrizes: (allTournaments || []).reduce((s,t) => s + (t.prize_pool||0), 0)
      });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const claimDaily = async () => {
    setClaiming(true);
    try {
      const res = await apiClient.integrations.DailyReward.claim();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      if (res.streak % 7 === 0) setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 } }), 400);
      toast.success(`+${res.xp} XP earned! Day ${res.streak} streak!`);
      if (res.spinTicketGranted) setTimeout(() => toast.success('Free Spin Ticket earned!'), 800);
      if (res.leveledUp) setTimeout(() => toast.success(`Level Up! Now Level ${res.newLevel}!`), 1200);
      if (res.badgeUnlocked) setTimeout(() => toast.success(`Badge unlocked: ${res.badgeUnlocked}!`), 1600);
      const fresh = await apiClient.integrations.DailyReward.getStatus();
      setDailyStatus(fresh);
    } catch(e) { toast.error(e.message || 'Already claimed today!'); }
    finally { setClaiming(false); }
  };

  if (loading) return <LoadingScreen message="Loading Fire Arena…"/>;

  const isVIP = userRoles.some(r => ['vip','vip_plus','vip_elite'].includes(r));
  const vipTier = ['vip_elite','vip_plus','vip'].find(r => userRoles.includes(r));

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative px-4 py-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950 to-slate-950"/>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl"/>
        </div>
        <div className="relative z-10 max-w-md mx-auto">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-400"/>
                <span className="text-xs text-cyan-300 font-semibold">Welcome, {profile?.username || user?.full_name || 'Player'}</span>
                {vipTier && <RoleBadge role={vipTier} size="xs" showLabel={false}/>}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full" onClick={() => navigate(createPageUrl('Wallet'))}>
                <Coins className="w-3.5 h-3.5 text-yellow-400"/>
                <span className="text-yellow-400 font-black text-sm">{wallet?.balance||0}</span>
              </div>
            </div>
            <h1 className="text-center mb-3">
              <NeonText color="cyan" size="4xl" className="block">FIRE</NeonText>
              <NeonText color="blue" size="4xl" className="block">ARENA MAX</NeonText>
            </h1>
            <p className="text-slate-400 text-center text-sm mb-5">India's #1 Free Fire MAX Tournament Platform 🔥</p>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl('Tournaments')}>
                <GamingButton variant="primary" size="md" icon={Swords}>Join Tournament</GamingButton>
              </Link>
              <Link to={createPageUrl('Deposit')}>
                <GamingButton variant="outline" size="md" icon={Coins}>Buy Coins</GamingButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── DAILY REWARD BANNER ───────────────────────── */}
      {dailyStatus?.canClaim && (
        <section className="px-4 mb-4">
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}>
            <GlowCard glowColor="gold" className="p-4" animated onClick={claimDaily}>
              <div className="flex items-center gap-4">
                <motion.div animate={{rotate:[0,10,-10,0]}} transition={{duration:1.5,repeat:Infinity}}>
                  <AppEmoji name="gift" size={36}/>
                </motion.div>
                <div className="flex-1">
                  <p className="text-yellow-400 font-black">Daily Reward Ready!</p>
                  <p className="text-slate-400 text-xs">Claim +{dailyStatus.nextReward?.xp || dailyStatus.nextReward?.coins || 20} XP now · Day {(dailyStatus.streak%7)||1}/7 streak</p>
                </div>
                <GamingButton variant="gold" size="sm" disabled={claiming} onClick={e=>{e.stopPropagation();claimDaily();}}>
                  {claiming?'…':'Claim'}
                </GamingButton>
              </div>
            </GlowCard>
          </motion.div>
        </section>
      )}

      {/* ── FLASH SALES ───────────────────────────────── */}
      {flashSales.length > 0 && (
        <section className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><NeonText color="red" size="sm"><AppEmoji name="zap" size={14} className="inline-block mr-1 align-middle"/> FLASH SALE</NeonText></div>
            <button onClick={() => navigate(createPageUrl('FlashSale'))} className="text-xs text-cyan-400">View All →</button>
          </div>
          <div className="space-y-2">
            {flashSales.map(sale => (
              <GlowCard key={sale.id} glowColor="red" className="p-3 cursor-pointer" animated onClick={() => navigate(createPageUrl('Deposit'))}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <AppEmoji name={sale.icon_name||'zap'} size={28}/>
                    </div>
                    <div><p className="text-white font-bold text-sm">{sale.title}</p><p className="text-slate-400 text-xs">Min deposit ₹{sale.min_amount}</p></div>
                  </div>
                  <div className="text-right"><p className="text-red-400 font-black text-xl">+{sale.bonus_percent}%</p><p className="text-slate-500 text-xs">bonus coins</p></div>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>
      )}

      {/* ── STATS ─────────────────────────────────────── */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Users}  label="Players"     value={stats.totalPlayers.toLocaleString()} color="cyan"   delay={0.1}/>
          <StatCard icon={Trophy} label="Tournaments"  value={stats.activeTournaments}             color="purple" delay={0.2}/>
          <StatCard icon={Zap}    label="Prize Pool"   value={`₹${(stats.totalPrizes/1000).toFixed(0)}K`} color="gold" delay={0.3}/>
        </div>
      </section>

      {/* ── QUICK ACTIONS GRID ────────────────────────── */}
      <section className="px-4 py-4">
        <NeonText color="cyan" size="lg" className="mb-3 block"><AppEmoji name="zap" size={18} className="inline-block mr-1 align-middle"/> Quick Actions</NeonText>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon:'spinwheel',    label:'Spin Wheel',    page:'SpinWheel',         color:'purple' },
            { icon:'target',       label:'Missions',      page:'Missions',          color:'cyan'   },
            { icon:'calendar',     label:'Daily',         page:'DailyRewards',      color:'gold'   },
            { icon:'medal',        label:'Season',        page:'SeasonPass',        color:'purple' },
            { icon:'store',        label:'Store',         page:'Store',             color:'cyan'   },
            { icon:'gift',         label:'Gift',          page:'GiftCoins',         color:'green'  },
            { icon:'team',         label:'Refer',         page:'ReferralHub',       color:'green'  },
            { icon:'predict',      label:'Predict',       page:'Predictions',       color:'purple' },
            { icon:'notification', label:'News',          page:'Announcements',     color:'cyan'   },
            { icon:'trophy',       label:'Leaderboard',   page:'Leaderboard',       color:'gold'   },
            { icon:'stats',        label:'Polls',         page:'Polls',             color:'cyan'   },
            { icon:'forms',        label:'Disputes',      page:'DisputeResolution', color:'purple' },
            { icon:'coins',        label:'Prizes',        page:'PrizeHistory',      color:'gold'   },
            { icon:'team',         label:'Ref Board',     page:'ReferralLeaderboard',color:'green' },
          ].map(({icon,label,page,color},i) => (
            <motion.button key={label} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:0.1+i*0.04}}
              onClick={() => navigate(createPageUrl(page))}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/40 active:scale-95 transition-all">
              <AppEmoji name={icon} size={28}/>
              <span className="text-xs text-slate-300 font-semibold">{label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── VIP PANEL BANNER ──────────────────────────── */}
      {isVIP ? (
        <section className="px-4 mb-4">
          <GlowCard glowColor="gold" className="p-4 cursor-pointer" animated onClick={() => navigate(createPageUrl('VIPPanel'))}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0"><Crown className="w-6 h-6 text-white"/></div>
              <div className="flex-1">
                <p className="text-yellow-400 font-black">{vipTier?.replace('_',' ').toUpperCase()} Panel</p>
                <p className="text-slate-400 text-xs">Access your exclusive VIP features →</p>
              </div>
              <ChevronRight className="w-5 h-5 text-yellow-400"/>
            </div>
          </GlowCard>
        </section>
      ) : (
        <section className="px-4 mb-4">
          <GlowCard glowColor="gold" className="p-4 cursor-pointer overflow-hidden relative" animated onClick={() => navigate(createPageUrl('VIPPlans'))}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400"/>
            <div className="flex items-center gap-4">
              <motion.div animate={{scale:[1,1.1,1],rotate:[0,5,-5,0]}} transition={{duration:2.5,repeat:Infinity}} className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0"><Crown className="w-6 h-6 text-white"/></motion.div>
              <div className="flex-1">
                <p className="text-yellow-400 font-black">Go VIP — From ₹49/week</p>
                <p className="text-slate-400 text-xs">+5–15% deposit bonus · Exclusive tournaments · VIP chat</p>
              </div>
              <ChevronRight className="w-5 h-5 text-yellow-400"/>
            </div>
          </GlowCard>
        </section>
      )}

      {/* ── LIVE TOURNAMENTS ──────────────────────────── */}
      {tournaments.filter(t => t.status==='live').length > 0 && (
        <section className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><NeonText color="red" size="lg"><AppEmoji name="fire" size={16} className="inline-block mr-1 align-middle"/> LIVE NOW</NeonText></div>
          <div className="space-y-4">{tournaments.filter(t=>t.status==='live').map((t,i)=><TournamentCard key={t.id} tournament={t} delay={i*0.1}/>)}</div>
        </section>
      )}

      {/* ── HOT TOURNAMENTS ───────────────────────────── */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <NeonText color="cyan" size="lg"><AppEmoji name="fire" size={16} className="inline-block mr-1 align-middle"/> HOT TOURNAMENTS</NeonText>
          <Link to={createPageUrl('Tournaments')} className="text-xs text-cyan-400">View All →</Link>
        </div>
        <div className="space-y-4">
          {tournaments.filter(t=>t.status!=='live').slice(0,4).map((t,i)=><TournamentCard key={t.id} tournament={t} delay={i*0.1}/>)}
        </div>
        {tournaments.length === 0 && (
          <GlowCard glowColor="cyan" className="p-8 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3"/>
            <p className="text-slate-400">No tournaments right now</p>
            <p className="text-xs text-slate-500 mt-1">Check back soon!</p>
          </GlowCard>
        )}
      </section>

      {/* ── YOUR STATS ────────────────────────────────── */}
      {profile && (
        <section className="px-4 py-4">
          <NeonText color="cyan" size="lg" className="mb-3 block"><AppEmoji name="stats" size={16} className="inline-block mr-1 align-middle"/> Your Stats</NeonText>
          <GlowCard glowColor="cyan" className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                {val:profile.tournaments_played||0, label:'Matches',  color:'text-cyan-400'},
                {val:profile.tournaments_won||0,    label:'Wins',     color:'text-green-400'},
                {val:profile.total_kills||0,        label:'Kills',    color:'text-yellow-400'},
                {val:`₹${profile.total_earnings||0}`,label:'Earned',  color:'text-purple-400'},
              ].map(({val,label,color})=>(
                <div key={label} className="text-center p-3 bg-slate-800/50 rounded-xl">
                  <p className={`text-2xl font-black ${color}`}>{val}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </GlowCard>
        </section>
      )}

      {/* ── GAME MODES ────────────────────────────────── */}
      <section className="px-4 py-4">
        <NeonText color="cyan" size="lg" className="mb-3 block"><AppEmoji name="gamepad" size={16} className="inline-block mr-1 align-middle"/> Game Modes</NeonText>
        <div className="grid grid-cols-3 gap-3">
          {[{mode:'Solo',icon:Target,color:'cyan'},{mode:'Duo',icon:Users,color:'purple'},{mode:'Squad',icon:Swords,color:'gold'}].map((item,i)=>(
            <motion.div key={item.mode} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.4+i*0.1}}>
              <GlowCard glowColor={item.color} className="p-4 text-center cursor-pointer" animated onClick={() => navigate(createPageUrl('Tournaments'))}>
                <item.icon className={`w-7 h-7 mx-auto mb-2 text-${item.color==='gold'?'yellow':item.color}-400`}/>
                <p className="font-bold text-white text-sm">{item.mode}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS LINK ─────────────────────────── */}
      <section className="px-4 py-4">
        <GlowCard glowColor="cyan" className="p-4 cursor-pointer" animated onClick={() => navigate(createPageUrl('HowItWorks'))}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center"><Shield className="w-5 h-5 text-cyan-400"/></div>
              <div>
                <p className="text-white font-bold text-sm">New to FAM?</p>
                <p className="text-slate-400 text-xs">Learn how it works + all ways to earn coins</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500"/>
          </div>
        </GlowCard>
      </section>
    </div>
  );
}
