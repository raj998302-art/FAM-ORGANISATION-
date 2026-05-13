import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Target, CheckCircle, Lock, ChevronLeft, Star, Zap, Calendar, Trophy, Clock, RefreshCw } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function Missions() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [missions, setMissions] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [tab, setTab]           = useState('daily');
  const [resetIn, setResetIn]   = useState('');

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(updateReset, 1000);
    return () => clearInterval(id);
  }, []);

  const updateReset = () => {
    const nowUTC = Date.now();
    const istNow = new Date(nowUTC + 5.5 * 3600000);
    const next = new Date(istNow);
    if (istNow.getUTCHours() >= 1) next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(1, 0, 0, 0);
    const ms = next.getTime() - istNow.getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    setResetIn(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
  };

  const load = async () => {
    try { setMissions(await apiClient.integrations.Missions.getAll()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const claimMission = async (id) => {
    setClaiming(id);
    try {
      const res = await apiClient.integrations.Missions.complete(id);
      confetti({ particleCount:50, spread:60, origin:{y:0.6} });
      toast.success(`+${res.xp} XP earned!`);
      if (res.leveledUp) setTimeout(()=>toast.success(`Level Up → Level ${res.newLevel}!`), 600);
      if (res.rankedUp) setTimeout(()=>toast.success(`Rank Up → ${res.newRank?.charAt(0).toUpperCase()+res.newRank?.slice(1)}!`), 1200);
      await load();
    } catch(e) { toast.error(e.message); }
    finally { setClaiming(null); }
  };

  if (loading) return <LoadingScreen message="Loading Missions…"/>;

  const shown = missions.filter(m => m.type === tab);
  const done = shown.filter(m => m.completed).length;
  const totalXP = shown.reduce((s,m)=>s+m.xp, 0);
  const earnedXP = shown.filter(m=>m.completed).reduce((s,m)=>s+m.xp, 0);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div className="flex-1">
          <NeonText color="cyan" size="2xl" className="block flex items-center gap-2"><AppEmoji name="target" size={22}/> Missions</NeonText>
          <p className="text-slate-400 text-xs">Complete missions → Earn XP → Level up your profile</p>
        </div>
      </div>

      {/* Reset timer */}
      <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl">
        <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-cyan-400"/><span className="text-slate-300 text-sm">Daily reset at 1 AM IST</span></div>
        <span className="font-mono font-black text-cyan-400">{resetIn}</span>
      </div>

      {/* XP Summary */}
      <GlowCard glowColor="cyan" className="p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm font-semibold">{tab==='daily'?'Daily':'Weekly'} Progress</span>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-black">{done}/{shown.length}</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-purple-400 font-bold text-sm">{earnedXP}/{totalXP} XP</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <motion.div initial={{width:0}} animate={{width:shown.length?`${(done/shown.length)*100}%`:'0%'}} transition={{duration:0.6}}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"/>
        </div>
        {done===shown.length&&shown.length>0&&<p className="text-green-400 text-xs text-center mt-2 font-bold">All {tab} missions complete!</p>}
      </GlowCard>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['daily','Daily'],['weekly','Weekly']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tab===t?'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400':'bg-slate-800 border border-slate-700 text-slate-400'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((m,i) => (
          <motion.div key={m.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
            <GlowCard glowColor={m.completed?'green':'cyan'} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.completed?'bg-green-500/20':'bg-slate-800'}`}>
                  <AppEmoji name={
                    m.id==='login'?'star': m.id==='play1'?'trophy': m.id==='chat5'?'chat':
                    m.id==='spin1'?'spinwheel': m.id==='view_vip'?'crown': m.id==='win1'?'gold1st':
                    m.id==='ref1'?'team': m.id==='top10'?'medal': m.id==='dep1'?'coins':
                    m.id==='buy_store'?'store': 'target'
                  } size={24}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${m.completed?'text-slate-400 line-through':'text-white'}`}>{m.title}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-purple-400"/>
                      <span className="text-purple-400 font-bold text-xs">+{m.xp} XP</span>
                    </div>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${m.type==='daily'?'bg-cyan-500/15 text-cyan-400':'bg-purple-500/15 text-purple-400'}`}>{m.type}</span>
                  </div>
                  {!m.completed && m.progress > 0 && m.target > 1 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{width:`${Math.min(100,(m.progress/m.target)*100)}%`}}/>
                      </div>
                      <span className="text-slate-500 text-xs">{m.progress}/{m.target}</span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {m.completed ? <CheckCircle className="w-7 h-7 text-green-400"/>
                    : <button onClick={()=>claimMission(m.id)} disabled={claiming===m.id}
                        className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/30 transition-all active:scale-95 whitespace-nowrap">
                        {claiming===m.id?'…':'Claim'}
                      </button>}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      <GlowCard glowColor="purple" className="p-4 mt-5">
        <p className="text-purple-400 font-bold text-sm mb-1 flex items-center gap-1"><AppEmoji name="crown" size={16}/> VIP Bonus Missions</p>
        <p className="text-slate-400 text-xs">VIP members get exclusive weekly missions with 3x XP rewards + special badge unlocks!</p>
        <button onClick={()=>navigate(createPageUrl('VIPPlans'))} className="text-cyan-400 text-xs font-bold mt-2 block hover:underline">Get VIP →</button>
      </GlowCard>
    </div>
  );
}
