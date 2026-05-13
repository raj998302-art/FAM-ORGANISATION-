import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Flame, ChevronLeft, Star, RefreshCw, Clock } from 'lucide-react';
import AppEmoji from '../components/ui/AppEmoji';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const DAYS = [
  { day:1, xp:20,  icon:'star',      label:'Day 1' },
  { day:2, xp:30,  icon:'star',      label:'Day 2' },
  { day:3, xp:50,  icon:'zap',       label:'Day 3' },
  { day:4, xp:60,  icon:'zap',       label:'Day 4', bonus:'Streak Badge' },
  { day:5, xp:80,  icon:'fire',      label:'Day 5' },
  { day:6, xp:100, icon:'fire',      label:'Day 6' },
  { day:7, xp:200, icon:'crown',     label:'DAY 7', bonus:'Loyal Badge + Spin Ticket!', mega:true },
];

export default function DailyRewards() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [resetIn, setResetIn]   = useState('');

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(updateReset, 1000);
    return () => clearInterval(id);
  }, []);

  const updateReset = () => {
    // Count down to 1:00 AM IST (UTC+5:30)
    const nowUTC = Date.now();
    const istNow = new Date(nowUTC + 5.5 * 3600000); // shift to IST
    const next = new Date(istNow);
    // Next 1 AM IST: if past 1 AM, go to next day 1 AM
    if (istNow.getUTCHours() >= 1) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    next.setUTCHours(1, 0, 0, 0);
    const ms = next.getTime() - istNow.getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    setResetIn(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
  };

  const load = async () => {
    try { setStatus(await apiClient.integrations.DailyReward.getStatus()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const claim = async () => {
    setClaiming(true);
    try {
      const res = await apiClient.integrations.DailyReward.claim();
      confetti({ particleCount:80, spread:70, origin:{y:0.6} });
      if (res.streak%7===0) setTimeout(()=>confetti({particleCount:150,spread:90,origin:{y:0.4}}), 400);
      toast.success(`+${res.xp} XP earned! Day ${res.streak} streak!`);
      if (res.spinTicketGranted) setTimeout(()=>toast.success('Free Spin Ticket earned! Check Spin Wheel!'), 600);
      if (res.leveledUp) setTimeout(()=>toast.success(`Level Up! Now Level ${res.newLevel}!`), 800);
      if (res.badgeUnlocked) setTimeout(()=>toast.success(`Badge unlocked: ${res.badgeUnlocked}!`), 1200);
      await load();
    } catch(e) { toast.error(e.message); }
    finally { setClaiming(false); }
  };

  if (loading) return <LoadingScreen message="Loading Rewards…"/>;

  const streak = status?.streak || 0;
  const currentDay = streak % 7;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div>
          <NeonText color="gold" size="2xl" className="block">Daily Rewards</NeonText>
          <p className="text-slate-400 text-xs">Login every day to earn XP and badges!</p>
        </div>
      </div>

      {/* Reset timer */}
      <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl">
        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400"/><span className="text-slate-300 text-sm">Resets at 1:00 AM IST</span></div>
        <span className="font-mono font-black text-cyan-400">{resetIn}</span>
      </div>

      {/* Streak */}
      <GlowCard glowColor="gold" className="p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-sm">Current Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400"/>
              <span className="text-4xl font-black text-orange-400">{streak}</span>
              <span className="text-slate-400 text-sm">days</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Total XP Earned</p>
            <p className="text-2xl font-black text-purple-400">{status?.totalXP||0} XP</p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Day {currentDay||7}</span><span>7-Day Streak</span></div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <motion.div initial={{width:0}} animate={{width:`${((currentDay||7)/7)*100}%`}} transition={{duration:0.8,delay:0.3}}
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"/>
        </div>
      </GlowCard>

      {/* 7-day grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {DAYS.slice(0,6).map((day,i) => {
          const isDone = streak>0 && (currentDay===0 ? true : i<currentDay);
          const isToday = !status?.claimedToday && i===currentDay;
          return (
            <motion.div key={day.day} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:i*0.06}}>
              <div className={`relative rounded-2xl p-3 text-center border transition-all ${isDone?'bg-green-500/10 border-green-500/40':isToday?'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]':'bg-slate-800/60 border-slate-700/50'}`}>
                {isDone&&<div className="absolute top-1.5 right-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400"/></div>}
                <AppEmoji name={day.icon} size={22} />
                <p className={`text-sm font-black ${isDone?'text-green-400':isToday?'text-cyan-400':'text-slate-400'}`}>+{day.xp} XP</p>
                <p className="text-xs text-slate-500">{day.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Day 7 mega reward */}
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.4}} className="mb-5">
        <div className={`relative rounded-2xl p-4 text-center border ${streak>0&&currentDay===0?'bg-yellow-500/15 border-yellow-400/60 shadow-[0_0_20px_rgba(234,179,8,0.4)]':'bg-slate-800/60 border-slate-700/50'}`}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-2xl"/>
          <div className="flex items-center justify-center gap-4">
            <AppEmoji name="spinwheel" size={36}/>
            <div>
              <p className="text-yellow-400 font-black text-base">DAY 7 MEGA REWARD</p>
              <p className="text-slate-300 text-sm">+200 XP + Loyal Badge + Free Spin Ticket!</p>
            </div>
            <AppEmoji name="medal" size={36}/>
          </div>
          {streak>0&&currentDay===0&&<div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full">TODAY!</div>}
        </div>
      </motion.div>

      {/* Claim / Done */}
      <AnimatePresence mode="wait">
        {status?.canClaim ? (
          <motion.div key="claim" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
            <GlowCard glowColor="gold" className="p-5 mb-4">
              <div className="text-center mb-4">
                <motion.p animate={{scale:[1,1.05,1]}} transition={{duration:1.5,repeat:Infinity}} className="text-yellow-400 font-black text-lg flex items-center justify-center gap-2"><AppEmoji name="gift" size={20}/> Reward Ready!</motion.p>
                <p className="text-slate-400 text-sm">Today: <span className="text-purple-400 font-bold">+{DAYS[currentDay%7]?.xp||20} XP</span>
                  {DAYS[currentDay%7]?.bonus&&<span className="text-yellow-400"> + {DAYS[currentDay%7].bonus}</span>}
                </p>
              </div>
              <GamingButton variant="gold" size="lg" className="w-full" onClick={claim} disabled={claiming}>
                {claiming ? 'Claiming…' : `Claim +${DAYS[currentDay%7]?.xp||20} XP!`}
              </GamingButton>
            </GlowCard>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{opacity:0}} animate={{opacity:1}}>
            <GlowCard glowColor="green" className="p-5 mb-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2"/>
              <p className="text-green-400 font-bold">Claimed today!</p>
              <p className="text-slate-400 text-sm">Come back after 1 AM IST for tomorrow's reward!</p>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      <GlowCard glowColor="cyan" className="p-4">
        <p className="text-cyan-400 font-bold text-sm mb-1">Why XP Matters</p>
        <p className="text-slate-400 text-xs">XP levels up your profile and unlocks Season Pass rewards including exclusive badges, frames and titles!</p>
        <button onClick={()=>navigate(createPageUrl('SeasonPass'))} className="text-cyan-400 text-xs font-bold mt-2 block hover:underline">View Season Pass →</button>
      </GlowCard>
    </div>
  );
}
