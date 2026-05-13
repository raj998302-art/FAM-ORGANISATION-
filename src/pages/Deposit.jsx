import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, CheckCircle, ArrowRight, CreditCard, Gift, Shield, RefreshCw, Copy, TrendingUp, Wallet, Crown, ChevronRight } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getUserRoles } from '@/lib/permissions';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STEPS = { SELECT:'select', PAYMENT:'payment', SUCCESS:'success' };
const QUICK = [
  {v:49,  t:null},      {v:99,  t:'Popular'},
  {v:199, t:null},      {v:499, t:'Best Value'},
  {v:999, t:null},      {v:1999,t:'MAX'},
];
const VIP_BONUS = { vip_elite:15, vip_plus:10, vip:5 };

export default function Deposit() {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);
  const [wallet, setWallet]       = useState(null);
  const [coins, setCoins]         = useState('');
  const [step, setStep]           = useState(STEPS.SELECT);
  const [result, setResult]       = useState(null);
  const [paying, setPaying]       = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const rzpRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      setUserRoles(getUserRoles(cu));
      const ws = await apiClient.entities.Wallet.filter({ user_email: cu.email });
      if (ws[0]) setWallet(ws[0]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const amt = parseInt(coins) || 0;
  const bonusPct = Object.entries(VIP_BONUS).find(([r]) => userRoles.includes(r))?.[1] || 0;
  const bonusCoins = bonusPct > 0 ? Math.floor(amt * bonusPct / 100) : 0;
  const totalCoins = amt + bonusCoins;

  const loadRzp = () => new Promise(res => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });

  const handlePay = async () => {
    if (amt < 10) { toast.error('Minimum deposit is ₹10'); return; }
    setStep(STEPS.PAYMENT); setPaying(true);
    try {
      const loaded = await loadRzp();
      if (!loaded) throw new Error('Payment gateway failed to load');
      const order = await apiClient.integrations.Payment.CreateOrder(amt, user.email);
      if (order.error) throw new Error(order.error);

      if (order.is_mock) {
        await new Promise(r => setTimeout(r, 1000));
        await apiClient.integrations.Payment.VerifyPayment({ razorpay_order_id:order.id, razorpay_payment_id:`mock_${Date.now()}`, razorpay_signature:'mock_signature', amount:amt, user_email:user.email });
        await onSuccess(`mock_${Date.now()}`); return;
      }

      const options = {
        key: order.key_id, amount: order.amount, currency: order.currency || 'INR',
        name: 'Fire Arena MAX', description: `${totalCoins} Coins${bonusCoins>0?` (+${bonusCoins} VIP bonus)`:''}`,
        order_id: order.id, image: '/icons/icon-192.png',
        handler: async (r) => {
          try {
            await apiClient.integrations.Payment.VerifyPayment({ razorpay_order_id:r.razorpay_order_id, razorpay_payment_id:r.razorpay_payment_id, razorpay_signature:r.razorpay_signature, amount:amt, user_email:user.email });
            await onSuccess(r.razorpay_payment_id);
          } catch(e) { toast.error('Verification failed: '+e.message); setStep(STEPS.SELECT); setPaying(false); }
        },
        prefill: { name:user.full_name||'', email:user.email },
        notes: { coins: totalCoins },
        theme: { color: '#06b6d4' },
        modal: { ondismiss: () => { toast.info('Payment cancelled'); setStep(STEPS.SELECT); setPaying(false); }, escape:false },
      };
      rzpRef.current = new window.Razorpay(options);
      rzpRef.current.on('payment.failed', r => { toast.error('Payment failed: '+(r.error?.description||'Unknown')); setStep(STEPS.SELECT); setPaying(false); });
      rzpRef.current.open();
    } catch(e) { toast.error(e.message||'Payment error'); setStep(STEPS.SELECT); }
    finally { setPaying(false); }
  };

  const onSuccess = async (pid) => {
    const ws = await apiClient.entities.Wallet.filter({ user_email: user.email });
    if (ws[0]) setWallet(ws[0]);
    setResult({ pid, amt, totalCoins, bonusCoins });
    setStep(STEPS.SUCCESS);
    confetti({ particleCount:120, spread:80, origin:{y:0.55} });
    setTimeout(()=>confetti({particleCount:60,angle:120,spread:55,origin:{x:0}}), 400);
    setTimeout(()=>confetti({particleCount:60,angle:60, spread:55,origin:{x:1}}), 600);
  };

  if (loading) return <LoadingScreen message="Loading Wallet…"/>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="text-center mb-6">
        <NeonText color="gold" size="3xl" className="block mb-1"><Coins className="inline w-8 h-8 mr-2 mb-1"/>BUY COINS</NeonText>
        <p className="text-slate-400 text-sm">1 Coin = ₹1 · Instantly added to wallet</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-cyan-500/30">
          <Wallet className="w-4 h-4 text-cyan-400"/>
          <span className="text-slate-400 text-sm">Balance:</span>
          <span className="text-cyan-400 font-black">{wallet?.balance||0} coins</span>
        </div>
      </motion.div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 mb-7">
        {['Amount','Pay','Done'].map((l,i) => {
          const si = [STEPS.SELECT,STEPS.PAYMENT,STEPS.SUCCESS].indexOf(step);
          return (<React.Fragment key={l}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${si>i?'bg-green-500 text-white':si===i?'bg-cyan-500 text-slate-900':'bg-slate-700 text-slate-400'}`}>{si>i?'✓':i+1}</div>
              <span className={`text-xs ${si===i?'text-cyan-400':'text-slate-500'}`}>{l}</span>
            </div>
            {i<2&&<div className={`w-10 h-0.5 mb-5 ${si>i?'bg-green-500':'bg-slate-700'}`}/>}
          </React.Fragment>);
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step===STEPS.SELECT&&(
          <motion.div key="sel" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
            {bonusPct>0&&(
              <GlowCard glowColor="gold" className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0"><Crown className="w-5 h-5 text-yellow-400"/></div>
                  <div className="flex-1"><p className="text-yellow-400 font-bold text-sm">VIP Deposit Bonus Active 🎉</p><p className="text-slate-400 text-xs">You get +{bonusPct}% extra coins on every deposit</p></div>
                  <span className="text-yellow-400 font-black text-xl">+{bonusPct}%</span>
                </div>
              </GlowCard>
            )}

            <GlowCard glowColor="cyan" className="p-5">
              <label className="block text-slate-300 font-semibold mb-2 text-sm">Enter Amount (₹)</label>
              <Input type="number" value={coins} onChange={e=>setCoins(e.target.value)} placeholder="Min ₹10"
                className="bg-slate-800 border-cyan-500/40 text-white text-3xl font-black h-16 text-center mb-3 focus:border-cyan-400" min="10"/>

              <AnimatePresence>
                {amt>=10&&(
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div><p className="text-slate-400 text-xs mb-1">Base</p><p className="text-2xl font-black text-white">{amt}</p></div>
                      {bonusCoins>0&&<><span className="text-slate-500 font-bold">+</span><div><p className="text-yellow-400 text-xs mb-1">VIP Bonus</p><p className="text-2xl font-black text-yellow-400">+{bonusCoins}</p></div><span className="text-slate-500 font-bold">=</span></>}
                      <div><p className="text-cyan-400 text-xs mb-1">You Get</p><p className="text-2xl font-black text-cyan-400">{totalCoins}  coins</p></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-3 gap-2">
                {QUICK.map(({v,t})=>(
                  <button key={v} onClick={()=>setCoins(v.toString())}
                    className={`relative py-2.5 rounded-xl border text-sm font-bold transition-all ${amt===v?'bg-cyan-500/20 border-cyan-400 text-cyan-400':'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-cyan-500/50'}`}>
                    {t&&<span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 text-xs px-1.5 py-0.5 rounded-full font-black whitespace-nowrap">{t}</span>}
                    ₹{v}
                    {bonusPct>0&&<span className="block text-xs text-yellow-400 font-normal">+{Math.floor(v*bonusPct/100)}</span>}
                  </button>
                ))}
              </div>
            </GlowCard>

            <GlowCard glowColor="purple" className="p-4">
              <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2 text-sm"><Shield className="w-4 h-4"/>100% Secure · Instant Credit</h3>
              <div className="grid grid-cols-2 gap-2">
                {[['Razorpay Secured','green'],['Webhook Auto-Recovery','purple'],['Instant Wallet Credit','cyan'],['VIP Bonus Included','yellow']].map(([t,c])=>(
                  <div key={t} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded bg-${c}-500/20 flex items-center justify-center flex-shrink-0`}><CheckCircle className={`w-3 h-3 text-${c}-400`}/></div>
                    <span className="text-slate-400 text-xs">{t}</span>
                  </div>
                ))}
              </div>
            </GlowCard>

            <GamingButton variant="primary" size="lg" className="w-full" disabled={amt<10} onClick={handlePay} icon={ArrowRight}>
              {amt<10 ? 'Enter amount (min ₹10)' : `Pay ₹${amt} → Get ${totalCoins} Coins`}
            </GamingButton>
            {bonusPct===0&&<p className="text-center text-xs text-slate-500">Get VIP for deposit bonuses — <button onClick={()=>navigate(createPageUrl('VIPPlans'))} className="text-cyan-400 hover:underline">View Plans</button></p>}
          </motion.div>
        )}

        {/* STEP 2 */}
        {step===STEPS.PAYMENT&&(
          <motion.div key="pay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <GlowCard glowColor="cyan" className="p-10 text-center flex flex-col items-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"/>
                <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin"/>
                <CreditCard className="absolute inset-0 m-auto w-8 h-8 text-cyan-400"/>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Opening Razorpay…</h3>
              <p className="text-slate-400 text-sm mb-4">₹{amt}{totalCoins>amt?` → ${totalCoins} coins`:''}</p>
              <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full animate-progress w-full" style={{animationDuration:'2.5s'}}/>
              </div>
              <p className="text-slate-600 text-xs mt-4">Do not close this page</p>
            </GlowCard>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step===STEPS.SUCCESS&&result&&(
          <motion.div key="done" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}>
            <GlowCard glowColor="green" className="p-7 text-center mb-4">
              <motion.div animate={{scale:[1,1.2,1]}} transition={{duration:0.5}} className="mb-4">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-400/50">
                  <CheckCircle className="w-12 h-12 text-green-400"/>
                </div>
              </motion.div>
              <NeonText color="green" size="2xl" className="block mb-1">Payment Successful!</NeonText>
              <p className="text-slate-400 text-sm mb-5">Coins added to your wallet instantly</p>
              <div className="bg-slate-800/60 rounded-xl p-4 mb-5 text-left space-y-2.5">
                {[['Amount Paid',`₹${result.amt}`],['Base Coins',`+${result.amt}  coins`],...(result.bonusCoins>0?[[`VIP Bonus (${bonusPct}%)`,`+${result.bonusCoins}  coins`]]:[])].map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm"><span className="text-slate-400">{k}</span><span className="text-white font-bold">{v}</span></div>
                ))}
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-cyan-400 font-bold">Total Credited</span>
                  <span className="text-cyan-400 font-black">+{result.totalCoins}  coins</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">New Balance</span>
                  <span className="text-green-400 font-bold">{wallet?.balance||result.totalCoins} coins</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/50">
                  <span className="text-slate-500">Payment ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono">{result.pid?.slice(0,16)}…</span>
                    <button onClick={()=>{navigator.clipboard.writeText(result.pid);toast.success('Copied!');}} className="text-slate-500 hover:text-slate-300"><Copy className="w-3 h-3"/></button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <GamingButton variant="outline" size="md" icon={RefreshCw} onClick={()=>{setStep(STEPS.SELECT);setCoins('');setResult(null);}}>Deposit More</GamingButton>
                <GamingButton variant="primary" size="md" icon={TrendingUp} onClick={()=>navigate(createPageUrl('VIPPlans'))}>Go VIP</GamingButton>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
