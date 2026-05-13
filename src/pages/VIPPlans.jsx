import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Zap, CheckCircle, ArrowRight, Trophy, Users, Gift, Calendar, Shield, Sparkles, ChevronLeft, ChevronDown } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { getUserRoles } from '@/lib/permissions';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const DURATIONS = [
  { id: 'weekly',    label: '7 Days',   days: 7,   mult: 1,    badge: null,         savings: null,  weeklyEq: null },
  { id: 'monthly',   label: '30 Days',  days: 30,  mult: 3.5,  badge: 'POPULAR',    savings: '12%', weeklyEq: 'Most picked' },
  { id: 'quarterly', label: '90 Days',  days: 90,  mult: 9.5,  badge: null,         savings: '21%', weeklyEq: 'Great value' },
  { id: 'yearly',    label: '365 Days', days: 365, mult: 28,   badge: 'BEST VALUE', savings: '46%', weeklyEq: 'Best deal' },
];

const TIERS = [
  {
    id: 'vip',      role: 'vip',       label: 'VIP',       subtitle: 'Level Up Your Game',
    icon: 'star',   color: 'cyan',     glowColor: '#06b6d4',  weeklyBase: 39,
    gradient: 'from-cyan-600 to-blue-600',
    perks: [
      { icon: Trophy,    text: 'VIP-only tournaments (bigger prizes)' },
      { icon: Gift,      text: '+25% coin bonus on every deposit' },
      { icon: Users,     text: 'Exclusive VIP community chat' },
      { icon: Zap,       text: '2× daily XP multiplier' },
      { icon: Star,      text: 'VIP badge on profile & leaderboard' },
      { icon: Shield,    text: 'Priority customer support' },
    ],
  },
  {
    id: 'vip_plus', role: 'vip_plus',  label: 'VIP+',      subtitle: 'Dominate the Arena',
    icon: 'diamond', color: 'purple',  glowColor: '#a855f7', weeklyBase: 79,
    popular: true,
    gradient: 'from-purple-600 to-pink-600',
    perks: [
      { icon: Trophy,    text: 'Everything in VIP +' },
      { icon: Gift,      text: '+50% coin bonus on every deposit' },
      { icon: Zap,       text: '3× daily XP multiplier' },
      { icon: Shield,    text: 'Custom VIP+ profile frame' },
      { icon: Star,      text: 'Animated VIP+ badge with glow' },
      { icon: Users,     text: 'VIP+ exclusive tournament slots' },
      { icon: Sparkles,  text: 'Seasonal exclusive rewards' },
      { icon: Calendar,  text: 'Priority match slot reservations' },
    ],
  },
  {
    id: 'vip_elite', role: 'vip_elite', label: 'ELITE',     subtitle: 'The Ultimate Champion',
    icon: 'crown',  color: 'gold',     glowColor: '#f59e0b', weeklyBase: 149,
    elite: true,
    gradient: 'from-yellow-500 to-orange-500',
    perks: [
      { icon: Crown,     text: 'Everything in VIP+ +' },
      { icon: Gift,      text: '+100% deposit bonus — DOUBLE coins!' },
      { icon: Zap,       text: '5× daily XP multiplier' },
      { icon: Trophy,    text: '2 free tournament entries every month' },
      { icon: Shield,    text: 'Exclusive Elite animated profile frame' },
      { icon: Star,      text: 'Elite crown badge with golden glow' },
      { icon: Gift,      text: 'Monthly mystery reward crate' },
      { icon: Users,     text: 'Direct line to FAM Manager support' },
      { icon: Sparkles,  text: 'Elite Championship seasonal invites' },
      { icon: Calendar,  text: 'Early access to all new features' },
    ],
  },
];

const COMPARE_ROWS = [
  { label: 'Deposit Bonus',        vip: '+25%',      vip_plus: '+50%',    vip_elite: '+100%' },
  { label: 'XP Multiplier',        vip: '2×',        vip_plus: '3×',      vip_elite: '5×'    },
  { label: 'VIP Chat Access',      vip: '✓',         vip_plus: '✓',       vip_elite: '✓'     },
  { label: 'VIP Tournaments',      vip: '✓',         vip_plus: '✓',       vip_elite: '✓'     },
  { label: 'Profile Frame',        vip: '—',         vip_plus: 'Custom',  vip_elite: 'Elite' },
  { label: 'Free Tournament Entry',vip: '—',         vip_plus: '—',       vip_elite: '2/mo'  },
  { label: 'Support Priority',     vip: 'Normal',    vip_plus: 'High',    vip_elite: 'Direct'},
  { label: 'Mystery Reward Crate', vip: '—',         vip_plus: '—',       vip_elite: 'Monthly'},
  { label: 'Seasonal Championship',vip: '—',         vip_plus: '—',       vip_elite: 'Invite'},
];

const FAQ = [
  { q: 'Can I upgrade my VIP mid-subscription?', a: 'Yes! Upgrading is instant. You only pay the price difference.' },
  { q: 'Does VIP expire automatically?', a: 'Yes, your VIP expires after the selected duration. Renew before expiry to keep all benefits.' },
  { q: 'Is the yearly plan the cheapest?', a: 'Yes! The yearly plan saves up to 46% compared to the weekly rate.' },
  { q: 'Can I get a refund after purchase?', a: 'VIP plans are non-refundable once activated as digital goods. Please review before purchasing.' },
  { q: 'Are VIP tournaments different?', a: 'VIP tournaments have higher prize pools and are exclusive to VIP members only.' },
];

const fireConfetti = (color) => {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: [color, '#ffffff', '#f59e0b'] });
  setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { y: 0.7, x: 0.2 }, colors: [color] }), 300);
  setTimeout(() => confetti({ particleCount: 50, spread: 120, origin: { y: 0.7, x: 0.8 }, colors: [color] }), 500);
};

export default function VIPPlans() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [selectedDur, setSelectedDur] = useState('monthly');
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      const wallets = await apiClient.entities.Wallet.filter({ user_email: cu.email }).catch(() => []);
      setWallet(wallets[0] || null);
    } catch {}
    finally { setLoading(false); }
  };

  const userRoles = getUserRoles(user);
  const currentVIP = ['vip_elite', 'vip_plus', 'vip'].find(r => userRoles.includes(r));
  const tierRank = { vip: 1, vip_plus: 2, vip_elite: 3 };

  const getPrice = (tier, durId) => {
    const d = DURATIONS.find(x => x.id === durId);
    return Math.floor(tier.weeklyBase * (d?.mult || 1));
  };

  const handleBuy = async () => {
    if (!confirmPlan) return;
    const { tier, durId } = confirmPlan;
    const dur = DURATIONS.find(d => d.id === durId);
    const price = getPrice(tier, durId);
    const balance = wallet?.balance || 0;
    if (balance < price) {
      toast.error(`Need ₹${price} but you have ₹${balance}. Please deposit first.`);
      navigate(createPageUrl('Wallet'));
      return;
    }
    setBuying(tier.id + '_' + durId);
    try {
      await apiClient.integrations.Payment.SubscribeVIP({
        planId: `${tier.id}_${durId}`,
        role: tier.role,
        price,
        days: dur.days,
      });
      setConfirmPlan(null);
      fireConfetti(tier.glowColor);
      setTimeout(() => toast.success(`${tier.label} activated for ${dur.label}! Enjoy your perks!`), 400);
      await loadData();
    } catch (e) {
      toast.error(e.message || 'Purchase failed. Try again.');
    } finally { setBuying(null); }
  };

  if (loading) return <LoadingScreen message="Loading VIP plans..." />;

  const dur = DURATIONS.find(d => d.id === selectedDur);

  return (
    <div className="min-h-screen bg-slate-950 pb-28 overflow-x-hidden">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden px-4 pt-14 pb-10">
        {/* Animated BG orbs */}
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 left-0 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -top-10 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <button onClick={() => navigate(-1)} className="absolute -top-10 left-0 p-2 text-slate-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.6 }}
              className="inline-block mb-4">
              <AppEmoji name="crown" size={80} />
            </motion.div>
            <NeonText color="gold" size="3xl" className="block mb-1">VIP MEMBERSHIP</NeonText>
            <p className="text-slate-400 text-sm">Premium perks · Bigger prizes · Exclusive access</p>

            {currentVIP && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/15 border border-green-500/40 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">
                  {currentVIP.replace('_', ' ').toUpperCase()} — Active
                </span>
              </motion.div>
            )}

            {/* Wallet balance */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full">
              <AppEmoji name="coins" size={16} />
              <span className="text-white text-sm font-bold">Balance: ₹{wallet?.balance || 0}</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Duration Selector ───────────────────────────────── */}
      <div className="px-4 mb-8">
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-1.5 flex gap-1">
          {DURATIONS.map(d => (
            <button key={d.id} onClick={() => setSelectedDur(d.id)}
              className={`relative flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                selectedDur === d.id
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-500 text-white shadow-xl shadow-yellow-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}>
              {d.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap z-10">
                  {d.badge}
                </span>
              )}
              <p className="leading-tight">{d.label}</p>
              {d.savings && <p className={`text-[9px] mt-0.5 ${selectedDur === d.id ? 'text-green-200' : 'text-green-500'}`}>Save {d.savings}</p>}
            </button>
          ))}
        </div>
        {dur?.weeklyEq && (
          <p className="text-center text-slate-500 text-xs mt-2">{dur.weeklyEq}</p>
        )}
      </div>

      {/* ── VIP Tier Cards ──────────────────────────────────── */}
      <div className="px-4 space-y-6 mb-8">
        {TIERS.map((tier, i) => {
          const price = getPrice(tier, selectedDur);
          const owned = userRoles.includes(tier.role);
          const isUpgrade = currentVIP && (tierRank[tier.role] || 0) > (tierRank[currentVIP] || 0);
          const buyingThis = buying?.startsWith(tier.id);
          const c = tier.color;

          return (
            <motion.div key={tier.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.13, type: 'spring' }}>
              <div className={`relative rounded-2xl overflow-hidden ${
                tier.elite ? 'shadow-[0_0_50px_rgba(245,158,11,0.3)]' :
                tier.popular ? 'shadow-[0_0_30px_rgba(168,85,247,0.2)]' : ''
              }`} style={{ border: `1.5px solid ${tier.glowColor}35` }}>
                {/* Top gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${tier.gradient}`} />

                {/* Elite shimmer overlay */}
                {tier.elite && (
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent pointer-events-none z-0"
                  />
                )}

                {/* Popular/Elite badge */}
                {(tier.popular || tier.elite) && (
                  <div className={`absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full text-[10px] font-black ${
                    tier.elite ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' :
                    'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}>
                    {tier.elite ? 'ELITE' : 'POPULAR'}
                  </div>
                )}

                <div className="relative z-10 bg-slate-900/97 p-5">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <motion.div
                      animate={tier.elite ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg`}>
                      <AppEmoji name={tier.icon} size={36} />
                    </motion.div>
                    <div>
                      <h3 className={`text-2xl font-black text-${c}-400`}>{tier.label}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{tier.subtitle}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className={`mb-5 p-4 rounded-xl border ${
                    tier.elite ? 'bg-yellow-500/8 border-yellow-500/25' :
                    tier.popular ? 'bg-purple-500/8 border-purple-500/25' :
                    'bg-cyan-500/8 border-cyan-500/25'
                  }`}>
                    <div className="flex items-end gap-3">
                      <motion.span
                        key={price}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-4xl font-black text-${c}-400`}
                      >₹{price}</motion.span>
                      <div className="mb-1 flex-1">
                        <p className="text-slate-400 text-xs">for {dur?.label}</p>
                        <p className="text-slate-500 text-[10px]">= ₹{Math.floor(price / (dur?.days || 7))}/day</p>
                      </div>
                    </div>
                    {dur?.savings && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-green-400 text-xs font-bold bg-green-500/15 px-2 py-0.5 rounded-full">
                          Save {dur.savings} vs weekly
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Perks list */}
                  <div className="space-y-2.5 mb-5">
                    {tier.perks.map((perk, pi) => (
                      <motion.div key={pi} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + pi * 0.04 }}
                        className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg bg-${c}-500/15 border border-${c}-500/20 flex items-center justify-center flex-shrink-0`}>
                          <perk.icon className={`w-3.5 h-3.5 text-${c}-400`} />
                        </div>
                        <span className="text-slate-300 text-sm">{perk.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  {owned ? (
                    <div className="w-full py-3.5 rounded-xl bg-green-500/15 border border-green-500/40 flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-bold">Currently Active</span>
                    </div>
                  ) : (
                    <GamingButton
                      variant={tier.elite ? 'gold' : tier.popular ? 'purple' : 'primary'}
                      size="lg"
                      className="w-full"
                      loading={buyingThis}
                      icon={isUpgrade ? ArrowRight : Crown}
                      onClick={() => setConfirmPlan({ tier, durId: selectedDur })}
                    >
                      {isUpgrade ? `Upgrade to ${tier.label}` : `Get ${tier.label} — ₹${price}`}
                    </GamingButton>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Compare Plans ───────────────────────────────────── */}
      <div className="px-4 mb-8">
        <button onClick={() => setShowCompare(!showCompare)}
          className="w-full py-3.5 rounded-xl border border-slate-700/50 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 text-sm font-bold flex items-center justify-center gap-2 transition-all">
          {showCompare ? 'Hide' : 'Compare'} All Plans
          <motion.div animate={{ rotate: showCompare ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.div>
        </button>

        <AnimatePresence>
          {showCompare && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 border-b border-slate-700 bg-slate-800/50">
                  <div className="p-3 text-slate-500 text-xs font-bold">Feature</div>
                  {TIERS.map(t => (
                    <div key={t.id} className={`p-3 text-xs font-black text-center text-${t.color}-400`}>{t.label}</div>
                  ))}
                </div>
                {COMPARE_ROWS.map((row, i) => (
                  <div key={i} className={`grid grid-cols-4 border-b border-slate-800/80 ${i % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                    <div className="p-2.5 text-slate-400 text-xs">{row.label}</div>
                    <div className="p-2.5 text-cyan-400 text-xs text-center font-bold">{row.vip}</div>
                    <div className="p-2.5 text-purple-400 text-xs text-center font-bold">{row.vip_plus}</div>
                    <div className="p-2.5 text-yellow-400 text-xs text-center font-bold">{row.vip_elite}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <div className="px-4 mb-8">
        <NeonText color="cyan" size="lg" className="block mb-3">FAQ</NeonText>
        <div className="space-y-2">
          {FAQ.map((faq, i) => (
            <div key={i} className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left">
                <span className="text-white font-semibold text-sm pr-3">{faq.q}</span>
                <motion.div animate={{ rotate: expandedFaq === i ? 180 : 0 }}>
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="px-4 pb-4 text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confirm Purchase Bottom Sheet ───────────────────── */}
      <AnimatePresence>
        {confirmPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setConfirmPlan(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6"
              onClick={e => e.stopPropagation()}>
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${confirmPlan.tier.gradient} flex items-center justify-center`}>
                  <AppEmoji name={confirmPlan.tier.icon} size={32} />
                </div>
                <div>
                  <p className="text-white font-black text-xl">{confirmPlan.tier.label}</p>
                  <p className="text-slate-400 text-sm">{DURATIONS.find(d => d.id === confirmPlan.durId)?.label} plan</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-white font-bold">{confirmPlan.tier.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-bold">{DURATIONS.find(d => d.id === confirmPlan.durId)?.label}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between">
                  <span className="text-white font-bold">Total Price</span>
                  <span className={`font-black text-xl text-${confirmPlan.tier.color}-400`}>
                    ₹{getPrice(confirmPlan.tier, confirmPlan.durId)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Your balance</span>
                  <span className={`font-bold ${(wallet?.balance||0) >= getPrice(confirmPlan.tier, confirmPlan.durId) ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{wallet?.balance || 0}
                  </span>
                </div>
              </div>

              <GamingButton
                variant={confirmPlan.tier.elite ? 'gold' : confirmPlan.tier.popular ? 'purple' : 'primary'}
                size="lg"
                className="w-full mb-3"
                loading={!!buying}
                icon={Crown}
                onClick={handleBuy}
              >
                Confirm & Activate {confirmPlan.tier.label}
              </GamingButton>
              <button onClick={() => setConfirmPlan(null)} className="w-full py-3 text-slate-400 font-bold text-sm hover:text-white">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
