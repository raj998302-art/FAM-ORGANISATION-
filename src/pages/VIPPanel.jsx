import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Star, Zap, Trophy, Gift, Gamepad2, Users, ChevronRight,
  Coins, AlertTriangle, RefreshCw, MessageCircle, Headphones, X,
  ShieldCheck, Clock, Flame, Wallet
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import RoleBadge from '../components/ui/RoleBadge';
import { getUserRoles } from '@/lib/permissions';
import { toast } from 'sonner';

const VIP_ROLES = ['vip_elite', 'vip_plus', 'vip'];

const FEATURES = {
  vip: [
    { icon: Trophy,        label: 'VIP Tournaments',  desc: 'Exclusive VIP-only tournaments',       color: 'cyan',   page: 'VIPTournaments' },
    { icon: MessageCircle, label: 'VIP Chat',          desc: 'Private lounge for VIP members',       color: 'blue',   page: 'VIPChat' },
    { icon: Headphones,    label: 'VIP Support',       desc: 'Priority support channel',             color: 'purple', page: 'VIPSupport' },
    { icon: Gift,          label: '5% Deposit Bonus',  desc: 'Extra coins on every deposit',         color: 'green',  page: null },
    { icon: ShieldCheck,   label: 'VIP Badge',         desc: 'Exclusive badge on your profile',      color: 'cyan',   page: null },
  ],
  vip_plus: [
    { icon: Trophy,        label: 'VIP+ Tournaments',  desc: 'Higher prize pools & brackets',        color: 'purple', page: 'VIPTournaments' },
    { icon: MessageCircle, label: 'VIP+ Chat',         desc: 'Exclusive VIP+ lounge',                color: 'purple', page: 'VIPChat' },
    { icon: Headphones,    label: 'VIP+ Support',      desc: 'Dedicated support channel',            color: 'purple', page: 'VIPSupport' },
    { icon: Gift,          label: '10% Deposit Bonus', desc: 'Bigger bonus on every deposit',        color: 'green',  page: null },
    { icon: Zap,           label: 'Early Registration',desc: 'Register before everyone else',        color: 'cyan',   page: null },
    { icon: Gamepad2,      label: 'Custom Room Access',desc: 'Join private hosted rooms',            color: 'orange', page: null },
  ],
  vip_elite: [
    { icon: Crown,         label: 'Elite Tournaments', desc: 'Biggest prize pools on platform',      color: 'gold',   page: 'VIPTournaments' },
    { icon: MessageCircle, label: 'Elite Lounge',      desc: 'Top-secret elite-only chat',           color: 'gold',   page: 'VIPChat' },
    { icon: Headphones,    label: 'Personal Manager',  desc: 'Dedicated account manager for you',    color: 'gold',   page: 'VIPSupport' },
    { icon: Gift,          label: '15% Deposit Bonus', desc: 'Maximum bonus on every deposit',       color: 'green',  page: null },
    { icon: Zap,           label: 'Instant Withdrawal',desc: 'Priority withdrawal processing',       color: 'cyan',   page: null },
    { icon: ShieldCheck,   label: 'Custom Border',     desc: 'Unique elite border on profile',       color: 'gold',   page: null },
  ]
};

const TIER = {
  vip:       { label: 'VIP',       color: 'cyan',   icon: Star,  gradient: 'from-cyan-500 to-blue-500',     planId: 'vip_weekly',       renewPrice: 49,  renewDays: 7  },
  vip_plus:  { label: 'VIP+',      color: 'purple', icon: Zap,   gradient: 'from-purple-500 to-pink-500',   planId: 'vip_plus_monthly', renewPrice: 149, renewDays: 30 },
  vip_elite: { label: 'VIP ELITE', color: 'gold',   icon: Crown, gradient: 'from-yellow-400 to-orange-500', planId: 'vip_elite_monthly',renewPrice: 299, renewDays: 30 },
};

function RenewalModal({ config, wallet, onRenew, onDismiss, isExpired, renewing }) {
  const Icon = config.icon;
  const canAfford = (wallet?.balance || 0) >= config.renewPrice;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{scale:0.8,y:30}} animate={{scale:1,y:0}} exit={{scale:0.8,y:30}} className="w-full max-w-sm">
        <GlowCard glowColor={isExpired?'red':config.color} className="p-6 relative">
          <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${config.gradient} rounded-t-2xl`}/>
          {!isExpired && (
            <button onClick={onDismiss} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white">
              <X className="w-4 h-4"/>
            </button>
          )}
          <div className="text-center mb-5">
            <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:1.5,repeat:Infinity}}
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} mx-auto flex items-center justify-center mb-3`}>
              {isExpired ? <AlertTriangle className="w-10 h-10 text-white"/> : <Clock className="w-10 h-10 text-white"/>}
            </motion.div>
            <NeonText color={isExpired?'red':config.color} size="xl" className="block mb-1">
              {isExpired ? "Subscription Expired" : "Expiring Soon!"}
            </NeonText>
            <p className="text-slate-400 text-sm">{isExpired ? `Your ${config.label} has expired. Renew to restore VIP access.` : `Your ${config.label} expires soon! Renew now.`}</p>
          </div>
          <div className="bg-slate-800/70 rounded-xl p-3 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Your balance</span>
              <span className={`font-bold ${canAfford?'text-green-400':'text-red-400'}`}>{wallet?.balance||0} coins</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Renewal cost</span>
              <span className="text-yellow-400 font-bold">{config.renewPrice} coins / {config.renewDays}d</span>
            </div>
            {!canAfford && <p className="text-red-400 text-xs text-center pt-1 border-t border-slate-700">Need {config.renewPrice-(wallet?.balance||0)} more coins</p>}
          </div>
          <div className="space-y-2">
            {canAfford ? (
              <button onClick={onRenew} disabled={renewing}
                className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${config.gradient} border border-white/10 transition-all ${renewing?'opacity-60':''}`}>
                {renewing ? 'Renewing…' : `Renew ${config.label} — ${config.renewPrice} Coins`}
              </button>
            ) : (
              <button onClick={() => window.location.href = createPageUrl('Deposit')}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-cyan-400/30">
                Top Up Coins First
              </button>
            )}
          </div>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}

export default function VIPPanel() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [user, setUser]               = useState(null);
  const [tier, setTier]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [wallet, setWallet]           = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [timeLeft, setTimeLeft]       = useState('');
  const [expiryPct, setExpiryPct]     = useState(0);
  const [showRenewal, setShowRenewal] = useState(false);
  const [isExpired, setIsExpired]     = useState(false);
  const [renewing, setRenewing]       = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!subscription?.end_date) return;
    const tick = () => {
      const now = Date.now();
      const end = new Date(subscription.end_date).getTime();
      const start = new Date(subscription.start_date || subscription.createdAt || now - 86400000*30).getTime();
      const remaining = end - now;
      setExpiryPct(Math.min(100, Math.max(0, ((now-start)/(end-start))*100)));
      if (remaining <= 0) {
        setTimeLeft('Expired'); setIsExpired(true); setShowRenewal(true);
      } else {
        const d=Math.floor(remaining/86400000), h=Math.floor((remaining/3600000)%24),
              m=Math.floor((remaining/60000)%60), s=Math.floor((remaining/1000)%60);
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
        if (remaining < 2*86400000) setShowRenewal(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [subscription]);

  const loadData = async () => {
    try {
      const cu = await apiClient.auth.me();
      const roles = getUserRoles(cu);
      const activeTier = VIP_ROLES.find(r => roles.includes(r));
      if (!activeTier) { navigate(createPageUrl('VIPPlans')); return; }
      setUser(cu); setTier(activeTier);
      const [profiles, wallets, subs] = await Promise.all([
        apiClient.entities.UserProfile.filter({ user_email: cu.email }),
        apiClient.entities.Wallet.filter({ user_email: cu.email }),
        apiClient.entities.Subscription.filter({ user_email: cu.email, status: 'active' }),
      ]);
      if (profiles[0]) setProfile(profiles[0]);
      if (wallets[0])  setWallet(wallets[0]);
      const sub = subs.find(s => s.role === activeTier);
      if (sub) setSubscription(sub);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRenew = async () => {
    if (!tier) return;
    const cfg = TIER[tier];
    setRenewing(true);
    try {
      await apiClient.integrations.Payment.SubscribeVIP({ planId: cfg.planId, role: tier, price: cfg.renewPrice, days: cfg.renewDays });
      toast.success(`✅ ${cfg.label} renewed for ${cfg.renewDays} days!`);
      setShowRenewal(false); setIsExpired(false);
      await loadData();
    } catch(err) { toast.error(err.message || 'Renewal failed'); }
    finally { setRenewing(false); }
  };

  if (loading) return <LoadingScreen message="Loading VIP Panel…"/>;

  const cfg = TIER[tier];
  const Icon = cfg?.icon || Crown;
  const features = FEATURES[tier] || [];

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-20 px-4">
      <AnimatePresence>
        {showRenewal && cfg && (
          <RenewalModal config={cfg} wallet={wallet}
            onRenew={handleRenew} onDismiss={() => !isExpired && setShowRenewal(false)}
            isExpired={isExpired} renewing={renewing}/>
        )}
      </AnimatePresence>

      {/* Hero */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="text-center mb-5">
        <motion.div animate={{scale:[1,1.05,1],rotate:[0,3,-3,0]}} transition={{duration:3,repeat:Infinity}} className="inline-block mb-3">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${cfg?.gradient} mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.4)]`}>
            <Icon className="w-12 h-12 text-white"/>
          </div>
        </motion.div>
        <NeonText color={cfg?.color||'gold'} size="3xl" className="block mb-1">{cfg?.label} PANEL</NeonText>
        <p className="text-slate-400 text-sm mb-3">Welcome to your exclusive VIP zone</p>
        <RoleBadge role={tier} size="lg"/>
      </motion.div>

      {/* Countdown */}
      {timeLeft && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mb-4">
          <GlowCard glowColor={isExpired?'red':expiryPct>80?'orange':'cyan'} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isExpired?'text-red-400':expiryPct>80?'text-orange-400':'text-cyan-400'}`}/>
                <span className="text-slate-300 text-sm font-semibold">Subscription</span>
              </div>
              <span className={`font-mono font-bold text-sm ${isExpired?'text-red-400':expiryPct>80?'text-orange-400':'text-cyan-400'}`}>{timeLeft}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${isExpired?'from-red-500 to-red-600':expiryPct>80?'from-orange-400 to-red-500':cfg?.gradient}`}
                style={{width:`${expiryPct}%`}}/>
            </div>
            {expiryPct>80&&!isExpired&&(
              <button onClick={()=>setShowRenewal(true)} className="mt-2 w-full text-orange-400 text-xs font-bold flex items-center justify-center gap-1 hover:text-orange-300">
                <AlertTriangle className="w-3 h-3"/> Expiring Soon — Tap to Renew
              </button>
            )}
          </GlowCard>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{val:wallet?.balance||0,label:'Coins',color:'text-cyan-400'},{val:profile?.tournaments_won||0,label:'Wins',color:'text-yellow-400'},{val:profile?.total_kills||0,label:'Kills',color:'text-purple-400'}].map(({val,label,color})=>(
          <GlowCard key={label} glowColor="cyan" className="p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{val}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </GlowCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <GamingButton variant="primary" size="md" icon={Trophy}        onClick={()=>navigate(createPageUrl('VIPTournaments'))}>VIP Tournaments</GamingButton>
        <GamingButton variant="secondary" size="md" icon={MessageCircle} onClick={()=>navigate(createPageUrl('VIPChat'))}>VIP Chat</GamingButton>
        <GamingButton variant="outline" size="md" icon={Headphones}    onClick={()=>navigate(createPageUrl('VIPSupport'))}>VIP Support</GamingButton>
        <GamingButton variant="outline" size="md" icon={Coins}         onClick={()=>navigate(createPageUrl('Deposit'))}>Add Coins</GamingButton>
      </div>

      {/* Features */}
      <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Flame className="w-5 h-5 text-yellow-400"/> Your Exclusive Features</h2>
      <div className="space-y-2.5 mb-5">
        {features.map((f,i)=>{
          const FIcon=f.icon; const c=f.color==='gold'?'yellow':f.color;
          return (
            <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}>
              <GlowCard glowColor={f.color} className={`p-4 ${f.page?'cursor-pointer':''}`} animated onClick={f.page?()=>navigate(createPageUrl(f.page)):undefined}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-${c}-500/20 flex items-center justify-center flex-shrink-0`}>
                    <FIcon className={`w-5 h-5 text-${c}-400`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{f.label}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </div>
                  {f.page&&<ChevronRight className="w-4 h-4 text-slate-600"/>}
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {/* Upgrade + Renew */}
      <div className="space-y-3">
        {tier!=='vip_elite'&&(
          <GlowCard glowColor="gold" className="p-4 cursor-pointer" animated onClick={()=>navigate(createPageUrl('VIPPlans'))}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 font-black">Upgrade to {tier==='vip'?'VIP+':'VIP Elite'}</p>
                <p className="text-slate-400 text-xs">Unlock even more exclusive perks</p>
              </div>
              <ChevronRight className="w-5 h-5 text-yellow-400"/>
            </div>
          </GlowCard>
        )}
        <GamingButton variant="outline" size="md" className="w-full" icon={RefreshCw} onClick={()=>setShowRenewal(true)}>Renew Subscription</GamingButton>
      </div>
    </div>
  );
}
