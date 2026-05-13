import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, Lock, CheckCircle, Crown, Zap, Gift, ChevronLeft, Coins, ChevronRight, Target, Info, ShoppingBag } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Map legacy text emojis → AppEmoji names
const EMOJI_MAP = {
  '📅':'calendar','🏆':'trophy','💬':'chat','🎯':'target','🥇':'trophy',
  '💀':'skull','👥':'team','🏅':'medal','💳':'coins','🔥':'fire',
  '💰':'coins','⭐':'star','🪙':'coins','💫':'star','🎁':'gift',
  '⚔️':'zap','💎':'diamond','👑':'crown','⚡':'zap','🔷':'diamond',
  '👻':'star','🥷':'skull','🌌':'diamond','💥':'fire','🔮':'predict',
};
const EmojiIcon = ({ icon, size = 24 }) => {
  const name = EMOJI_MAP[icon] || 'star';
  return <AppEmoji name={name} size={size} />;
};

// Season missions — hard, tournament-focused
const SEASON_MISSIONS = [
  // Level 1–2 unlocks
  { id:'sm_login5',   title:'Login 5 Days Straight',       xp:100, icon:'📅', req:'Login 5 consecutive days',          lv:1 },
  { id:'sm_join3',    title:'Join 3 Tournaments',          xp:200, icon:'🏆', req:'Register in any 3 tournaments',      lv:1 },
  { id:'sm_chat20',   title:'Chat 20 Messages',            xp:80,  icon:'💬', req:'Send 20 messages in any chat',        lv:1 },
  // Level 3–4 unlocks
  { id:'sm_top5',     title:'Top 5 Finish',                xp:300, icon:'🎯', req:'Finish in top 5 in any tournament',   lv:3 },
  { id:'sm_solo_win', title:'Win a Solo Match',            xp:400, icon:'🥇', req:'Come 1st place in a Solo tournament', lv:3 },
  { id:'sm_kills10',  title:'10 Kills in One Match',       xp:350, icon:'💀', req:'Get 10+ kills in a single match',     lv:3 },
  // Level 5–6 unlocks
  { id:'sm_squad_win','title':'Win a Squad Match',         xp:500, icon:'👥', req:'Win 1st place in a Squad tournament', lv:5 },
  { id:'sm_join10',   title:'Join 10 Tournaments',        xp:600, icon:'🏅', req:'Participate in 10 total tournaments',  lv:5 },
  { id:'sm_dep500',   title:'Deposit ₹500+',              xp:400, icon:'💳', req:'Make a single deposit of ₹500 or more',lv:5 },
  // Level 7–8 unlocks
  { id:'sm_streak7',  title:'7-Day Login Streak',         xp:700, icon:'🔥', req:'Login 7 days in a row',               lv:7 },
  { id:'sm_win3',     title:'Win 3 Tournaments',          xp:800, icon:'🏆', req:'Win first place 3 times total',        lv:7 },
  { id:'sm_ref3',     title:'Refer 3 Friends',            xp:600, icon:'👥', req:'Refer 3 people who sign up',           lv:7 },
  // Level 9–10 unlocks
  { id:'sm_kills50',  title:'50 Total Tournament Kills',  xp:900,  icon:'🎯', req:'Accumulate 50+ kills across matches',  lv:9 },
  { id:'sm_mega_dep', title:'Mega Deposit ₹1000+',        xp:1000, icon:'💰', req:'Deposit ₹1000 or more in one go',      lv:9 },
  { id:'sm_15_tourn', title:'Complete 15 Tournaments',    xp:1200, icon:'🏆', req:'Join and complete 15 tournaments',     lv:9 },
];

const FREE_REWARDS = [
  { lv:1,  icon:'⭐', label:'+50 XP Bonus',        type:'xp',   amount:50   },
  { lv:2,  icon:'🎯', label:'+100 XP Bonus',       type:'xp',   amount:100  },
  { lv:3,  icon:'🪙', label:'+5 Coins',            type:'coins',amount:5    }, // small coin reward
  { lv:4,  icon:'💫', label:'+150 XP Bonus',       type:'xp',   amount:150  },
  { lv:5,  icon:'⭐', label:'Rising Star Badge',   type:'badge',badge:'badge_rookie' },
  { lv:6,  icon:'🔥', label:'+200 XP Bonus',       type:'xp',   amount:200  },
  { lv:7,  icon:'🪙', label:'+5 Coins',            type:'coins',amount:5    }, // small reward
  { lv:8,  icon:'⚔️', label:'Veteran Badge',       type:'badge',badge:'badge_veteran' },
  { lv:9,  icon:'💎', label:'+300 XP Bonus',       type:'xp',   amount:300  },
  { lv:10, icon:'🏆', label:'Champion Title',      type:'title',item:'title_champion' },
  { lv:11, icon:'🎁', label:'+5 Coins',            type:'coins',amount:5    },
  { lv:12, icon:'🎯', label:'+500 XP Mega Bonus',  type:'xp',   amount:500  },
  { lv:13, icon:'⭐', label:'Sniper Badge',        type:'badge',badge:'badge_sniper' },
  { lv:14, icon:'🔥', label:'+700 XP Bonus',       type:'xp',   amount:700  },
  { lv:15, icon:'👑', label:'Cyber Frame + 5 Coins',type:'frame',item:'frame_cyber',coinBonus:5 },
];

const PREMIUM_REWARDS = [
  { lv:1,  icon:'🎯', label:'Sniper Elite Badge',  type:'badge', badge:'badge_sniper'       },
  { lv:2,  icon:'⚡', label:'2x XP Boost 3 Days',  type:'xp_boost', days:3                  },
  { lv:3,  icon:'🔷', label:'Cyber Neon Frame',    type:'frame', item:'frame_cyber'          },
  { lv:4,  icon:'👻', label:'Phantom Badge',       type:'badge', badge:'badge_phantom'       },
  { lv:5,  icon:'🔥', label:'Fire Chat Effect',    type:'effect',item:'chat_fire'            },
  { lv:6,  icon:'🪙', label:'+20 Coins',           type:'coins', amount:20                   },
  { lv:7,  icon:'⚡', label:'Electric Frame',      type:'frame', item:'frame_electric'       },
  { lv:8,  icon:'🎯', label:'Ace Player Badge',    type:'badge', badge:'badge_ace'           },
  { lv:9,  icon:'🥷', label:'Shadow Ninja Title',  type:'title', item:'title_ninja'          },
  { lv:10, icon:'🪙', label:'+30 Coins',           type:'coins', amount:30                   },
  { lv:11, icon:'🌌', label:'Galaxy Frame',        type:'frame', item:'frame_galaxy'         },
  { lv:12, icon:'🎯', label:'Destroyer Title',     type:'title', item:'title_destroyer'      },
  { lv:13, icon:'💥', label:'Rainbow Chat Effect', type:'effect',item:'chat_rainbow'         },
  { lv:14, icon:'🔥', label:'Fire Frame',          type:'frame', item:'frame_fire'           },
  { lv:15, icon:'👑', label:'🔥 FIRE LEGEND BADGE',type:'badge', badge:'badge_fire_legend'   },
];

const PASS_PRICE = 199;

export default function SeasonPass() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [pass, setPass]         = useState(null);
  const [missions, setMissions] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [buying, setBuying]     = useState(false);
  const [tab, setTab]           = useState('rewards'); // rewards | missions

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, ms] = await Promise.all([
        apiClient.integrations.SeasonPass.getStatus(),
        apiClient.integrations.Missions.getAll().catch(() => []),
      ]);
      setPass(p); setMissions(ms || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const buyPass = async () => {
    setBuying(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL||'/api'}/features/season-pass/buy`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('token')}`},
        body:'{}'
      }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
      confetti({ particleCount:120, spread:80, origin:{y:0.55} });
      toast.success('🏅 Premium Season Pass activated!');
      await load();
    } catch(e) { toast.error(e.message); }
    finally { setBuying(false); }
  };

  const claim = async (level, track) => {
    setClaiming(`${level}_${track}`);
    try {
      const res = await apiClient.integrations.SeasonPass.claim(level, track);
      confetti({ particleCount:50, spread:60, origin:{y:0.6} });
      const granted = res.granted;
      if (granted?.type === 'coins') toast.success(`+${granted.amount} coins added to wallet!`);
      else if (granted?.type === 'xp') toast.success(`+${granted.amount} XP earned!`);
      else if (granted?.type === 'badge') toast.success(`🏅 ${res.reward?.label} unlocked!`);
      else if (granted?.type === 'frame') toast.success(`🖼️ ${res.reward?.label} unlocked!`);
      else toast.success(`${res.reward?.label} claimed!`);
      if (res.leveledUp) setTimeout(() => toast.success(`🎉 Level Up → Level ${res.newLevel}!`), 600);
      await load();
    } catch(e) { toast.error(e.message); }
    finally { setClaiming(null); }
  };

  if (loading) return <LoadingScreen message="Loading Season Pass…"/>;

  const seasonLevel = pass?.seasonLevel || 1;
  const totalXP = pass?.totalXP || 0;
  const isPremium = pass?.premium;
  const claimedFree = pass?.claimed_free || [];
  const claimedPremium = pass?.claimed_premium || [];
  const xpPct = pass?.nextLevelXP ? Math.min(100, ((totalXP % 500) / 500) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div className="flex-1">
          <NeonText color="gold" size="2xl" className="block">🏅 Season Pass</NeonText>
          <p className="text-slate-400 text-xs">Earn XP → Level up → Claim exclusive rewards</p>
        </div>
        {isPremium && <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full"><Crown className="w-4 h-4 text-yellow-400"/><span className="text-yellow-400 font-bold text-xs">PREMIUM</span></div>}
      </div>

      {/* XP Progress */}
      <GlowCard glowColor={isPremium?'gold':'cyan'} className="p-5 mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-lg ${isPremium?'bg-gradient-to-br from-yellow-400 to-orange-500':'bg-gradient-to-br from-cyan-500 to-blue-600'}`}>{seasonLevel}</div>
          <div className="flex-1">
            <p className="text-white font-bold">Season Level {seasonLevel}</p>
            <p className="text-slate-400 text-sm">{totalXP.toLocaleString()} Total XP</p>
            <p className="text-xs text-slate-500 mt-0.5">{pass?.xpToNext || 0} XP to Level {Math.min(seasonLevel+1,15)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Lv {seasonLevel}</span>
          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div initial={{width:0}} animate={{width:`${xpPct}%`}} transition={{duration:0.8}}
              className={`h-full rounded-full ${isPremium?'bg-gradient-to-r from-yellow-400 to-orange-500':'bg-gradient-to-r from-cyan-500 to-blue-500'}`}/>
          </div>
          <span>Lv {Math.min(seasonLevel+1,15)}</span>
        </div>
      </GlowCard>

      {/* Buy Premium Banner */}
      {!isPremium && (
        <GlowCard glowColor="gold" className="p-4 mb-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400"/>
          <div className="flex items-center gap-4 mb-3">
            <motion.div animate={{scale:[1,1.05,1],rotate:[0,3,-3,0]}} transition={{duration:2,repeat:Infinity}}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <AppEmoji name="crown" size={32}/>
            </motion.div>
            <div>
              <p className="text-yellow-400 font-black text-lg">Premium Pass</p>
              <p className="text-slate-300 text-sm">Unlock 15 exclusive rewards including badges, frames & titles!</p>
              <p className="text-slate-400 text-xs mt-0.5">Balance: {pass?.balance||0} coins · Price: {PASS_PRICE} coins</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 mb-3">
            {PREMIUM_REWARDS.slice(0,10).map(r=>(
              <div key={r.lv} className="flex flex-col items-center p-1.5 bg-slate-800/60 rounded-lg">
                <EmojiIcon icon={r.icon} size={22}/>
                <span className="text-slate-500 text-xs truncate w-full text-center">{r.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <GamingButton variant="gold" size="md" className="w-full" icon={Crown} onClick={buyPass} disabled={buying||(pass?.balance||0)<PASS_PRICE}>
            {buying?'Processing…':(pass?.balance||0)<PASS_PRICE?`Need ${PASS_PRICE-(pass?.balance||0)} more coins`:`Unlock Premium — ${PASS_PRICE} Coins (₹${PASS_PRICE})`}
          </GamingButton>
          {(pass?.balance||0) < PASS_PRICE && (
            <GamingButton variant="outline" size="sm" className="w-full mt-2" icon={Coins} onClick={()=>navigate(createPageUrl('Deposit'))}>Top Up Coins →</GamingButton>
          )}
        </GlowCard>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[['rewards','🎁 Rewards'],['missions','🎯 Missions']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tab===t?'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400':'bg-slate-800 border border-slate-700 text-slate-400'}`}>{l}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'rewards' ? (
          <motion.div key="rewards" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} className="space-y-2">
            {FREE_REWARDS.map((r,i) => {
              const canClaim = seasonLevel >= r.lv;
              const freeClaimed = claimedFree.includes(`${r.lv}_free`);
              const premReward = PREMIUM_REWARDS.find(p=>p.lv===r.lv);
              const premClaimed = claimedPremium.includes(`${r.lv}_premium`);

              return (
                <motion.div key={r.lv} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
                  <GlowCard glowColor={canClaim?'cyan':'slate'} className="p-3">
                    <div className="flex items-center gap-2">
                      {/* Level badge */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${canClaim?'bg-cyan-500/20 text-cyan-400':'bg-slate-700 text-slate-500'}`}>{r.lv}</div>

                      {/* Free Track */}
                      <div className={`flex-1 flex items-center justify-between p-2 rounded-lg border ${freeClaimed?'bg-green-500/10 border-green-500/30':'bg-slate-800/60 border-slate-700/40'}`}>
                        <div className="flex items-center gap-1.5">
                          <EmojiIcon icon={r.icon} size={20}/>
                          <div><p className="text-white text-xs font-bold leading-tight">{r.label}</p><p className="text-slate-500 text-xs">Free</p></div>
                        </div>
                        {freeClaimed ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0"/>
                          : canClaim ? <button onClick={()=>claim(r.lv,'free')} disabled={!!claiming}
                              className="px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold rounded-lg active:scale-95">
                              {claiming===`${r.lv}_free`?'…':'Claim'}
                            </button>
                          : <Lock className="w-3.5 h-3.5 text-slate-600"/>}
                      </div>

                      {/* Premium Track */}
                      <div className={`flex-1 flex items-center justify-between p-2 rounded-lg border relative ${
                        premClaimed?'bg-green-500/10 border-green-500/30':
                        isPremium&&canClaim?'bg-yellow-500/10 border-yellow-500/30':
                        'bg-slate-800/20 border-slate-700/20 opacity-60'}`}>
                        {!isPremium && <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/50 rounded-lg"><Crown className="w-4 h-4 text-yellow-500/50"/></div>}
                        {premReward && <>
                          <div className="flex items-center gap-1.5">
                            <EmojiIcon icon={premReward.icon} size={20}/>
                            <div><p className={`text-xs font-bold leading-tight ${isPremium?'text-yellow-400':'text-slate-500'}`}>{premReward.label}</p><p className="text-slate-500 text-xs">Premium</p></div>
                          </div>
                          {isPremium && (premClaimed ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0"/>
                            : canClaim ? <button onClick={()=>claim(r.lv,'premium')} disabled={!!claiming}
                                className="px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold rounded-lg active:scale-95">
                                {claiming===`${r.lv}_premium`?'…':'Claim'}
                              </button>
                            : <Lock className="w-3.5 h-3.5 text-slate-600"/>)}
                        </>}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="missions" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}>
            <p className="text-slate-400 text-xs mb-3 text-center">Complete missions to earn XP and level up your Season Pass</p>
            <div className="space-y-2">
              {SEASON_MISSIONS.map((m,i) => {
                const unlocked = seasonLevel >= m.lv;
                const done = missions.find(ms=>ms.id===m.id)?.completed;
                return (
                  <motion.div key={m.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                    <GlowCard glowColor={done?'green':unlocked?'cyan':'slate'} className={`p-4 ${!unlocked?'opacity-60':''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${done?'bg-green-500/20':unlocked?'bg-cyan-500/20':'bg-slate-700'}`}><EmojiIcon icon={m.icon} size={26}/></div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${done?'line-through text-slate-500':'text-white'}`}>{m.title}</p>
                          <p className="text-xs text-slate-500">{m.req}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-purple-400 text-xs font-bold">+{m.xp} XP</span>
                            {m.lv > 1 && !unlocked && <span className="text-slate-600 text-xs">· Unlocks at Season Lv {m.lv}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {done ? <CheckCircle className="w-6 h-6 text-green-400"/>
                            : !unlocked ? <Lock className="w-5 h-5 text-slate-600"/>
                            : <div className="w-5 h-5 rounded-full border-2 border-slate-600"/>}
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP sources */}
      {tab==='rewards' && (
        <GlowCard glowColor="purple" className="p-4 mt-4">
          <p className="text-purple-400 font-bold text-sm mb-2">⚡ How to Earn XP Fast</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[['Win Tournament','150 XP'],['Daily Spin','5–100 XP'],['Daily Login','20 XP'],['Complete Mission','varies'],['Buy Store Item','50 XP'],['Deposit Coins','30 XP'],['Refer Friend','100 XP'],['Chat Active','5 XP']].map(([a,b])=>(
              <div key={a} className="flex justify-between text-xs px-2 py-1 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">{a}</span><span className="text-purple-400 font-bold">{b}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}
