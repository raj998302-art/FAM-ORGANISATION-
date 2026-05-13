import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, Clock, Coins, ChevronLeft, ArrowRight, Flame, AlertCircle } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';

// Demo sales when no backend data
const DEMO_SALES = [
  { id:'fs1', title:'Weekend Mega Bonus', bonus_percent:50, min_amount:199, ends_at: new Date(Date.now()+3600000*8).toISOString(), color:'gold', icon_name:'fire', desc:'Get 50% extra coins on deposits ₹199+!' },
  { id:'fs2', title:'VIP Welcome Offer',  bonus_percent:25, min_amount:99,  ends_at: new Date(Date.now()+3600000*20).toISOString(), color:'purple', icon_name:'crown', desc:'25% extra coins for new VIP users!' },
  { id:'fs3', title:'Daily Power Hour',   bonus_percent:15, min_amount:49,  ends_at: new Date(Date.now()+3600000*2).toISOString(), color:'cyan', icon_name:'zap', desc:'Quick 1-hour flash offer!' },
];

export default function FlashSale() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales]     = useState([]);
  const [times, setTimes]     = useState({});

  useEffect(() => {
    load();
    const id = setInterval(() => updateTimers(), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (sales.length) updateTimers(); }, [sales]);

  const load = async () => {
    try {
      // Try backend API first, then entity list, then demo
      let res = [];
      try { res = await apiClient.integrations.FlashSale.getActive(); } catch {}
      if (!res || !res.length) {
        try {
          const entities = await apiClient.entities.FlashSale.list('-created_date', 50);
          res = (entities || [])
            .filter(s => s.is_active && new Date(s.ends_at) > new Date())
            .map(s => ({ ...s, id: s.id }));
        } catch {}
      }
      setSales(res.length ? res : DEMO_SALES);
    } catch(e) { setSales(DEMO_SALES); }
    finally { setLoading(false); }
  };

  const updateTimers = () => {
    const t = {};
    (sales.length ? sales : DEMO_SALES).forEach(s => {
      const ms = new Date(s.ends_at).getTime() - Date.now();
      if (ms <= 0) { t[s.id] = 'Ended'; return; }
      const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), sec = Math.floor((ms%60000)/1000);
      t[s.id] = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    });
    setTimes(t);
  };

  if (loading) return <LoadingScreen message="Loading Offers…"/>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div>
          <NeonText color="red" size="2xl" className="flex items-center gap-2"><AppEmoji name="zap" size={24}/> Flash Sales</NeonText>
          <p className="text-slate-400 text-xs">Limited-time bonus coin offers — don't miss out!</p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
        <p className="text-red-400 text-sm font-bold">{sales.length} Active Flash Offers</p>
      </div>

      <div className="space-y-4">
        {sales.map((sale, i) => {
          const isEnded = times[sale.id] === 'Ended';
          const cmap = { gold:'yellow', purple:'purple', cyan:'cyan', red:'red' };
          const c = cmap[sale.color] || 'cyan';
          return (
            <motion.div key={sale.id} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}>
              <GlowCard glowColor={isEnded?'slate':sale.color||'cyan'} className={`p-5 relative overflow-hidden ${isEnded?'opacity-50':''}`}>
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${c==='yellow'?'from-yellow-400 to-orange-500':c==='purple'?'from-purple-500 to-pink-500':'from-cyan-500 to-blue-500'}`}/>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AppEmoji name={sale.icon_name || 'fire'} size={36}/>
                    <div>
                      <p className="text-white font-black text-base">{sale.title}</p>
                      <p className="text-slate-400 text-xs">{sale.desc || `Min deposit: ₹${sale.min_amount}`}</p>
                    </div>
                  </div>
                  <div className={`text-3xl font-black text-${c==='yellow'?'yellow':c}-400`}>+{sale.bonus_percent}%</div>
                </div>

                {/* Countdown */}
                <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-${c==='yellow'?'yellow':c}-500/10 border border-${c==='yellow'?'yellow':c}-500/20`}>
                  <Clock className={`w-4 h-4 text-${c==='yellow'?'yellow':c}-400`}/>
                  <span className="text-slate-400 text-sm">Ends in:</span>
                  <span className={`font-mono font-black text-${c==='yellow'?'yellow':c}-400 text-lg`}>{times[sale.id] || '--:--:--'}</span>
                </div>

                {/* Example calculation */}
                <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
                  <p className="text-slate-400 text-xs mb-1">Example: Deposit ₹{sale.min_amount}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-300">Base: {sale.min_amount} coins</span>
                    <span className="text-green-400 font-bold">+ Bonus: {Math.floor(sale.min_amount * sale.bonus_percent/100)} coins</span>
                    <span className="text-cyan-400 font-black">= {sale.min_amount + Math.floor(sale.min_amount * sale.bonus_percent/100)} total!</span>
                  </div>
                </div>

                <GamingButton variant={isEnded?'outline':'primary'} size="md" className="w-full" icon={ArrowRight}
                  disabled={isEnded} onClick={() => navigate(createPageUrl('Deposit'))}>
                  {isEnded ? 'Offer Ended' : `Grab This Offer →`}
                </GamingButton>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      <GlowCard glowColor="purple" className="p-4 mt-4">
        <p className="text-purple-400 font-bold text-sm mb-1">🔔 Never Miss a Deal!</p>
        <p className="text-slate-400 text-xs">VIP members get early access to flash sales + exclusive VIP-only offers with up to 100% bonus coins!</p>
        <button onClick={() => navigate('/vip-plans')} className="text-cyan-400 text-xs font-bold mt-2 hover:underline">Get VIP Access →</button>
      </GlowCard>
    </div>
  );
}
