import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Star, Zap, Trophy, Gift, Crown, RefreshCw, Ticket, Info } from 'lucide-react';
import AppEmoji from '../components/ui/AppEmoji';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const REWARDS = [
  { id:0, label:'+10 XP',    xp:10,  color:'#06b6d4', bg:'#0e7490', icon:'⭐', type:'xp' },
  { id:1, label:'+25 XP',    xp:25,  color:'#7c3aed', bg:'#5b21b6', icon:'💫', type:'xp' },
  { id:2, label:'+50 XP',    xp:50,  color:'#f59e0b', bg:'#b45309', icon:'🔥', type:'xp' },
  { id:3, label:'BADGE!',    xp:30,  color:'#ffd700', bg:'#92400e', icon:'🏅', type:'badge' },
  { id:4, label:'+5 XP',     xp:5,   color:'#475569', bg:'#1e293b', icon:'⭐', type:'xp' },
  { id:5, label:'+75 XP',    xp:75,  color:'#10b981', bg:'#065f46', icon:'💎', type:'xp' },
  { id:6, label:'+15 XP',    xp:15,  color:'#3b82f6', bg:'#1e40af', icon:'⭐', type:'xp' },
  { id:7, label:'+100 XP',   xp:100, color:'#ec4899', bg:'#9d174d', icon:'👑', type:'xp' },
];

const SEGMENT_ANGLE = 360 / REWARDS.length;

export default function SpinWheel() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult]     = useState(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef(null);

  // Reset time display
  const [resetIn, setResetIn] = useState('');

  useEffect(() => {
    load();
    const id = setInterval(updateResetTimer, 1000);
    return () => clearInterval(id);
  }, []);

  const updateResetTimer = () => {
    const now = new Date();
    // Reset at 4:00 AM IST (UTC+5:30 = UTC 22:30 prev day)
    const istNow = new Date(now.getTime() + (5.5 * 3600000));
    const nextReset = new Date(istNow);
    if (istNow.getHours() >= 4) {
      nextReset.setDate(nextReset.getDate() + 1);
    }
    nextReset.setHours(4, 0, 0, 0);
    const ms = nextReset.getTime() - istNow.getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    setResetIn(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
  };

  const load = async () => {
    try {
      const s = await apiClient.integrations.SpinWheel?.getStatus?.()
        ?? await apiClient.integrations.Missions.getAll().then(() => ({ canSpin: true, extraTickets: 0, rewards: REWARDS })).catch(() => ({ canSpin: true, extraTickets: 0 }));
      setStatus(s);
    } catch(e) { setStatus({ canSpin: true, extraTickets: 0 }); }
    finally { setLoading(false); }
  };

  const spin = async (useTicket = false) => {
    if (spinning) return;
    setSpinning(true); setShowResult(false); setResult(null);

    try {
      // Get result from backend
      let res;
      try {
        res = await apiClient.integrations.SpinWheel?.spin?.({ useTicket })
          ?? await fetch(`${(import.meta.env.VITE_API_URL||'/api')}/features/spin/spin`, {
            method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('token')}`},
            body: JSON.stringify({ useTicket })
          }).then(r=>r.json());
      } catch(e) {
        // Dev fallback: random
        const r = REWARDS[Math.floor(Math.random() * REWARDS.length)];
        res = { success:true, rewardIndex:r.id, reward:r, xpGained:r.xp||0 };
      }

      if (res.error) { toast.error(res.error); setSpinning(false); return; }

      const targetIndex = res.rewardIndex ?? 0;
      // Spin to land on target segment
      // Segment center = (targetIndex * SEGMENT_ANGLE) + SEGMENT_ANGLE/2
      // Pointer is at top (0°), wheel spins clockwise
      const targetAngle = 360 - (targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
      const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
      const finalRotation = rotation + (fullSpins * 360) + targetAngle - (rotation % 360);
      setRotation(finalRotation);

      // Wait for animation (3.5s)
      setTimeout(() => {
        setResult(res);
        setShowResult(true);
        setSpinning(false);
        if (res.xpGained > 0) {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        }
        if (res.leveledUp) {
          setTimeout(() => confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 } }), 300);
          toast.success(`🎉 Level Up! You're Level ${res.newLevel}!`);
        }
        if (res.badgeUnlocked) toast.success(`🏅 Badge unlocked: ${res.badgeUnlocked}!`);
        load();
      }, 3500);

    } catch(e) {
      toast.error(e.message || 'Spin failed');
      setSpinning(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading Spin Wheel…"/>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div>
          <NeonText color="purple" size="2xl" className="block flex items-center gap-2"><AppEmoji name="spinwheel" size={22}/> Spin Wheel</NeonText>
          <p className="text-slate-400 text-xs">Spin daily for XP rewards — resets at 4:00 AM IST</p>
        </div>
      </div>

      {/* Reset timer */}
      <GlowCard glowColor="cyan" className="p-3 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400"/>
          <span className="text-slate-300 text-sm">Resets in</span>
        </div>
        <span className="font-mono font-black text-cyan-400 text-lg">{resetIn}</span>
      </GlowCard>

      {/* Spin Wheel Canvas */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Glow behind wheel */}
        <div className="absolute w-72 h-72 rounded-full bg-purple-500/15 blur-3xl"/>

        {/* Pointer (triangle at top) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ top: '-8px' }}>
          <div className="w-0 h-0" style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '24px solid #ffd700',
            filter: 'drop-shadow(0 0 8px #ffd700)',
          }}/>
        </div>

        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          animate={{ rotate: rotation }}
          transition={{ duration: spinning ? 3.5 : 0, ease: [0.15, 0.85, 0.35, 1.0] }}
          className="relative w-64 h-64 rounded-full border-4 border-slate-700 overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.5)]"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {REWARDS.map((r, i) => {
            const startAngle = i * SEGMENT_ANGLE;
            const midAngle = startAngle + SEGMENT_ANGLE / 2;
            const rad = (midAngle * Math.PI) / 180;
            const textRadius = 85;
            const tx = 128 + textRadius * Math.sin(rad);
            const ty = 128 - textRadius * Math.cos(rad);

            return (
              <svg key={i} className="absolute inset-0 w-full h-full" viewBox="0 0 256 256" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Segment */}
                <path
                  d={describeArc(128, 128, 120, startAngle, startAngle + SEGMENT_ANGLE)}
                  fill={i % 2 === 0 ? r.bg : r.color + '99'}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                {/* Icon + text */}
                <text x={tx} y={ty - 8} textAnchor="middle" fontSize="16" dominantBaseline="middle">{r.icon}</text>
                <text x={tx} y={ty + 10} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" dominantBaseline="middle" fontFamily="system-ui">{r.label}</text>
              </svg>
            );
          })}
          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-slate-900 border-4 border-slate-600 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              <AppEmoji name="fire" size={22}/>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Result popup */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div initial={{opacity:0,scale:0.8,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8}} className="mb-5">
            <GlowCard glowColor={result.reward?.type==='badge'?'gold':'purple'} className="p-5 text-center">
              <div className="flex justify-center mb-2">
                <AppEmoji name={result.reward?.type==='badge'?'star':result.reward?.type==='xp'?'zap':'gift'} size={52}/>
              </div>
              <p className="text-white font-black text-xl mb-1">{result.reward?.label || `+${result.xpGained} XP`}</p>
              {result.xpGained > 0 && <p className="text-purple-400 text-sm">+{result.xpGained} XP earned!</p>}
              {result.leveledUp && <p className="text-yellow-400 font-black text-base mt-1 flex items-center justify-center gap-1"><AppEmoji name="confetti" size={18}/> Level Up → Level {result.newLevel}!</p>}
              {result.badgeUnlocked && <p className="text-yellow-400 text-sm mt-1 flex items-center justify-center gap-1"><AppEmoji name="medal" size={16}/> New badge unlocked!</p>}
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin buttons */}
      <div className="space-y-3 mb-5">
        {status?.canSpin ? (
          <GamingButton variant="secondary" size="lg" className="w-full" icon={Zap} onClick={() => spin(false)} disabled={spinning}>
            {spinning ? 'Spinning…' : 'Daily Free Spin!'}
          </GamingButton>
        ) : (
          <div className="py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
            <p className="text-slate-400 text-sm">Daily spin used · Resets at <span className="text-cyan-400 font-bold">4:00 AM IST</span></p>
          </div>
        )}
        {(status?.extraTickets || 0) > 0 && (
          <GamingButton variant="outline" size="md" className="w-full" icon={Ticket} onClick={() => spin(true)} disabled={spinning}>
            Use Spin Ticket ({status.extraTickets} left)
          </GamingButton>
        )}
      </div>

      {/* Reward guide */}
      <GlowCard glowColor="purple" className="p-4 mb-4">
        <p className="text-purple-400 font-bold text-sm mb-3 flex items-center gap-2"><Info className="w-4 h-4"/> Possible Rewards</p>
        <div className="grid grid-cols-2 gap-2">
          {REWARDS.map(r => (
            <div key={r.id} className="flex items-center gap-2">
              <AppEmoji name={r.type==='badge'?'medal':r.type==='xp'&&r.xp>=75?'crown':r.xp>=50?'fire':r.xp>=25?'zap':'star'} size={20}/>
              <div>
                <p className="text-white text-xs font-bold">{r.label}</p>
                <p className="text-slate-500 text-xs">{r.type === 'badge' ? 'Random Badge' : `${r.xp} XP`}</p>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Earn more tickets */}
      <GlowCard glowColor="gold" className="p-4">
        <p className="text-yellow-400 font-bold text-sm mb-1">Get Extra Spin Tickets</p>
        <p className="text-slate-400 text-xs">Complete a 7-day login streak to earn 1 free spin ticket for bonus spins!</p>
        <button onClick={() => navigate(createPageUrl('DailyRewards'))} className="text-cyan-400 text-xs font-bold mt-2 block hover:underline">View Daily Rewards →</button>
      </GlowCard>
    </div>
  );
}

// SVG arc path helper
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
