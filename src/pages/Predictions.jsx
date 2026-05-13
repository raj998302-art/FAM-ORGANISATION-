import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Coins, ChevronLeft, Trophy, Clock, CheckCircle, Flame, Users } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const DEMO_PREDICTIONS = [
  { id:'p1', question:'Who wins FAM Grand Final?', optionA:'Team Alpha', optionB:'Team Dragon', totalA:340, totalB:210, status:'open', ends_at: new Date(Date.now()+86400000*2).toISOString(), prize_multiplier: 1.8 },
  { id:'p2', question:'Most kills in Solo Final?', optionA:'ThunderBolt_FF', optionB:'KillerKing_07', totalA:180, totalB:290, status:'open', ends_at: new Date(Date.now()+86400000).toISOString(), prize_multiplier: 2.0 },
  { id:'p3', question:'Will Squad match have 20+ kills?', optionA:'Yes', optionB:'No', totalA:520, totalB:190, status:'open', ends_at: new Date(Date.now()+3600000*6).toISOString(), prize_multiplier: 1.5 },
];

export default function Predictions() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [preds, setPreds]       = useState([]);
  const [wallet, setWallet]     = useState(null);
  const [betModal, setBetModal] = useState(null); // {pred, choice}
  const [betAmt, setBetAmt]     = useState('');
  const [placing, setPlacing]   = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const user = await apiClient.auth.me();
      const [ps, ws] = await Promise.all([
        apiClient.integrations.Predictions.getAll().catch(() => DEMO_PREDICTIONS),
        apiClient.entities.Wallet.filter({ user_email: user.email }),
      ]);
      setPreds(ps.length ? ps : DEMO_PREDICTIONS);
      if (ws[0]) setWallet(ws[0]);
    } catch(e) { setPreds(DEMO_PREDICTIONS); }
    finally { setLoading(false); }
  };

  const placeBet = async () => {
    const amt = parseInt(betAmt);
    if (!amt || amt < 5) { toast.error('Minimum bet is 5 coins'); return; }
    if (amt > (wallet?.balance || 0)) { toast.error('Insufficient coins'); return; }
    setPlacing(true);
    try {
      await apiClient.integrations.Predictions.placeBet(betModal.pred.id, betModal.choice, amt);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      toast.success(`✅ Bet placed! ${amt} coins on "${betModal.choice}"`);
      setBetModal(null); setBetAmt('');
      await load();
    } catch(e) { toast.error(e.message || 'Could not place bet'); }
    finally { setPlacing(false); }
  };

  const timeLeft = (dateStr) => {
    const ms = new Date(dateStr).getTime() - Date.now();
    if (ms <= 0) return 'Ended';
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
    return h > 24 ? `${Math.floor(h/24)}d ${h%24}h` : `${h}h ${m}m`;
  };

  if (loading) return <LoadingScreen message="Loading Predictions…"/>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div className="flex-1">
          <NeonText color="purple" size="2xl" className="block">🔮 Predictions</NeonText>
          <p className="text-slate-400 text-xs">Predict match outcomes · Win multiplied coins!</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30">
          <Coins className="w-4 h-4 text-yellow-400"/><span className="text-yellow-400 font-bold text-sm">{wallet?.balance||0}</span>
        </div>
      </div>

      {/* How it works */}
      <GlowCard glowColor="purple" className="p-4 mb-5">
        <p className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-1"><AppEmoji name="predict" size={16}/> How Predictions Work</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Pick a side','Choose Option A or B','1️⃣'],['Place coins','Bet minimum 5 coins','2️⃣'],['Win big!','Correct = multiplied coins!','3️⃣']].map(([t,d,n])=>(
            <div key={t} className="bg-slate-800/50 rounded-xl p-2">
              <p className="text-xl mb-1">{n}</p>
              <p className="text-white text-xs font-bold">{t}</p>
              <p className="text-slate-500 text-xs">{d}</p>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Predictions */}
      <div className="space-y-4">
        {preds.map((pred, i) => {
          const total = (pred.totalA||0) + (pred.totalB||0);
          const pctA = total ? Math.round((pred.totalA/total)*100) : 50;
          const pctB = 100 - pctA;
          const hasBet = !!pred.myBet;
          return (
            <motion.div key={pred.id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}>
              <GlowCard glowColor="purple" className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-white font-bold text-sm flex-1 mr-2">{pred.question}</p>
                  <div className="flex items-center gap-1 text-xs text-orange-400 flex-shrink-0">
                    <Clock className="w-3 h-3"/>{timeLeft(pred.ends_at)}
                  </div>
                </div>

                {/* Odds bar */}
                <div className="mb-4">
                  <div className="flex text-xs text-slate-400 justify-between mb-1">
                    <span>{pred.optionA} ({pctA}%)</span><span>{pred.optionB} ({pctB}%)</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{width:`${pctA}%`}}/>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{width:`${pctB}%`}}/>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{pred.totalA} coins</span>
                    <span className="text-yellow-400 font-bold">{pred.prize_multiplier}x Multiplier</span>
                    <span>{pred.totalB} coins</span>
                  </div>
                </div>

                {hasBet ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                    <CheckCircle className="w-4 h-4 text-green-400 inline mr-1"/>
                    <span className="text-green-400 text-sm font-bold">Bet on "{pred.myBet.choice}" — {pred.myBet.amount} coins</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setBetModal({pred, choice: pred.optionA}); setBetAmt(''); }}
                      className="py-2.5 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-bold text-sm hover:bg-cyan-500/25 transition-all active:scale-95">
                      {pred.optionA}
                    </button>
                    <button onClick={() => { setBetModal({pred, choice: pred.optionB}); setBetAmt(''); }}
                      className="py-2.5 px-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-400 font-bold text-sm hover:bg-purple-500/25 transition-all active:scale-95">
                      {pred.optionB}
                    </button>
                  </div>
                )}
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {/* Bet Modal */}
      <AnimatePresence>
        {betModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setBetModal(null)}>
            <motion.div initial={{y:100}} animate={{y:0}} exit={{y:100}} transition={{type:'spring',damping:25}}
              className="w-full max-w-sm mb-4 mx-4" onClick={e=>e.stopPropagation()}>
              <GlowCard glowColor="purple" className="p-6">
                <p className="text-slate-400 text-sm mb-1">Betting on:</p>
                <p className="text-purple-400 font-black text-xl mb-1">"{betModal.choice}"</p>
                <p className="text-slate-500 text-xs mb-4">{betModal.pred.question}</p>
                <p className="text-yellow-400 text-xs mb-3">Win multiplier: <span className="font-black text-base">{betModal.pred.prize_multiplier}x</span></p>
                <input type="number" value={betAmt} onChange={e=>setBetAmt(e.target.value)} placeholder="Bet amount (min 5 coins)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-bold text-center mb-3 focus:outline-none focus:border-purple-400"/>
                <div className="flex gap-2 mb-3">
                  {[5,10,25,50].map(a=>(
                    <button key={a} onClick={()=>setBetAmt(a.toString())}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${parseInt(betAmt)===a?'bg-purple-500/20 border-purple-400 text-purple-400':'bg-slate-800 border-slate-700 text-slate-400'}`}>{a}</button>
                  ))}
                </div>
                <GamingButton variant="secondary" size="md" className="w-full" icon={TrendingUp} onClick={placeBet} disabled={placing}>
                  {placing?'Placing…':`Place ${betAmt||'?'} Coins Bet`}
                </GamingButton>
              </GlowCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
